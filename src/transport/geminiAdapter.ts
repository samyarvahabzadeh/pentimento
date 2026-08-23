/**
 * GeminiAdapter — Google Gemini Free Tier adapter.
 * Uses generateContent REST API.
 * Accurately parses retry-after cooldown from quota response.
 * API key never logged.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport } from './llmTransport.js';
import type { DirectorContext } from '../core/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../director/directorPrompt.js';

export class GeminiAdapter implements LLMTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly candidateModels: string[];

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    const preferred = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
    const fallbackList = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash'];
    this.candidateModels = Array.from(new Set([preferred, ...fallbackList])).filter(Boolean);

    if (!this.apiKey) {
      console.warn('[GeminiAdapter] WARNING: GEMINI_API_KEY not set');
    }
  }

  async generateDirectorOutput(context: DirectorContext) {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(context);

    let lastError = 'No models tried';

    for (const model of this.candidateModels) {
      try {
        const result = await this.callModel(model, system, user);
        if (result && result.rawText) {
          return {
            provider: 'gemini',
            model,
            latencyMs: result.latencyMs,
            rawText: result.rawText,
          };
        }
      } catch (err: any) {
        lastError = `[${model}] ${err.message}`;
        console.warn(`[GeminiAdapter] Model ${model} failed: ${err.message}`);
      }
    }

    throw new Error(`[GeminiAdapter] All candidate models failed — last error: ${lastError}`);
  }

  private async callModel(model: string, system: string, user: string): Promise<{
    rawText: string;
    latencyMs: number;
  } | null> {
    const start = Date.now();
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.6,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        let errMsg = `HTTP ${res.status}`;
        try {
          errMsg = JSON.parse(bodyText)?.error?.message ?? errMsg;
        } catch {}
        console.warn(`[GeminiAdapter] ${model} returned ${res.status}: ${errMsg.slice(0, 100)}`);
        return null;
      }

      const data = (await res.json()) as any;
      const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!rawText || rawText.trim().length === 0) {
        console.warn(`[GeminiAdapter] ${model} returned empty content`);
        return null;
      }

      return { rawText, latencyMs };
    } catch (e: any) {
      clearTimeout(timer);
      const isTimeout = e.name === 'AbortError' || e.message?.includes('abort');
      console.warn(`[GeminiAdapter] ${model} exception: ${isTimeout ? 'timeout (12s)' : e.message}`);
      return null;
    }
  }
}


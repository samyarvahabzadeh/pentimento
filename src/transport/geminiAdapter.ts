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
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.model = process.env.GEMINI_MODEL ?? 'gemini-3.6-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      console.warn('[GeminiAdapter] WARNING: GEMINI_API_KEY not set');
    }
  }

  async generateDirectorOutput(context: DirectorContext) {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(context);

    let attempts = 0;
    let result = await this.callOnce(system, user);
    while (result.shouldRetry && attempts < 3) {
      attempts++;
      const match = result.failReason.match(/wait ([0-9]+)s/);
      const waitMs = match ? parseInt(match[1], 10) * 1000 : 25000;
      console.warn(`[GeminiAdapter] Retry (${attempts}/3) waiting ${waitMs / 1000}s after: ${result.failReason}`);
      await new Promise(r => setTimeout(r, waitMs));
      result = await this.callOnce(system, user);
    }

    if (!result.rawText) {
      throw new Error(`[GeminiAdapter] All attempts failed — last error: ${result.failReason}`);
    }

    return {
      provider: 'gemini',
      model: this.model,
      latencyMs: result.latencyMs,
      rawText: result.rawText,
    };
  }

  private async callOnce(system: string, user: string): Promise<{
    rawText: string | null;
    latencyMs: number;
    shouldRetry: boolean;
    failReason: string;
  }> {
    const start = Date.now();
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);

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

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        return { rawText: null, latencyMs, shouldRetry: false, failReason: `HTTP ${res.status}` };
      }
      if (res.status === 429) {
        const body = await res.text().catch(() => '');
        const match = body.match(/retry in ([0-9.]+)s/i);
        const waitSec = match ? Math.ceil(parseFloat(match[1])) + 5 : 30;
        return { rawText: null, latencyMs, shouldRetry: true, failReason: `429 rate-limited (wait ${waitSec}s)` };
      }
      if (res.status === 503) {
        return { rawText: null, latencyMs, shouldRetry: true, failReason: `503 model temporarily busy (wait 15s)` };
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { rawText: null, latencyMs, shouldRetry: true, failReason: `HTTP ${res.status}: ${body.slice(0, 80)}` };
      }

      const data = await res.json() as any;
      const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!rawText || rawText.trim().length === 0) {
        const reason = data?.candidates?.[0]?.finishReason ?? 'empty';
        return { rawText: null, latencyMs, shouldRetry: true, failReason: `empty content (${reason})` };
      }

      return { rawText, latencyMs, shouldRetry: false, failReason: '' };

    } catch (e: any) {
      const latencyMs = Date.now() - start;
      const isTimeout = e.name === 'AbortError' || e.message?.includes('abort');
      return {
        rawText: null,
        latencyMs,
        shouldRetry: isTimeout,
        failReason: isTimeout ? 'timeout' : e.message?.slice(0, 80) ?? 'unknown',
      };
    }
  }
}

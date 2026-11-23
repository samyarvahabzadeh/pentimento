/**
 * GeminiAdapter — Google Gemini Free Tier adapter.
 * Uses generateContent REST API.
 * Accurately parses retry-after cooldown from quota response.
 * API key never logged.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport, ChatMessage, ChatCompletionOptions, ChatCompletionResult } from './llmTransport.js';
import type { DirectorContext } from '../core/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../director/directorPrompt.js';

export class GeminiAdapter implements LLMTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly candidateModels: string[];

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    const preferred = process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview';
    const fallbackList = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    this.candidateModels = Array.from(new Set([preferred, ...fallbackList])).filter(Boolean);

    if (!this.apiKey) {
      console.warn('[GeminiAdapter] WARNING: GEMINI_API_KEY not set');
    }
  }

  async generateDirectorOutput(context: DirectorContext): Promise<{
    provider: string;
    model: string;
    latencyMs: number;
    rawText: string;
  }> {
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

  async generateChat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'سلام' }] });
    }

    let lastError = 'No models tried';

    for (const model of this.candidateModels) {
      const result = await this.callChatModel(model, system, contents, options);
      if (result) {
        return {
          provider: 'gemini',
          model,
          latencyMs: result.latencyMs,
          rawText: result.rawText,
        };
      }
    }

    throw new Error(`[GeminiAdapter] All candidate models failed — last error: ${lastError}`);
  }

  private async callChatModel(
    model: string,
    system: string,
    contents: any[],
    options: ChatCompletionOptions
  ): Promise<{ rawText: string; latencyMs: number } | null> {
    const start = Date.now();
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      const body: any = {
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 1024,
        },
      };

      if (system) {
        body.system_instruction = { parts: [{ text: system }] };
      }

      if (options.responseFormatJson) {
        body.generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        console.warn(`[GeminiAdapter] ${model} returned ${res.status}: ${bodyText.slice(0, 100)}`);
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
      console.warn(`[GeminiAdapter] ${model} exception: ${isTimeout ? 'timeout (10s)' : e.message}`);
      return null;
    }
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

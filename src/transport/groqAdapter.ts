/**
 * GroqAdapter — OpenAI-compatible adapter for Groq free tier.
 * Supports primary model with one controlled retry on timeout/empty/malformed.
 * API key never logged.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport } from './llmTransport.js';
import type { DirectorContext } from '../core/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../director/directorPrompt.js';

export class GroqAdapter implements LLMTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly candidateModels: string[];

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY ?? '';
    this.baseUrl = (process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    
    const preferred = process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b';
    const fallbackList = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
    this.candidateModels = Array.from(new Set([preferred, ...fallbackList])).filter(Boolean);

    if (!this.apiKey) {
      console.warn('[GroqAdapter] WARNING: GROQ_API_KEY not set');
    }
  }

  async generateDirectorOutput(context: DirectorContext) {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(context);

    let lastError = 'No models tried';

    for (const model of this.candidateModels) {
      const result = await this.callOnce(model, system, user);
      if (result.rawText) {
        return {
          provider: 'groq',
          model: result.model,
          latencyMs: result.latencyMs,
          rawText: result.rawText,
        };
      }
      lastError = `[${model}] ${result.failReason}`;
      console.warn(`[GroqAdapter] Model ${model} failed: ${result.failReason}`);
    }

    throw new Error(`[GroqAdapter] All candidate models failed — last error: ${lastError}`);
  }

  private async callOnce(model: string, system: string, user: string): Promise<{
    rawText: string | null;
    model: string;
    latencyMs: number;
    shouldRetry: boolean;
    failReason: string;
  }> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      // Hard errors — no retry
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        const body = await res.text();
        return { rawText: null, model, latencyMs, shouldRetry: false, failReason: `HTTP ${res.status}` };
      }

      // Rate limit — no retry (different window)
      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after') ?? '?';
        return { rawText: null, model, latencyMs, shouldRetry: false, failReason: `429 rate-limited (retry-after:${retryAfter}s)` };
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { rawText: null, model, latencyMs, shouldRetry: true, failReason: `HTTP ${res.status}: ${body.slice(0, 80)}` };
      }

      const data = await res.json() as any;
      const rawText: string = data.choices?.[0]?.message?.content ?? '';
      const returnedModel: string = data.model ?? model;

      if (!rawText || rawText.trim().length === 0) {
        return { rawText: null, model: returnedModel, latencyMs, shouldRetry: true, failReason: 'empty content' };
      }

      return { rawText, model: returnedModel, latencyMs, shouldRetry: false, failReason: '' };

    } catch (e: any) {
      const latencyMs = Date.now() - start;
      const isTimeout = e.name === 'AbortError' || e.message?.includes('abort');
      return {
        rawText: null,
        model,
        latencyMs,
        shouldRetry: isTimeout, // retry on timeout only
        failReason: isTimeout ? 'timeout' : e.message?.slice(0, 80) ?? 'unknown',
      };
    }
  }
}

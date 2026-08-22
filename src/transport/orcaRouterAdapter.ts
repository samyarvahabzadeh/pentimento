/**
 * OrcaRouterAdapter — OpenAI-compatible adapter for OrcaRouter.
 * Uses primary fast model (deepseek-v4-flash-free) with 20s timeout.
 * Long fallback model (Pro) is excluded from interactive path to maintain low latency.
 * API key never logged.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport } from './llmTransport.js';
import type { DirectorContext } from '../core/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../director/directorPrompt.js';

export class OrcaRouterAdapter implements LLMTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly primaryModel: string;

  constructor() {
    this.apiKey = process.env.ORCAROUTER_API_KEY ?? '';
    this.baseUrl = (process.env.ORCAROUTER_BASE_URL ?? 'https://api.orcarouter.ai/v1').replace(/\/$/, '');
    this.primaryModel = process.env.ORCAROUTER_PRIMARY_MODEL ?? 'deepseek/deepseek-v4-flash-free';

    if (!this.apiKey) {
      console.warn('[OrcaRouterAdapter] WARNING: ORCAROUTER_API_KEY not set');
    }
  }

  async generateDirectorOutput(context: DirectorContext) {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(context);

    const result = await this.tryModel(this.primaryModel, system, user);
    if (!result) {
      throw new Error(`[OrcaRouterAdapter] Primary model ${this.primaryModel} failed to respond in time.`);
    }

    return result;
  }

  private async tryModel(
    model: string,
    system: string,
    user: string
  ): Promise<{ provider: string; model: string; latencyMs: number; rawText: string } | null> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

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
          temperature: 0.6,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (res.status === 429 || res.status === 401 || res.status === 403) {
        const retryAfter = res.headers.get('retry-after');
        const body = await res.text().catch(() => '');
        const code = (() => { try { return JSON.parse(body)?.error?.code ?? `HTTP ${res.status}`; } catch { return `HTTP ${res.status}`; } })();
        console.warn(`Model ${model} failed: ${code}${retryAfter ? ` (retry-after:${retryAfter}s)` : ''}`);
        return null;
      }

      if (!res.ok) {
        console.warn(`Model ${model} failed: HTTP ${res.status}`);
        return null;
      }

      const data = await res.json() as any;
      const rawText: string = data.choices?.[0]?.message?.content ?? '';

      if (!rawText || rawText.trim().length === 0) {
        console.warn(`Model ${model} failed: empty content`);
        return null;
      }

      return { provider: 'orcarouter', model: data.model ?? model, latencyMs, rawText };

    } catch (e: any) {
      const latencyMs = Date.now() - start;
      const label = e.name === 'AbortError' ? 'timeout (20s)' : e.message?.slice(0, 80) ?? 'error';
      console.warn(`Model ${model} failed: ${label}`);
      return null;
    }
  }
}

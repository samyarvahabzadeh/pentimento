/**
 * GroqAdapter — OpenAI-compatible adapter for Groq.
 * Fast, reliable, with ultra-low latency.
 * API key never logged.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport, ChatMessage, ChatCompletionOptions, ChatCompletionResult } from './llmTransport.js';
import type { DirectorContext } from '../core/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../director/directorPrompt.js';

export class GroqAdapter implements LLMTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly candidateModels: string[];

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY ?? '';
    this.baseUrl = (process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, '');

    const preferred = process.env.GROQ_MODEL ?? 'qwen/qwen3.8-27b';
    const fallbackList = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
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

  async generateChat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    let lastError = 'No models tried';

    for (const model of this.candidateModels) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const start = Date.now();

      try {
        const outboundMessages = [...messages];
        if (options.responseFormatJson) {
          const hasJsonWord = outboundMessages.some(m => /json/i.test(m.content));
          if (!hasJsonWord && outboundMessages.length > 0) {
            outboundMessages[0] = {
              ...outboundMessages[0],
              content: `${outboundMessages[0].content}\n\n(Output must be valid JSON format)`,
            };
          }
        }

        const body: any = {
          model,
          messages: outboundMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 350,
        };

        if (options.responseFormatJson) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timer);
        const latencyMs = Date.now() - start;

        if (res.ok) {
          const data = (await res.json()) as any;
          const rawText: string = data.choices?.[0]?.message?.content ?? '';
          if (rawText.trim().length > 0) {
            return {
              provider: 'groq',
              model,
              latencyMs,
              rawText,
            };
          }
        } else {
          const errText = await res.text().catch(() => '');
          lastError = `[${model}] HTTP ${res.status}: ${errText.slice(0, 100)}`;
        }
      } catch (err: any) {
        clearTimeout(timer);
        lastError = `[${model}] ${err.name === 'AbortError' ? 'timeout (8s)' : err.message}`;
      }
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
      const timer = setTimeout(() => controller.abort(), 12_000);

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

      if (!res.ok) {
        return { rawText: null, model, latencyMs, shouldRetry: false, failReason: `HTTP ${res.status}` };
      }

      const data = await res.json() as any;
      const rawText: string = data.choices?.[0]?.message?.content ?? '';

      if (!rawText || rawText.trim().length === 0) {
        return { rawText: null, model, latencyMs, shouldRetry: false, failReason: 'Empty response' };
      }

      return { rawText, model: data.model ?? model, latencyMs, shouldRetry: false, failReason: '' };
    } catch (e: any) {
      const latencyMs = Date.now() - start;
      const isTimeout = e.name === 'AbortError' || e.message?.includes('abort');
      return { rawText: null, model, latencyMs, shouldRetry: false, failReason: isTimeout ? 'timeout (12s)' : e.message };
    }
  }
}

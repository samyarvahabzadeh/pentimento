/**
 * OpenRouterAdapter — Connects Pentimento to OpenRouter's ecosystem of LLMs.
 * Supports Meta Llama 3.3 70B, Qwen 2.5 72B, DeepSeek, and Nemotron models.
 * Includes graceful model fallbacks and clean error handling.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport, ChatMessage, ChatCompletionOptions, ChatCompletionResult } from './llmTransport.js';
import type { DirectorContext } from '../core/types.js';
import { buildSystemPrompt, buildUserPrompt } from '../director/directorPrompt.js';

export class OpenRouterAdapter implements LLMTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly candidateModels: string[];

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? '';
    this.baseUrl = (process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '');

    const preferred = process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-3-ultra-550b-a55b:free';
    const fallbackList = [
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'openrouter/free',
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      'meta-llama/llama-3.3-70b-instruct',
    ];

    this.candidateModels = Array.from(new Set([preferred, ...fallbackList])).filter(Boolean);

    if (!this.apiKey) {
      console.warn('[OpenRouterAdapter] WARNING: OPENROUTER_API_KEY not set');
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

    return this.generateChat(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { responseFormatJson: true, maxTokens: 1024, temperature: 0.6 }
    );
  }

  async generateChat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResult> {
    let lastError = 'No models tried';

    for (const model of this.candidateModels) {
      const result = await this.callModel(model, messages, options);
      if (result) {
        return {
          provider: 'openrouter',
          model,
          latencyMs: result.latencyMs,
          rawText: result.rawText,
        };
      }
    }

    throw new Error(`[OpenRouterAdapter] All candidate models failed — last error: ${lastError}`);
  }

  private async callModel(
    model: string,
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<{ rawText: string; latencyMs: number } | null> {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 16_000);

    try {
      const body: any = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: Math.min(options.maxTokens ?? 200, 250),
      };

      if (options.responseFormatJson) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://pentimento-bot.onrender.com',
          'X-Title': 'Pentimento RPG',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.warn(`[OpenRouterAdapter] ${model} failed (HTTP ${res.status}): ${errorText.slice(0, 150)}`);
        return null;
      }

      const data = (await res.json()) as any;
      const rawText: string = data.choices?.[0]?.message?.content ?? '';

      if (!rawText || rawText.trim().length === 0) {
        console.warn(`[OpenRouterAdapter] ${model} returned empty content`);
        return null;
      }

      return { rawText, latencyMs };
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
      console.warn(`[OpenRouterAdapter] ${model} exception: ${isTimeout ? 'timeout (9s)' : err.message}`);
      return null;
    }
  }
}

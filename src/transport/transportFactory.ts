/**
 * Transport factory — resolves ACTIVE_PROVIDER env var to the correct adapter.
 * Single place for provider selection. No game logic here.
 *
 * ACTIVE_PROVIDER values: openrouter | gemini | groq | orcarouter
 * Default: openrouter (if OPENROUTER_API_KEY set) or gemini
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport, ChatMessage, ChatCompletionOptions, ChatCompletionResult } from './llmTransport.js';
import { OpenRouterAdapter } from './openRouterAdapter.js';
import { GeminiAdapter } from './geminiAdapter.js';
import { GroqAdapter } from './groqAdapter.js';
import { OrcaRouterAdapter } from './orcaRouterAdapter.js';

class ResilientCompositeTransport implements LLMTransport {
  private transports: LLMTransport[];

  constructor(transports: LLMTransport[]) {
    this.transports = transports;
  }

  async generateDirectorOutput(context: any) {
    let lastError: Error | null = null;

    for (const transport of this.transports) {
      try {
        return await transport.generateDirectorOutput(context);
      } catch (err: any) {
        lastError = err;
        console.warn(`[Transport] Director provider failed: ${err.message}. Trying next fallback...`);
      }
    }

    throw lastError ?? new Error('[Transport] All providers failed');
  }

  async generateChat(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    let lastError: Error | null = null;

    for (const transport of this.transports) {
      if (typeof transport.generateChat === 'function') {
        try {
          return await transport.generateChat(messages, options);
        } catch (err: any) {
          lastError = err;
          console.warn(`[Transport] Chat provider failed: ${err.message}. Trying next fallback...`);
        }
      }
    }

    throw lastError ?? new Error('[Transport] All chat providers failed');
  }
}

export function createTransport(): LLMTransport {
  const provider = (process.env.ACTIVE_PROVIDER ?? 'groq').toLowerCase().trim();

  const openrouter = new OpenRouterAdapter();
  const groq = new GroqAdapter();
  const gemini = new GeminiAdapter();
  const orca = new OrcaRouterAdapter();

  let orderedTransports: LLMTransport[] = [];

  switch (provider) {
    case 'groq':
      orderedTransports = [groq, gemini, openrouter, orca];
      break;
    case 'gemini':
      orderedTransports = [gemini, groq, openrouter, orca];
      break;
    case 'openrouter':
      orderedTransports = [openrouter, groq, gemini, orca];
      break;
    default:
      orderedTransports = [groq, gemini, openrouter, orca];
      break;
  }

  return new ResilientCompositeTransport(orderedTransports);
}

/**
 * Transport factory — resolves ACTIVE_PROVIDER env var to the correct adapter.
 * Single place for provider selection. No game logic here.
 *
 * ACTIVE_PROVIDER values: groq | gemini | orcarouter
 * Default: groq
 */
import * as dotenv from 'dotenv';
dotenv.config();

import type { LLMTransport } from './llmTransport.js';
import { GroqAdapter } from './groqAdapter.js';
import { GeminiAdapter } from './geminiAdapter.js';
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
        console.warn(`[Transport] Provider failed: ${err.message}. Trying next fallback...`);
      }
    }

    throw lastError ?? new Error('[Transport] All providers failed');
  }
}

export function createTransport(): LLMTransport {
  const provider = (process.env.ACTIVE_PROVIDER ?? 'gemini').toLowerCase().trim();

  const gemini = new GeminiAdapter();
  const groq = new GroqAdapter();
  const orca = new OrcaRouterAdapter();

  let orderedTransports: LLMTransport[] = [];

  switch (provider) {
    case 'gemini':
      orderedTransports = [gemini, groq, orca];
      break;
    case 'groq':
      orderedTransports = [groq, gemini, orca];
      break;
    case 'orcarouter':
      orderedTransports = [orca, gemini, groq];
      break;
    default:
      orderedTransports = [gemini, groq, orca];
      break;
  }

  return new ResilientCompositeTransport(orderedTransports);
}


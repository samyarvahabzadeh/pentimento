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

export function createTransport(): LLMTransport {
  const provider = (process.env.ACTIVE_PROVIDER ?? 'groq').toLowerCase().trim();

  switch (provider) {
    case 'groq':
      return new GroqAdapter();
    case 'gemini':
      return new GeminiAdapter();
    case 'orcarouter':
      return new OrcaRouterAdapter();
    default:
      console.warn(`[transportFactory] Unknown provider "${provider}", defaulting to groq`);
      return new GroqAdapter();
  }
}

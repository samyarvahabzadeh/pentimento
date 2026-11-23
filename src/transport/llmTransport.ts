import type { DirectorContext } from '../core/types.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  responseFormatJson?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResult {
  provider: string;
  model: string;
  latencyMs: number;
  rawText: string;
}

export interface LLMTransport {
  generateDirectorOutput(context: DirectorContext): Promise<{
    provider: string;
    model: string;
    latencyMs: number;
    rawText: string;
  }>;

  generateChat?(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult>;
}

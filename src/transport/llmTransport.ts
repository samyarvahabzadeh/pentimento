import type { DirectorContext } from '../core/types.js';

export interface LLMTransport {
  generateDirectorOutput(context: DirectorContext): Promise<{
    provider: string;
    model: string;
    latencyMs: number;
    rawText: string;
  }>;
}

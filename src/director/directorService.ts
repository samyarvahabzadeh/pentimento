import type { DirectorContext, DirectorOutput, IntentRankerOutput, TurnRankerPacket } from '../core/types.js';
import type { LLMTransport } from '../transport/llmTransport.js';
import { parseDirectorOutput, parseRankerOutput } from './directorParser.js';

export async function rankIntentWithTransport(
  packet: TurnRankerPacket,
  validCandidateIds: string[],
  transport?: LLMTransport,
  context?: DirectorContext
): Promise<IntentRankerOutput | null> {
  if (!transport || !context) {
    return null;
  }

  try {
    const timeoutPromise = new Promise<{ provider: string; model: string; latencyMs: number; rawText: string }>((_, reject) => {
      setTimeout(() => reject(new Error('Ranker request timed out after 3500ms')), 3500);
    });

    const transportPromise = transport.generateDirectorOutput(context);
    const result = await Promise.race([transportPromise, timeoutPromise]);

    const rankerOut = parseRankerOutput(result.rawText, validCandidateIds);
    return rankerOut;
  } catch (err: any) {
    // Graceful fallback to null without technical crash
    return null;
  }
}

export async function runDirector(
  context: DirectorContext,
  transport: LLMTransport
): Promise<{ output: DirectorOutput; debugInfo: any } | null> {
  try {
    const result = await transport.generateDirectorOutput(context);
    const output = parseDirectorOutput(result.rawText);

    return {
      output,
      debugInfo: {
        provider: result.provider,
        model: result.model,
        latency: result.latencyMs,
        parseSuccess: true,
      },
    };
  } catch (err: any) {
    return null;
  }
}

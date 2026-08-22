import { DirectorContext, DirectorOutput } from '../core/types';
import { LLMTransport } from '../transport/llmTransport';
import { parseDirectorOutput } from './directorParser';

export async function runDirector(
  context: DirectorContext,
  transport: LLMTransport
): Promise<{ output: DirectorOutput, debugInfo: any } | null> {
  try {
    const result = await transport.generateDirectorOutput(context);
    
    const output = parseDirectorOutput(result.rawText);
    
    return {
      output,
      debugInfo: {
        provider: result.provider,
        model: result.model,
        latency: result.latencyMs,
        parseSuccess: true
      }
    };
  } catch (err: any) {
    console.error("Director failed:", err.message);
    return null; // Signals to use fallback
  }
}

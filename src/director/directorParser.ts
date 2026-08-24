import type { DirectorOutput, IntentRankerOutput, MemoryCandidate, SoftEffectProposal } from '../core/types.js';

function extractBalancedJson(text: string): string {
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return text;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return text.substring(startIdx, i + 1);
        }
      }
    }
  }

  // Fallback to lastIndex if not cleanly closed
  const endIdx = text.lastIndexOf('}');
  return endIdx > startIdx ? text.substring(startIdx, endIdx + 1) : text;
}

export function parseRankerOutput(rawText: string, validCandidateIds: string[]): IntentRankerOutput {
  try {
    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    jsonStr = extractBalancedJson(jsonStr);

    const parsed = JSON.parse(jsonStr);

    let candidateId = typeof parsed.candidateId === 'string' ? parsed.candidateId.trim() : '';
    if (!validCandidateIds.includes(candidateId)) {
      // Fallback to first valid candidate if model misnamed
      candidateId = validCandidateIds.find(id => id.toLowerCase() === candidateId.toLowerCase()) || validCandidateIds[0];
    }

    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.85;

    return {
      candidateId,
      confidence,
      speechAct: typeof parsed.speechAct === 'string' ? parsed.speechAct : undefined,
      tone: typeof parsed.tone === 'string' ? parsed.tone : undefined,
      targetNpc: typeof parsed.targetNpc === 'string' ? parsed.targetNpc : undefined,
    };
  } catch (err) {
    // Single repair heuristic
    for (const validId of validCandidateIds) {
      if (rawText.includes(validId)) {
        return {
          candidateId: validId,
          confidence: 0.75,
        };
      }
    }

    return {
      candidateId: validCandidateIds[0] || 'action_observe_surroundings',
      confidence: 0.5,
    };
  }
}

export function parseDirectorOutput(rawText: string): DirectorOutput {
  try {
    let jsonStr = rawText.trim();
    // Strip markdown fences if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Extract first balanced JSON block
    jsonStr = extractBalancedJson(jsonStr);

    const parsed = JSON.parse(jsonStr);

    if (parsed.version !== 1) {
      parsed.version = 1;
    }
    if (!parsed.narrative || typeof parsed.narrative !== 'string') {
      throw new Error('Missing narrative string in director response');
    }
    if (!parsed.interpretation || typeof parsed.interpretation.kind !== 'string') {
      parsed.interpretation = {
        kind: 'other',
        intentSummary: 'Parsed with default interpretation',
      };
    }

    // Sanitize softEffects
    const validSoftEffects: SoftEffectProposal[] = [];
    if (Array.isArray(parsed.softEffects)) {
      for (const eff of parsed.softEffects) {
        if (eff && typeof eff === 'object' && typeof eff.kind === 'string') {
          const delta = typeof eff.delta === 'number' ? Math.max(-2, Math.min(2, Math.round(eff.delta))) : 0;
          if (eff.kind === 'rapport' && typeof eff.npcId === 'string') {
            validSoftEffects.push({ kind: 'rapport', npcId: eff.npcId, delta: delta as any });
          } else if (eff.kind === 'stress') {
            validSoftEffects.push({ kind: 'stress', delta: delta as any });
          } else if (eff.kind === 'threat') {
            validSoftEffects.push({ kind: 'threat', delta: delta as any });
          }
        }
      }
    }
    parsed.softEffects = validSoftEffects;

    // Sanitize memoryCandidates
    const validMemories: MemoryCandidate[] = [];
    if (Array.isArray(parsed.memoryCandidates)) {
      for (const m of parsed.memoryCandidates) {
        if (m && typeof m === 'object' && typeof m.summary === 'string') {
          const scope = (['scene', 'npc', 'player'].includes(m.scope) ? m.scope : 'scene') as 'scene' | 'npc' | 'player';
          const importance = (typeof m.importance === 'number' && m.importance >= 1 && m.importance <= 5 ? Math.round(m.importance) : 3) as 1 | 2 | 3 | 4 | 5;
          validMemories.push({
            scope,
            subjectId: typeof m.subjectId === 'string' ? m.subjectId : undefined,
            summary: m.summary,
            importance,
          });
        }
      }
    }
    parsed.memoryCandidates = validMemories;
    parsed.referencedFactIds = Array.isArray(parsed.referencedFactIds) ? parsed.referencedFactIds : [];

    return parsed as DirectorOutput;
  } catch (err: any) {
    throw new Error(`Failed to parse director output: ${err.message}\nRaw text: ${rawText}`);
  }
}

import { MemoryCandidate, RunState } from './types.js';
import { appendEventToDb } from '../storage/db.js';
import { v4 as uuidv4 } from 'uuid';

export function compileMemory(state: RunState, memoryCandidates: MemoryCandidate[]): void {
  for (const cand of memoryCandidates) {
    if (cand.importance >= 3) {
      const id = uuidv4();

      // Persist to durable storage
      appendEventToDb(id, state.canonical.runId, `memory.${cand.scope}`, state.scene.turn, {
        subjectId: cand.subjectId ?? null,
        summary: cand.summary,
        importance: cand.importance,
      });

      // Update in-memory NPC state
      if (cand.scope === 'npc' && cand.subjectId) {
        if (!state.npcMemory[cand.subjectId]) {
          state.npcMemory[cand.subjectId] = {
            awareness: [],
            beliefs: [],
            impressions: [],
            commitments: [],
            rapport: 0,
            lastInteractionTurn: state.scene.turn,
          };
        }

        const npc = state.npcMemory[cand.subjectId];
        const summary = cand.summary.toLowerCase();

        if (summary.includes('تهدید') || summary.includes('ضربه') || summary.includes('بلوف') ||
            summary.includes('threat') || summary.includes('bluff') || summary.includes('aggress')) {
          npc.impressions.push({ tag: cand.summary, sourceEventId: id });
        } else {
          npc.beliefs.push({
            summary: cand.summary,
            confidence: cand.importance >= 4 ? 'high' : 'medium',
            sourceEventId: id,
          });
        }
        npc.lastInteractionTurn = state.scene.turn;
      }
    }
  }
}

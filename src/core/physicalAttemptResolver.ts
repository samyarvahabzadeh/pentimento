import type { RunState, SoftEffectProposal } from './types.js';

export interface PhysicalAttemptOutcome {
  outcomeId: string;
  stressDelta: number;
  threatDelta: number;
  softEffects: SoftEffectProposal[];
  flagsToAdd: string[];
  npcImpressionTag?: string;
  summary: string;
}

/**
 * Deterministic resolver for physical aggression / high-consequence attempts.
 * The Game Engine alone decides physical outcomes; the LLM only interprets the intent attempt.
 */
export function resolvePhysicalAttempt(
  state: RunState,
  targetId?: string,
  _intentSummary?: string
): PhysicalAttemptOutcome {
  if (targetId === 'exiting_man' || !targetId) {
    return {
      outcomeId: 'target_evades_and_warns',
      stressDelta: 5,
      threatDelta: 10,
      softEffects: [
        { kind: 'rapport', npcId: 'exiting_man', delta: -2 },
        { kind: 'stress', delta: 1 },
        { kind: 'threat', delta: 2 },
      ],
      flagsToAdd: ['attacked_exiting_man'],
      npcImpressionTag: 'بازیکن رفتار تهاجمی و غیرقابل‌پیش‌بینی دارد',
      summary: 'Player attempted physical attack on exiting_man; target evaded defensively and warned player.',
    };
  }

  return {
    outcomeId: 'physical_action_resisted',
    stressDelta: 5,
    threatDelta: 5,
    softEffects: [
      { kind: 'stress', delta: 1 },
      { kind: 'threat', delta: 1 },
    ],
    flagsToAdd: [],
    summary: 'Physical action executed; environment and targets resisted without serious injury.',
  };
}

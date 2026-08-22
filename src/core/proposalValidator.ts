import type { DirectorOutput, ValidationResult, RunState, CanonicalActionId } from './types.js';

export function validateProposal(
  state: RunState,
  output: DirectorOutput,
  allowedActions: CanonicalActionId[]
): ValidationResult {
  const result: ValidationResult = {
    acceptedSoftEffects: [],
    rejected: [],
  };

  if (output.canonicalActionProposal && output.canonicalActionProposal.actionId) {
    if (allowedActions.includes(output.canonicalActionProposal.actionId)) {
      result.acceptedActionId = output.canonicalActionProposal.actionId;
    } else {
      result.rejected.push({
        type: 'action',
        reason: `Action ${output.canonicalActionProposal.actionId} not allowed in current node (${state.canonical.currentNode}).`,
      });
    }
  }

  for (const effect of output.softEffects) {
    if (effect.delta < -2 || effect.delta > 2) {
      result.rejected.push({
        type: 'soft_effect',
        reason: `Delta ${effect.delta} out of bounds for ${effect.kind}.`,
      });
      continue;
    }

    if (effect.kind === 'rapport') {
      if (!state.scene.activeEntityIds.includes(effect.npcId)) {
        result.rejected.push({
          type: 'soft_effect',
          reason: `NPC ${effect.npcId} not present in scene.`,
        });
        continue;
      }
    }

    result.acceptedSoftEffects.push(effect);
  }

  return result;
}

import type {
  CandidateAction,
  CanonicalEffect,
  ClockChange,
  MemoryWrite,
  RunState,
  TurnResolution,
} from './types.js';
import { tickClock, evaluateClockThresholds, createInitialClocks } from './consequenceClocks.js';
import { addProofPoints, createInitialProofDomains } from './proofDomains.js';
import { bumpApproachStat, createInitialApproachStats } from './runVariation.js';
import { LOCATION_REGISTRY } from './worldAffordances.js';
import { normalizeSceneId } from './evidenceGating.js';

export function resolveCandidateAction(
  state: RunState,
  candidate: CandidateAction,
  interpretation: {
    candidateId: string;
    confidence: number;
    speechAct?: string;
    tone?: string;
    targetNpc?: string;
  }
): TurnResolution {
  // Ensure v2 structures exist on state
  if (!state.clocks) {
    state.clocks = createInitialClocks();
  }
  if (!state.proofDomains) {
    state.proofDomains = createInitialProofDomains();
  }
  if (!state.approachStats) {
    state.approachStats = createInitialApproachStats();
  }
  if (!state.npcTrust) {
    state.npcTrust = {};
  }
  if (!state.npcPressure) {
    state.npcPressure = {};
  }
  if (!state.revealedLore) {
    state.revealedLore = [];
  }

  const acceptedEffects: CanonicalEffect[] = [];
  const rejectedEffects: string[] = [];
  const triggeredBeats: string[] = [candidate.narrativeBeatId];
  const clockChanges: ClockChange[] = [];
  const memoryWrites: MemoryWrite[] = [];
  let endingId: string | undefined = undefined;

  // Approach stats bump based on action kind
  if (candidate.kind === 'inspect') {
    state.approachStats = bumpApproachStat(state.approachStats, 'art', 1);
  } else if (candidate.kind === 'ask' || candidate.kind === 'pressure') {
    state.approachStats = bumpApproachStat(state.approachStats, 'social', 1);
  } else if (candidate.kind === 'use' || candidate.risk > 1) {
    state.approachStats = bumpApproachStat(state.approachStats, 'risk', 1);
  }

  // Execute effects
  for (const effect of candidate.effects) {
    switch (effect.type) {
      case 'add_evidence':
        if (!state.canonical.evidenceIds.includes(effect.evidenceId)) {
          state.canonical.evidenceIds.push(effect.evidenceId);
        }
        acceptedEffects.push(effect);
        break;

      case 'add_inventory':
        if (!state.canonical.inventoryIds.includes(effect.itemId)) {
          state.canonical.inventoryIds.push(effect.itemId);
        }
        acceptedEffects.push(effect);
        break;

      case 'remove_inventory':
        state.canonical.inventoryIds = state.canonical.inventoryIds.filter(id => id !== effect.itemId);
        acceptedEffects.push(effect);
        break;

      case 'set_flag':
        if (!state.canonical.canonicalFlags.includes(effect.flag)) {
          state.canonical.canonicalFlags.push(effect.flag);
        }
        if (effect.flag === 'ROLE_ART_HISTORIAN') state.canonical.playerClass = 'art_historian';
        if (effect.flag === 'ROLE_COFFEE_ALCHEMIST') state.canonical.playerClass = 'coffee_alchemist';
        if (effect.flag === 'ROLE_SYSTEMS_ANALYST') state.canonical.playerClass = 'systems_analyst';
        if (effect.flag === 'ROLE_INVESTIGATOR') state.canonical.playerClass = 'investigator';
        if (effect.flag === 'ROLE_OBSERVER') state.canonical.playerClass = 'observer';
        acceptedEffects.push(effect);
        break;

      case 'change_scene':
        state.canonical.currentNode = effect.nodeId;
        state.canonical.currentScene = effect.sceneId;
        state.scene.nodeId = effect.nodeId;
        state.scene.sceneId = effect.sceneId;
        {
          const location = LOCATION_REGISTRY[normalizeSceneId(effect.sceneId)];
          if (location) {
            state.scene.activeEntityIds = [...(location.activeEntityIds ?? [])];
            state.scene.visibleObjectIds = [...(location.visibleObjectIds ?? [])];
          }
        }
        acceptedEffects.push(effect);
        break;

      case 'modify_trust':
        state.npcTrust[effect.npcId] = (state.npcTrust[effect.npcId] ?? 0) + effect.delta;
        acceptedEffects.push(effect);
        break;

      case 'modify_pressure':
        state.npcPressure[effect.npcId] = (state.npcPressure[effect.npcId] ?? 0) + effect.delta;
        acceptedEffects.push(effect);
        break;

      case 'modify_clock': {
        const tickRes = tickClock(state.clocks, effect.clock, effect.delta, effect.reason);
        state.clocks = tickRes.updatedClocks;
        if (tickRes.change) {
          clockChanges.push(tickRes.change);
        }
        acceptedEffects.push(effect);
        break;
      }

      case 'add_proof_domain':
        state.proofDomains = addProofPoints(state.proofDomains, effect.domain, effect.points);
        acceptedEffects.push(effect);
        break;

      case 'reveal_lore':
        if (!state.revealedLore.includes(effect.loreId)) {
          state.revealedLore.push(effect.loreId);
        }
        acceptedEffects.push(effect);
        break;

      case 'record_memory':
        memoryWrites.push({
          npcId: effect.npcId,
          summary: effect.memory,
          tag: effect.tag,
        });
        if (!state.npcMemory[effect.npcId]) {
          state.npcMemory[effect.npcId] = {
            awareness: [],
            beliefs: [],
            impressions: [{ tag: effect.tag }],
            commitments: [],
            rapport: 0,
            lastInteractionTurn: state.scene.turn,
          };
        } else {
          state.npcMemory[effect.npcId].impressions.push({ tag: effect.tag });
          state.npcMemory[effect.npcId].lastInteractionTurn = state.scene.turn;
        }
        acceptedEffects.push(effect);
        break;

      case 'modify_environment':
        if (!state.environmentState) {
          state.environmentState = {};
        }
        (state.environmentState as any)[effect.key] = effect.value;
        acceptedEffects.push(effect);
        break;

      case 'trigger_ending':
        endingId = effect.endingId;
        state.canonical.endingId = effect.endingId;
        acceptedEffects.push(effect);
        break;

      default:
        break;
    }
  }

  // Check clock thresholds if no ending is explicitly triggered
  if (!endingId) {
    const clockEval = evaluateClockThresholds(state.clocks);
    if (clockEval.isCritical && clockEval.suggestedEndingId) {
      endingId = clockEval.suggestedEndingId;
      state.canonical.endingId = clockEval.suggestedEndingId;
    }
  }

  return {
    interpreted: {
      candidateId: candidate.id,
      confidence: interpretation.confidence,
      speechAct: interpretation.speechAct,
      tone: interpretation.tone,
      targetNpc: interpretation.targetNpc,
    },
    acceptedEffects,
    rejectedEffects,
    triggeredBeats,
    clockChanges,
    memoryWrites,
    endingId,
  };
}

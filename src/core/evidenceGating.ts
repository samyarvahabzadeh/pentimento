import type {
  CanonicalEffect,
  InspectionDiscovery,
  PlayerClassId,
  RunState,
  SemanticAction,
  WorldObject,
} from './types.js';
import { addProofPoints } from './proofDomains.js';

export interface InspectionResolution {
  narrative: string;
  effects: CanonicalEffect[];
  discoveryId?: string;
  accessible: boolean;
}

const LEGACY_SCENE_ALIASES: Record<string, string> = {
  scene_table_5: 'scene_table5',
  scene_security_desk: 'scene_cctv',
  scene_back_label: 'scene_painting_back',
};

export function normalizeSceneId(sceneId: string): string {
  return LEGACY_SCENE_ALIASES[sceneId] ?? sceneId;
}

export function isWorldObjectAccessible(object: WorldObject, state: RunState): boolean {
  const location = normalizeSceneId(object.state.location);
  const scene = normalizeSceneId(state.canonical.currentScene || state.scene.sceneId);

  if (location === 'in_pocket' || location === 'in_bag') return true;
  if (state.canonical.inventoryIds.includes(object.id)) return true;
  if (object.id === 'cafe_door' && scene === 'scene_table5') return true;
  return location === scene;
}

function patternMatches(pattern: string, input: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(input);
  } catch {
    return input.toLowerCase().includes(pattern.toLowerCase());
  }
}

function discoveryMatches(
  discovery: InspectionDiscovery,
  action: SemanticAction,
  state: RunState,
  discoveredIds: string[]
): boolean {
  if (discovery.primitives && !discovery.primitives.includes(action.primitive)) return false;
  if (discovery.inputPatterns && !discovery.inputPatterns.some(pattern => patternMatches(pattern, action.rawInput))) return false;

  const role = state.canonical.playerClass ?? 'observer';
  if (discovery.roles && !discovery.roles.includes(role)) return false;
  if (discovery.requiresEvidence && !discovery.requiresEvidence.every(id => state.canonical.evidenceIds.includes(id))) return false;
  if (discovery.requiresAnyEvidence && !discovery.requiresAnyEvidence.some(id => state.canonical.evidenceIds.includes(id))) return false;
  if (discovery.requiresDiscoveries && !discovery.requiresDiscoveries.every(id => discoveredIds.includes(id))) return false;
  return true;
}

function renderRoleAwareObservation(
  base: string,
  modifiers: Partial<Record<PlayerClassId, string>> | undefined,
  state: RunState
): string {
  const role = state.canonical.playerClass ?? 'observer';
  const modifier = modifiers?.[role];
  return modifier ? `${base}\n\n${modifier}` : base;
}

/**
 * Resolves authored, layered inspection data.  Repeating the same observation
 * never re-awards evidence or proof points.
 */
export function resolveLayeredInspection(
  object: WorldObject,
  action: SemanticAction,
  state: RunState
): InspectionResolution {
  const profile = object.inspectionProfile;
  if (!profile) {
    return { narrative: `چیز قابل‌بررسی مشخصی در ${object.nameFa} پیدا نمی‌کنی.`, effects: [], accessible: true };
  }

  if (!isWorldObjectAccessible(object, state)) {
    const locationHint = profile.inaccessibleObservation ?? 'این شیء در موقعیت فعلی در دسترس یا در میدان دید دقیق تو نیست؛ اول باید به محل آن بروی.';
    return { narrative: locationHint, effects: [], accessible: false };
  }

  if (!state.environmentState) state.environmentState = {};
  if (!state.environmentState.discoveredInspectionLayers) {
    state.environmentState.discoveredInspectionLayers = {};
  }

  const discoveredIds = state.environmentState.discoveredInspectionLayers[object.id] ?? [];
  const discoveries = [...(profile.discoveries ?? [])].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const matching = discoveries.filter(discovery => discoveryMatches(discovery, action, state, discoveredIds));
  const fresh = matching.find(discovery => !discoveredIds.includes(discovery.id));

  if (!fresh) {
    const repeated = matching.find(discovery => discoveredIds.includes(discovery.id));
    if (repeated) {
      return {
        narrative: renderRoleAwareObservation(repeated.repeatObservation ?? repeated.observation, repeated.roleModifiers, state),
        effects: [],
        discoveryId: repeated.id,
        accessible: true,
      };
    }

    return {
      narrative: renderRoleAwareObservation(profile.defaultObservation, profile.roleModifiers, state),
      effects: [],
      accessible: true,
    };
  }

  discoveredIds.push(fresh.id);
  state.environmentState.discoveredInspectionLayers[object.id] = discoveredIds;

  const effects: CanonicalEffect[] = [];
  for (const evidenceId of fresh.evidenceIds ?? []) {
    if (!state.canonical.evidenceIds.includes(evidenceId)) {
      state.canonical.evidenceIds.push(evidenceId);
      effects.push({ type: 'add_evidence', evidenceId });
    }
    if (!state.scene.establishedFactIds.includes(evidenceId)) {
      state.scene.establishedFactIds.push(evidenceId);
    }
  }

  if (fresh.proofDomain) {
    if (!state.proofDomains) {
      state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
    }
    state.proofDomains = addProofPoints(state.proofDomains, fresh.proofDomain.domain, fresh.proofDomain.points);
    effects.push({
      type: 'add_proof_domain',
      domain: fresh.proofDomain.domain,
      points: fresh.proofDomain.points,
    });
  }

  return {
    narrative: renderRoleAwareObservation(fresh.observation, fresh.roleModifiers, state),
    effects,
    discoveryId: fresh.id,
    accessible: true,
  };
}

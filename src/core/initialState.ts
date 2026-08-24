import { v4 as uuidv4 } from 'uuid';
import type { RunState } from './types.js';
import { initRunFlavors } from './ambientScheduler.js';
import { createInitialClocks } from './consequenceClocks.js';
import { createInitialProofDomains } from './proofDomains.js';
import { createInitialApproachStats } from './runVariation.js';
import { createInitialWorldObjects } from './worldAffordances.js';
import { createInitialNpcGoalProfiles } from './npcGoals.js';

export function createInitialRunState(seed?: number): RunState {
  const runSeed = seed ?? (Math.floor(Math.random() * 1000000) + 1);

  return {
    version: 2,
    canonical: {
      runId: uuidv4(),
      currentNode: 'NODE_00',
      currentScene: 'scene_intro',
      stress: 0,
      threat: 0,
      actionPoints: 3,
      evidenceIds: [],
      inventoryIds: [],
      canonicalFlags: [],
      endingId: undefined,
    },
    scene: {
      sceneId: 'scene_intro',
      nodeId: 'NODE_00',
      turn: 0,
      activeEntityIds: [],
      visibleObjectIds: [],
      establishedFactIds: [],
      recentBeats: [],
    },
    npcMemory: {
      exiting_man: {
        awareness: ['player_arrived'],
        beliefs: [],
        impressions: [],
        commitments: [],
        rapport: 0,
        lastInteractionTurn: 0,
      },
    },
    runSeed,
    runFlavor: initRunFlavors(runSeed),
    ambientHistory: [],

    // V2 Fields
    proofDomains: createInitialProofDomains(),
    approachStats: createInitialApproachStats(),
    clocks: createInitialClocks(),
    loopMeta: {
      loopCount: 0,
      echoes: [],
      seenEndings: [],
    },
    revealedLore: [],
    redGloveLoreStage: 0,
    npcTrust: {},
    npcPressure: {},
    worldObjects: createInitialWorldObjects(),
    npcGoalProfiles: createInitialNpcGoalProfiles(),
    environmentState: {
      discoveredInspectionLayers: {},
      revealedNpcKnowledge: {},
      npcTopicHistory: {},
    },
  };
}

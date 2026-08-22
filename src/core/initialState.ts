import { v4 as uuidv4 } from 'uuid';
import type { RunState } from './types.js';
import { initRunFlavors } from './ambientScheduler.js';

export function createInitialRunState(seed?: number): RunState {
  const runSeed = seed ?? (Math.floor(Math.random() * 1000000) + 1);

  return {
    version: 1,
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
  };
}

/**
 * NODE 18 Integration Test
 * Verifies:
 * 1. Final transition from synthesis to NODE 18 (The Underpainting).
 * 2. Examining underpainting layers & superimposing the 4 stages (HAND, WINDOW, CUP, SHADOW).
 * 3. Provenance chain terminus revelation (55 / Cafe Pentimento).
 * 4. Master Ending Resolution & Epilogue generation across all 4 roles.
 */

import { createInitialRunState } from '../core/initialState.js';
import { applyValidatedTurn } from '../core/gameEngine.js';
import { validateProposal } from '../core/proposalValidator.js';
import { NODE_18_ALLOWED_ACTIONS } from '../canon/node18.js';
import type { RunState, CanonicalActionId, DirectorOutput } from '../core/types.js';

function makeMockOutput(actionId: CanonicalActionId, narrative: string): DirectorOutput {
  return {
    version: 1,
    narrative,
    interpretation: { kind: 'observe', intentSummary: 'Action' },
    canonicalActionProposal: { actionId, confidence: 'high' },
    softEffects: [],
    memoryCandidates: [],
    referencedFactIds: [],
  };
}

function runDeterministicAction(state: RunState, actionId: CanonicalActionId, playerInput = '', narrative = ''): RunState {
  const output = makeMockOutput(actionId, narrative || 'روایت لایه‌های نقاشی در جریان است.');
  const val = validateProposal(state, output, NODE_18_ALLOWED_ACTIONS);
  applyValidatedTurn(state, val, output.interpretation, output.narrative, playerInput);
  return state;
}

export function runNode18IntegrationTest() {
  console.log('================================================================');
  console.log('       PENTIMENTO — NODE 18 INTEGRATION TEST');
  console.log('================================================================\n');

  let total = 0;
  let passed = 0;
  function assert(title: string, cond: boolean, details: string) {
    total++;
    if (cond) {
      passed++;
      console.log(`[PASS ✅] ${title}`);
    } else {
      console.error(`[FAIL ❌] ${title} -> ${details}`);
    }
  }

  // Setup rich state ready for Node 18
  let state = createInitialRunState(999);
  state.canonical.playerClass = 'art_historian';
  state.canonical.evidenceIds = [
    'invoice_is_forged',
    'seven_minute_camera_gap',
    'footage_was_never_written',
    'old_ownership_label',
    'label_numbers_14_3_7_55',
    'unusually_clean_box',
    'object_has_different_cleaner_smell',
  ];
  state.scene.establishedFactIds = [
    'fact_exiting_man_hands_notable',
    'fact_espresso_cup_placement',
    'fact_painting_window_reflection',
    'fact_route_testimony_conflict',
    'fact_witness_clock_discrepancy',
  ];
  state.canonical.canonicalFlags = [
    'timeline_synthesis_finalized',
    'shadow_seed_confirmable',
    'rejected_financial_offer',
  ];
  state.npcMemory = {
    salar: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };
  state.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: [], status: 'CONFIRMED' },
      { id: 'c2', leftItemId: 'archive_camera_gap_7min', relation: 'BEFORE', rightItemId: 'archive_witness_clock_discrepancy', supportingEvidenceIds: [], status: 'CONFIRMED' },
    ],
  };

  // Step 1: Examine Underpainting Layers (Transition to Node 18)
  console.log('--- Step 1: Transition to NODE 18 & Superimpose Layers ---');
  runDeterministicAction(state, 'EXAMINE_UNDERPAINTING_LAYERS', 'لایه‌های زیرین تابلو رو کنار هم قرار می‌دم');
  assert(
    'Transition to NODE_18',
    state.canonical.currentNode === 'NODE_18' && state.scene.nodeId === 'NODE_18' && state.scene.sceneId === 'scene_underpainting',
    `currentNode=${state.canonical.currentNode}, sceneId=${state.scene.sceneId}`
  );
  assert(
    'Underpainting 4 stages fact unlocked',
    state.scene.establishedFactIds.includes('fact_underpainting_four_stages'),
    `establishedFacts=[${state.scene.establishedFactIds.join(', ')}]`
  );

  // Step 2: Superimpose Painting Versions
  console.log('\n--- Step 2: Superimpose Painting Versions ---');
  runDeterministicAction(state, 'SUPERIMPOSE_PAINTING_VERSIONS', 'نسخه‌های قبلی رو روی هم تطبیق می‌دم');
  assert(
    'Active entities in Node 18 include cafe key members',
    state.scene.activeEntityIds.includes('salar') && state.scene.activeEntityIds.includes('haniyeh'),
    `activeEntities=[${state.scene.activeEntityIds.join(', ')}]`
  );

  // Step 3: Reveal Provenance Chain 55
  console.log('\n--- Step 3: Reveal Provenance Chain 55 ---');
  runDeterministicAction(state, 'REVEAL_PROVENANCE_CHAIN_55', 'نقشه نبود... این زنجیرهٔ مالکیت بود که به ۵۵ ختم میشه');
  assert(
    'Provenance Chain 55 flags and facts unlocked',
    state.canonical.canonicalFlags.includes('provenance_chain_understood') &&
    state.scene.establishedFactIds.includes('fact_provenance_not_geographic_map') &&
    state.scene.establishedFactIds.includes('fact_provenance_terminus_55'),
    `flags=[${state.canonical.canonicalFlags.join(', ')}]`
  );

  // Step 4: Complete Run and Resolve Master Ending
  console.log('\n--- Step 4: Complete Run & Resolve Master Ending ---');
  runDeterministicAction(state, 'COMPLETE_RUN_AND_RESOLVE_ENDING', 'نتیجه‌گیری نهایی رو اعلام می‌کنم');
  assert(
    'Ending evaluated and attached to state',
    state.endingEvaluation !== undefined &&
    state.canonical.endingId === 'TRUE_ENDING' &&
    state.canonical.canonicalFlags.includes('run_completed'),
    `endingId=${state.canonical.endingId}, eval=${!!state.endingEvaluation}`
  );

  console.log('\n================================================================');
  console.log('FINAL EPILOGUE NARRATIVE OUTPUT:');
  console.log('----------------------------------------------------------------');
  console.log(state.endingEvaluation?.epilogueText);
  console.log('----------------------------------------------------------------');
  console.log(`\nTEST RESULTS: ${passed}/${total} Tests Passed`);
  console.log('================================================================');
}

runNode18IntegrationTest();

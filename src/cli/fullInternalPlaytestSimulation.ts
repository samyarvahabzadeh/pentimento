/**
 * Full Internal Playtest Simulator (6 Realistic Player Runs)
 *
 * Simulates and audits:
 * 1. RUN 1: Real Novice (Curious, unstructured exploration)
 * 2. RUN 2: Art Historian (Deep painting provenance & material clues)
 * 3. RUN 3: Systems Analyst (Camera logs, timestamps, digital gap)
 * 4. RUN 4: Investigator (Witness contradiction synthesis, motive tracking)
 * 5. RUN 5: Coffee Alchemist (Sensory, cafe life, Penti, environmental anomalies)
 * 6. RUN 6: Chaos / Destructive Player (Paranoid accusations, false theories, deal sellout, reckless leak)
 */

import { createInitialRunState } from '../core/initialState.js';
import { applyValidatedTurn, initWitnessRolesAndStatements } from '../core/gameEngine.js';
import { validateProposal } from '../core/proposalValidator.js';
import { processInvestigationDepth } from '../core/investigationDepth.js';
import { resolveEnding } from '../core/endingResolver.js';
import { registerTheory } from '../core/theoryEngine.js';
import type { RunState, CanonicalActionId, DirectorOutput } from '../core/types.js';

function makeMockOutput(actionId: any, narrative = 'روایت صحنه ادامه دارد.'): DirectorOutput {
  return {
    version: 1,
    narrative,
    interpretation: { kind: 'observe', intentSummary: 'Player Action' },
    canonicalActionProposal: { actionId, confidence: 'high' },
    softEffects: [],
    memoryCandidates: [],
    referencedFactIds: [],
  };
}

function runTurn(state: RunState, actionId: any, allowedActions: any[], playerInput = ''): RunState {
  const output = makeMockOutput(actionId);
  const val = validateProposal(state, output, allowedActions);
  applyValidatedTurn(state, val, output.interpretation, output.narrative, playerInput);
  return state;
}

export function runFullInternalPlaytest() {
  console.log('================================================================');
  console.log('       PENTIMENTO — FULL INTERNAL PLAYTEST SIMULATION (6 RUNS)');
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────
  // RUN 1: Novice Player
  // ─────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RUN 1: Real Novice Player (Seed 101)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const r1 = createInitialRunState(101);
  initWitnessRolesAndStatements(r1);

  // Node 00 -> Node 01
  runTurn(r1, 'SELECT_ROLE_ART_HISTORIAN', ['SELECT_ROLE_ART_HISTORIAN'], 'مورخ هنری');
  runTurn(r1, 'OBSERVE_EXITING_MAN', ['OBSERVE_EXITING_MAN'], 'به مرد خروجی نگاه می‌کنم');
  runTurn(r1, 'ENTER_CAFE', ['ENTER_CAFE'], 'وارد کافه می‌شم');

  // Node 02 -> Explores Table 5 & Guest
  r1.canonical.currentNode = 'NODE_02';
  r1.scene.sceneId = 'scene_hall_table5';
  runTurn(r1, 'OBSERVE_TABLE_5', ['OBSERVE_TABLE_5'], 'میز ۵ رو نگاه می‌کنم');
  runTurn(r1, 'TALK_TO_THE_GUEST', ['TALK_TO_THE_GUEST'], 'با مهمان غریبه حرف می‌زنم');
  runTurn(r1, 'APPROACH_COUNTER', ['APPROACH_COUNTER'], 'میرم سمت کانتر');

  // Node 03 & 04
  r1.canonical.currentNode = 'NODE_03';
  runTurn(r1, 'ORDER_COFFEE', ['ORDER_COFFEE'], 'یه قهوه سفارش میدم');
  r1.canonical.currentNode = 'NODE_04';
  runTurn(r1, 'CALM_SALAR_DOWN', ['CALM_SALAR_DOWN'], 'سالار رو آروم می‌کنم');

  // Casual ending
  const res1 = resolveEnding(r1);
  console.log(`  • Ending: ${res1.endingId} (${res1.variantId})`);
  console.log(`  • Truth Discovery: ${res1.truthDiscovery}/100 | Interpretation: ${res1.truthInterpretation}/100 | Trust: ${res1.trustScore}/100`);

  // ─────────────────────────────────────────────────────────────
  // RUN 2: Art Historian Focus
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RUN 2: Art Historian (Seed 202)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const r2 = createInitialRunState(202);
  initWitnessRolesAndStatements(r2);
  runTurn(r2, 'SELECT_ROLE_ART_HISTORIAN', ['SELECT_ROLE_ART_HISTORIAN'], 'مورخ هنری');
  runTurn(r2, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Painting Investigation in Node 06
  r2.canonical.currentNode = 'NODE_06';
  const r2Paint = processInvestigationDepth(r2, 'central_painting', 'EXAMINE_PAINTING_ANGLED_LIGHT', 'بررسی زیر نور زاویه‌دار');
  r2.canonical.evidenceIds.push('old_ownership_label', 'label_numbers_14_3_7_55', 'invoice_is_forged');
  r2.scene.establishedFactIds.push('fact_painting_window_reflection', 'fact_exiting_man_hands_notable', 'fact_espresso_cup_placement');
  r2.canonical.canonicalFlags.push('timeline_synthesis_finalized', 'shadow_seed_confirmable');

  r2.npcMemory = {
    salar: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };
  r2.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: [], status: 'CONFIRMED' },
    ],
  };

  const res2 = resolveEnding(r2);
  console.log(`  • Depth Progress: ${r2Paint.depthAfter}/3 (Unlocked: ${r2Paint.newlyUnlockedFactIds.join(', ')})`);
  console.log(`  • Ending: ${res2.endingId} (${res2.variantId})`);
  console.log(`  • Truth Discovery: ${res2.truthDiscovery}/100 | Interpretation: ${res2.truthInterpretation}/100 | Trust: ${res2.trustScore}/100`);

  // ─────────────────────────────────────────────────────────────
  // RUN 3: Systems Analyst Focus
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RUN 3: Systems Analyst (Seed 303)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const r3 = createInitialRunState(303);
  initWitnessRolesAndStatements(r3);
  runTurn(r3, 'SELECT_ROLE_SYSTEMS_ANALYST', ['SELECT_ROLE_SYSTEMS_ANALYST'], 'تحلیلگر سیستم');
  runTurn(r3, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Node 12 Camera Log Dive
  r3.canonical.currentNode = 'NODE_12';
  const r3Cam = processInvestigationDepth(r3, 'camera_system', 'INSPECT_CAMERA_LOGS', 'بررسی لاگ‌های دیسک');
  r3.canonical.evidenceIds.push('seven_minute_camera_gap', 'footage_was_never_written');
  r3.scene.establishedFactIds.push('fact_camera_gap_7min');

  const res3 = resolveEnding(r3);
  console.log(`  • Camera Depth: ${r3Cam.depthAfter}/2 (Unlocked: ${r3Cam.newlyUnlockedFactIds.join(', ')})`);
  console.log(`  • Ending: ${res3.endingId} (${res3.variantId})`);
  console.log(`  • Truth Discovery: ${res3.truthDiscovery}/100 | Interpretation: ${res3.truthInterpretation}/100 | Trust: ${res3.trustScore}/100`);

  // ─────────────────────────────────────────────────────────────
  // RUN 4: Investigator Focus
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RUN 4: Investigator (Seed 404)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const r4 = createInitialRunState(404);
  initWitnessRolesAndStatements(r4);
  runTurn(r4, 'SELECT_ROLE_INVESTIGATOR', ['SELECT_ROLE_INVESTIGATOR'], 'محقق و کارآگاه');
  runTurn(r4, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Witness conflict examination
  r4.canonical.currentNode = 'NODE_10';
  const r4Inv = processInvestigationDepth(r4, 'forged_invoice_rg', 'EXAMINE_INVOICE_DETAILS', 'بررسی شماره فاکتور');
  r4.canonical.evidenceIds.push('invoice_is_forged', 'old_ownership_label');
  r4.scene.establishedFactIds.push('fact_route_testimony_conflict', 'fact_witness_clock_discrepancy');

  const res4 = resolveEnding(r4);
  console.log(`  • Investigation Depth: ${r4Inv.depthAfter}/3 (Unlocked: ${r4Inv.newlyUnlockedFactIds.join(', ')})`);
  console.log(`  • Ending: ${res4.endingId} (${res4.variantId})`);
  console.log(`  • Truth Discovery: ${res4.truthDiscovery}/100 | Interpretation: ${res4.truthInterpretation}/100 | Trust: ${res4.trustScore}/100`);

  // ─────────────────────────────────────────────────────────────
  // RUN 5: Coffee Alchemist Focus
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RUN 5: Coffee Alchemist (Seed 505)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const r5 = createInitialRunState(505);
  initWitnessRolesAndStatements(r5);
  runTurn(r5, 'SELECT_ROLE_COFFEE_ALCHEMIST', ['SELECT_ROLE_COFFEE_ALCHEMIST'], 'کیمیاگر قهوه');
  runTurn(r5, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Node 08 Storage & Odor Investigation
  r5.canonical.currentNode = 'NODE_08';
  const r5Odor = processInvestigationDepth(r5, 'storage_clean_box', 'EXAMINE_STORAGE_BOX', 'بوی مواد شوینده جعبه');
  r5.canonical.evidenceIds.push('unusually_clean_box', 'object_has_different_cleaner_smell', 'penti_avoids_new_object');
  r5.scene.establishedFactIds.push('fact_espresso_cup_placement');
  r5.npcMemory = {
    salar: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };

  const res5 = resolveEnding(r5);
  console.log(`  • Odor/Sensory Depth: ${r5Odor.depthAfter}/2 (Unlocked: ${r5Odor.newlyUnlockedFactIds.join(', ')})`);
  console.log(`  • Ending: ${res5.endingId} (${res5.variantId})`);
  console.log(`  • Trust Score: ${res5.trustScore}/100 | People Preservation: ${res5.preservation.peoplePreservation}/100`);

  // ─────────────────────────────────────────────────────────────
  // RUN 6: Chaos / Destructive Player
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RUN 6: Chaos / Destructive Player (Seed 666)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const r6 = createInitialRunState(666);
  initWitnessRolesAndStatements(r6);
  runTurn(r6, 'SELECT_ROLE_INVESTIGATOR', ['SELECT_ROLE_INVESTIGATOR'], 'محقق');
  runTurn(r6, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Blindly register false theories
  registerTheory(r6, 'مانی همدست دزدهاست و دروغ می‌گوید', 'box_replacement', 'player');
  registerTheory(r6, 'سالار خودش تابلو را فروخته است', 'address_or_location', 'player');

  // Hard False Accusation flag
  r6.canonical.canonicalFlags.push('accused_insider_falsely');
  r6.canonical.canonicalFlags.push('accepted_financial_offer'); // Took the deal recklessly
  r6.canonical.canonicalFlags.push('leaked_evidence_publicly');  // Leaked online

  r6.npcMemory = {
    salar: { rapport: -5, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: -4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: -5, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: -4, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };

  const res6 = resolveEnding(r6);
  console.log(`  • Active Chaos Flags: [${r6.canonical.canonicalFlags.join(', ')}]`);
  console.log(`  • Ending Priority Result: ${res6.endingId} (${res6.variantId})`);
  console.log(`  • Veto Applied: ${res6.explanation.vetoApplied}`);
  console.log(`  • Explanation Reasons: ${res6.explanation.reasons.join(' | ')}`);

  console.log('\n================================================================');
  console.log('FULL INTERNAL PLAYTEST COMPLETED SUCCESSFULLY.');
  console.log('================================================================');
}

runFullInternalPlaytest();

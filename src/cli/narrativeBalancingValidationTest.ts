/**
 * Final Narrative Validation & Behavioral Balancing Test Suite
 *
 * Scenarios:
 * 1. Obsessive Investigator Test (High Truth, Low Trust, Paranoid Accusations -> NOT TRUE_ENDING)
 * 2. Compassionate Low-Truth Test (High Trust, Low Truth -> ESPRESSO)
 * 3. Price Sacrifice Test (High Truth, High People Preservation, Accepted Offer -> THE_PRICE_SACRIFICE)
 * 4. Replay Variance Test (Two distinct runs with different roles & choices showing deep gameplay variance)
 */

import { createInitialRunState } from '../core/initialState.js';
import { resolveEnding } from '../core/endingResolver.js';
import { applyValidatedTurn, initWitnessRolesAndStatements } from '../core/gameEngine.js';
import { validateProposal } from '../core/proposalValidator.js';
import { processInvestigationDepth } from '../core/investigationDepth.js';
import { processTurnTheories } from '../core/theoryEngine.js';
import { buildContext } from '../core/contextBuilder.js';
import type { RunState, CanonicalActionId, DirectorOutput } from '../core/types.js';

function makeMockOutput(actionId: CanonicalActionId, narrative = 'روایت در جریان است.'): DirectorOutput {
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

function runTurn(state: RunState, actionId: CanonicalActionId, allowedActions: CanonicalActionId[], playerInput = ''): RunState {
  const output = makeMockOutput(actionId);
  const val = validateProposal(state, output, allowedActions);
  applyValidatedTurn(state, val, output.interpretation, output.narrative, playerInput);
  return state;
}

export function runNarrativeBalancingSuite() {
  console.log('================================================================');
  console.log('      PENTIMENTO — FINAL NARRATIVE BALANCING VALIDATION');
  console.log('================================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assertResult(title: string, condition: boolean, details: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`[PASS ✅] ${title}`);
    } else {
      console.error(`[FAIL ❌] ${title} -> ${details}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. SCENARIO 1: Obsessive Investigator Test
  // ─────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Obsessive Investigator Test');
  console.log('   Profile: High Truth + Low Trust + Paranoid Accusations');
  console.log('   Expected: NOT TRUE_ENDING (WRONG_MAN / Fractured Cohesion)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sObsessive = createInitialRunState(101);
  sObsessive.canonical.playerClass = 'investigator';
  // High evidence & facts
  sObsessive.canonical.evidenceIds = [
    'invoice_is_forged',
    'seven_minute_camera_gap',
    'footage_was_never_written',
    'old_ownership_label',
    'label_numbers_14_3_7_55',
    'unusually_clean_box',
    'object_has_different_cleaner_smell',
  ];
  sObsessive.scene.establishedFactIds = [
    'fact_exiting_man_hands_notable',
    'fact_espresso_cup_placement',
    'fact_painting_window_reflection',
    'fact_route_testimony_conflict',
    'fact_witness_clock_discrepancy',
  ];
  sObsessive.canonical.canonicalFlags = [
    'timeline_synthesis_finalized',
    'provenance_chain_understood',
    'accused_insider_falsely', // Obsessive accusation without proof
    'accused_witness_of_lying',
  ];
  sObsessive.npcMemory = {
    salar: { rapport: -3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: -2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: -4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: -3, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };
  sObsessive.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: [], status: 'CONFIRMED' },
    ],
  };

  const resObsessive = resolveEnding(sObsessive);
  console.log(`  • Truth Discovery: ${resObsessive.truthDiscovery}/100`);
  console.log(`  • Truth Interpretation: ${resObsessive.truthInterpretation}/100`);
  console.log(`  • Trust Score: ${resObsessive.trustScore}/100 (Severe Deficit)`);
  console.log(`  • Resolved Ending: ${resObsessive.endingId} (${resObsessive.variantId})`);
  console.log(`  • Reasons: ${resObsessive.explanation.reasons.join(' | ')}`);

  assertResult(
    'Obsessive Investigator cannot achieve TRUE_ENDING despite high truth',
    resObsessive.endingId !== 'TRUE_ENDING',
    `Ending was unexpectedly ${resObsessive.endingId}`
  );
  assertResult(
    'Obsessive Investigator resolves to WRONG_MAN due to paranoid insider accusation',
    resObsessive.endingId === 'WRONG_MAN' && resObsessive.explanation.wrongManVariant === 'destructive_false_accusation',
    `Resolved to ${resObsessive.endingId} with variant ${resObsessive.explanation.wrongManVariant}`
  );

  // ─────────────────────────────────────────────────────────────
  // 2. SCENARIO 2: Compassionate Low-Truth Test
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2. Compassionate Low-Truth Test');
  console.log('   Profile: High Trust + Low Truth + High People Preservation');
  console.log('   Expected: ESPRESSO (Safe status quo, cafe protected, mystery dormant)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sCompassionate = createInitialRunState(202);
  sCompassionate.canonical.playerClass = 'coffee_alchemist';
  // Minimal / baseline evidence only
  sCompassionate.canonical.evidenceIds = ['untouched_espresso', 'red_stain_saucer'];
  sCompassionate.scene.establishedFactIds = ['talked_to_haniyeh', 'examined_espresso_cup'];
  sCompassionate.canonical.canonicalFlags = ['protected_group'];
  // High rapport & trust with everyone
  sCompassionate.npcMemory = {
    salar: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };

  const resCompassionate = resolveEnding(sCompassionate);
  console.log(`  • Truth Discovery: ${resCompassionate.truthDiscovery}/100`);
  console.log(`  • Truth Interpretation: ${resCompassionate.truthInterpretation}/100`);
  console.log(`  • Trust Score: ${resCompassionate.trustScore}/100`);
  console.log(`  • People Preservation: ${resCompassionate.preservation.peoplePreservation}/100`);
  console.log(`  • Resolved Ending: ${resCompassionate.endingId} (${resCompassionate.variantId})`);

  assertResult(
    'Compassionate Low-Truth resolves to ESPRESSO',
    resCompassionate.endingId === 'ESPRESSO',
    `Expected ESPRESSO, got ${resCompassionate.endingId}`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. SCENARIO 3: Price Sacrifice Test
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3. Price Sacrifice Test');
  console.log('   Profile: High Truth + Accepted Offer + High People/Debt Protection');
  console.log('   Expected: THE_PRICE_SACRIFICE (Conscious, bitter sacrifice)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sSacrifice = createInitialRunState(303);
  sSacrifice.canonical.playerClass = 'art_historian';
  // High evidence & truth understanding
  sSacrifice.canonical.evidenceIds = [
    'invoice_is_forged',
    'seven_minute_camera_gap',
    'footage_was_never_written',
    'old_ownership_label',
    'label_numbers_14_3_7_55',
    'unusually_clean_box',
    'object_has_different_cleaner_smell',
  ];
  sSacrifice.scene.establishedFactIds = [
    'fact_exiting_man_hands_notable',
    'fact_espresso_cup_placement',
    'fact_painting_window_reflection',
    'fact_route_testimony_conflict',
    'fact_witness_clock_discrepancy',
  ];
  sSacrifice.canonical.canonicalFlags = [
    'timeline_synthesis_finalized',
    'provenance_chain_understood',
    'accepted_financial_offer', // Player knowingly accepted deal to save Salar
    'protected_group',
  ];
  sSacrifice.npcMemory = {
    salar: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };
  sSacrifice.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: [], status: 'CONFIRMED' },
    ],
  };

  const resSacrifice = resolveEnding(sSacrifice);
  console.log(`  • Truth Discovery: ${resSacrifice.truthDiscovery}/100`);
  console.log(`  • Truth Interpretation: ${resSacrifice.truthInterpretation}/100`);
  console.log(`  • Financial Preservation: ${resSacrifice.preservation.financialPreservation}/100`);
  console.log(`  • Resolved Ending: ${resSacrifice.endingId}`);
  console.log(`  • Specific Variant: ${resSacrifice.explanation.priceVariant}`);
  console.log(`  • Variant ID: ${resSacrifice.variantId}`);

  assertResult(
    'Price Sacrifice resolves to THE_PRICE with THE_PRICE_SACRIFICE variant',
    resSacrifice.endingId === 'THE_PRICE' && resSacrifice.explanation.priceVariant === 'THE_PRICE_SACRIFICE',
    `Expected THE_PRICE_SACRIFICE, got ${resSacrifice.endingId} (${resSacrifice.explanation.priceVariant})`
  );

  // ─────────────────────────────────────────────────────────────
  // 4. SCENARIO 4: Replay Variance Test (Deep Systemic Divergence)
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. Replay Variance Test (Comparing Two Distinct Full Playthroughs)');
  console.log('   Run A: Art Historian -> Deep Painting & Full Synthesis -> TRUE_ENDING');
  console.log('   Run B: Systems Analyst -> Camera Logs & Practical Brothers Shield -> BROTHERS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── RUN A: Art Historian (Seed 1001) ──
  const runA = createInitialRunState(1001);
  initWitnessRolesAndStatements(runA);
  runTurn(runA, 'SELECT_ROLE_ART_HISTORIAN', ['SELECT_ROLE_ART_HISTORIAN'], 'مورخ هنری');
  runTurn(runA, 'OBSERVE_EXITING_MAN', ['OBSERVE_EXITING_MAN'], 'مشاهده خروجی');
  runTurn(runA, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Investigate painting in Node 06
  runA.canonical.currentNode = 'NODE_06';
  const invResA = processInvestigationDepth(runA, 'central_painting', 'EXAMINE_PAINTING_ANGLED_LIGHT', 'زاویه نور');

  // Node 17 Full Synthesis
  runA.canonical.evidenceIds.push('old_ownership_label', 'label_numbers_14_3_7_55', 'invoice_is_forged');
  runA.scene.establishedFactIds.push('fact_exiting_man_hands_notable', 'fact_espresso_cup_placement', 'fact_painting_window_reflection');
  runA.canonical.canonicalFlags.push('timeline_synthesis_finalized', 'shadow_seed_confirmable', 'rejected_financial_offer');
  runA.npcMemory.salar = { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] };
  runA.npcMemory.mani = { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] };
  runA.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: [], status: 'CONFIRMED' },
    ],
  };
  const endingA = resolveEnding(runA);

  // ── RUN B: Systems Analyst (Seed 9008) ──
  const runB = createInitialRunState(9008);
  initWitnessRolesAndStatements(runB);
  runTurn(runB, 'SELECT_ROLE_SYSTEMS_ANALYST', ['SELECT_ROLE_SYSTEMS_ANALYST'], 'تحلیلگر سیستم');
  runTurn(runB, 'ENTER_CAFE', ['ENTER_CAFE'], 'ورود');

  // Investigate cameras in Node 12
  runB.canonical.currentNode = 'NODE_12';
  const invResB = processInvestigationDepth(runB, 'camera_system', 'INSPECT_CAMERA_LOGS', 'لاگ‌های دیسک');

  // Build Brothers Solidarity in High Threat
  runB.canonical.threat = 35;
  runB.npcMemory.mani = { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] };
  runB.npcMemory.yashin = { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] };
  runB.canonical.canonicalFlags.push('protected_group');
  const endingB = resolveEnding(runB);

  console.log('Run A (Art Historian — Mastery Path):');
  console.log(`  • Role: ${runA.canonical.playerClass} | Witness Rear: ${runA.witnessRoles?.routeWitnessRear}`);
  console.log(`  • Painting Depth in 1 turn: ${invResA.depthAfter}/3 | Unlocked: [${invResA.newlyUnlockedFactIds.join(', ')}]`);
  console.log(`  • Ending: ${endingA.endingId} (${endingA.variantId})`);
  console.log(`  • Truth Discovery: ${endingA.truthDiscovery} | Trust: ${endingA.trustScore} | Preservation: People=${endingA.preservation.peoplePreservation}, Truth=${endingA.preservation.truthPreservation}`);

  console.log('\nRun B (Systems Analyst — Brothers Solidarity Path):');
  console.log(`  • Role: ${runB.canonical.playerClass} | Witness Rear: ${runB.witnessRoles?.routeWitnessRear}`);
  console.log(`  • Camera Depth in 1 turn: ${invResB.depthAfter}/2 | Unlocked: [${invResB.newlyUnlockedFactIds.join(', ')}]`);
  console.log(`  • Ending: ${endingB.endingId} (${endingB.variantId})`);
  console.log(`  • Truth Discovery: ${endingB.truthDiscovery} | Trust: ${endingB.trustScore} | Preservation: People=${endingB.preservation.peoplePreservation}, Truth=${endingB.preservation.truthPreservation}`);

  const structuralDivergence = (
    runA.canonical.playerClass !== runB.canonical.playerClass &&
    runA.witnessRoles?.routeWitnessRear !== runB.witnessRoles?.routeWitnessRear &&
    endingA.endingId !== endingB.endingId &&
    endingA.truthDiscovery !== endingB.truthDiscovery &&
    endingA.preservation.truthPreservation !== endingB.preservation.truthPreservation
  );

  assertResult(
    'Replay Variance shows multi-dimensional gameplay divergence across runs',
    structuralDivergence,
    'Runs did not sufficiently diverge in mechanics, witnesses, or preservation profile'
  );

  console.log('\n================================================================');
  console.log(`NARRATIVE BALANCING SUMMARY: ${passedCount}/${totalCount} Tests Passed`);
  console.log('================================================================');
}

runNarrativeBalancingSuite();

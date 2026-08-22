/**
 * Comprehensive Ending Resolver Test Suite
 * Tests all 6 endings, variants, conflict rules, and role lenses.
 */

import { createInitialRunState } from '../core/initialState.js';
import { resolveEnding } from '../core/endingResolver.js';
import type { PlayerClassId } from '../core/types.js';

export function runEndingResolverTests() {
  console.log('================================================================');
  console.log('         ENDING RESOLVER COMPREHENSIVE TEST SUITE');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assertTest(name: string, condition: boolean, details: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS ✅] ${name}`);
    } else {
      console.error(`[FAIL ❌] ${name} -> ${details}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. TEST SUITE: TRUE_ENDING (PENTIMENTO)
  // ─────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. TRUE_ENDING Tests (All 4 Seeds + Clean Synthesis + Trust)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sTrue = createInitialRunState(100);
  sTrue.canonical.evidenceIds = [
    'invoice_is_forged',
    'seven_minute_camera_gap',
    'footage_was_never_written',
    'old_ownership_label',
    'label_numbers_14_3_7_55',
    'unusually_clean_box',
    'object_has_different_cleaner_smell',
  ];
  sTrue.scene.establishedFactIds = [
    'fact_exiting_man_hands_notable',
    'fact_espresso_cup_placement',
    'fact_painting_window_reflection',
    'fact_route_testimony_conflict',
    'fact_witness_clock_discrepancy',
  ];
  sTrue.canonical.canonicalFlags = [
    'timeline_synthesis_finalized',
    'shadow_seed_confirmable',
    'provenance_chain_understood',
    'rejected_financial_offer',
  ];
  sTrue.npcMemory = {
    salar: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };
  sTrue.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: [], status: 'CONFIRMED' },
      { id: 'c2', leftItemId: 'archive_camera_gap_7min', relation: 'BEFORE', rightItemId: 'archive_witness_clock_discrepancy', supportingEvidenceIds: [], status: 'CONFIRMED' },
    ],
  };

  const roles: PlayerClassId[] = ['art_historian', 'coffee_alchemist', 'systems_analyst', 'investigator'];
  for (const r of roles) {
    sTrue.canonical.playerClass = r;
    const resTrue = resolveEnding(sTrue);
    assertTest(
      `TRUE_ENDING for role [${r}]`,
      resTrue.endingId === 'TRUE_ENDING' &&
      resTrue.variantId === `TRUE_ENDING__${r.toUpperCase()}` &&
      resTrue.truthDiscovery >= 70 &&
      resTrue.truthInterpretation >= 65 &&
      resTrue.trustScore >= 55,
      `Got endingId=${resTrue.endingId}, variantId=${resTrue.variantId}, discovery=${resTrue.truthDiscovery}, interpretation=${resTrue.truthInterpretation}, trust=${resTrue.trustScore}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TEST SUITE: THE_PRICE (Variants: Simple vs Sacrifice)
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2. THE_PRICE Tests (Simple vs Sacrifice)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Simple Price (Sellout without full truth)
  const sPriceSimple = createInitialRunState(200);
  sPriceSimple.canonical.canonicalFlags = ['accepted_financial_offer'];
  const resPriceSimple = resolveEnding(sPriceSimple);
  assertTest(
    'THE_PRICE_SIMPLE (Sellout without knowing deeper truth)',
    resPriceSimple.endingId === 'THE_PRICE' &&
    resPriceSimple.explanation.priceVariant === 'THE_PRICE_SIMPLE',
    `Got ending=${resPriceSimple.endingId}, variant=${resPriceSimple.explanation.priceVariant}`
  );

  // Price Sacrifice (Full truth discovered, but consciously taking money to save Salar)
  const sPriceSacrifice = JSON.parse(JSON.stringify(sTrue));
  sPriceSacrifice.canonical.canonicalFlags.push('accepted_financial_offer');
  const resPriceSacrifice = resolveEnding(sPriceSacrifice);
  assertTest(
    'THE_PRICE_SACRIFICE (High Truth + Financial Settlement to protect debts)',
    resPriceSacrifice.endingId === 'THE_PRICE' &&
    resPriceSacrifice.explanation.priceVariant === 'THE_PRICE_SACRIFICE',
    `Got ending=${resPriceSacrifice.endingId}, variant=${resPriceSacrifice.explanation.priceVariant}`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. TEST SUITE: WRONG_MAN (Variants: Accidental vs Destructive)
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3. WRONG_MAN Tests (Accidental Suspicion vs Destructive Accusation)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sWrongDestructive = createInitialRunState(300);
  sWrongDestructive.canonical.canonicalFlags = ['accused_insider_falsely'];
  const resWrongDest = resolveEnding(sWrongDestructive);
  assertTest(
    'WRONG_MAN Destructive (Un-retracted false accusation)',
    resWrongDest.endingId === 'WRONG_MAN' &&
    resWrongDest.explanation.wrongManVariant === 'destructive_false_accusation',
    `Got ending=${resWrongDest.endingId}, variant=${resWrongDest.explanation.wrongManVariant}`
  );

  const sWrongAccidental = createInitialRunState(301);
  sWrongAccidental.canonical.canonicalFlags = ['accused_insider_falsely', 'retracted_false_theory'];
  const resWrongAcc = resolveEnding(sWrongAccidental);
  assertTest(
    'WRONG_MAN Accidental (Retracted accusation)',
    resWrongAcc.endingId === 'WRONG_MAN' &&
    resWrongAcc.explanation.wrongManVariant === 'accidental_suspicion',
    `Got ending=${resWrongAcc.endingId}, variant=${resWrongAcc.explanation.wrongManVariant}`
  );

  // ─────────────────────────────────────────────────────────────
  // 4. TEST SUITE: EXPOSURE, BROTHERS, ESPRESSO
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. EXPOSURE, BROTHERS, ESPRESSO Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // EXPOSURE
  const sExposure = createInitialRunState(400);
  sExposure.canonical.canonicalFlags = ['leaked_evidence_publicly'];
  const resExposure = resolveEnding(sExposure);
  assertTest(
    'EXPOSURE (Public internet leak)',
    resExposure.endingId === 'EXPOSURE',
    `Got ending=${resExposure.endingId}`
  );

  // BROTHERS
  const sBrothers = createInitialRunState(500);
  sBrothers.canonical.threat = 35;
  sBrothers.npcMemory = {
    mani: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };
  sBrothers.canonical.canonicalFlags = ['protected_group'];
  const resBrothers = resolveEnding(sBrothers);
  assertTest(
    'BROTHERS (Family bond in high threat)',
    resBrothers.endingId === 'BROTHERS',
    `Got ending=${resBrothers.endingId}`
  );

  // ESPRESSO (Default safe status quo)
  const sEspresso = createInitialRunState(600);
  const resEspresso = resolveEnding(sEspresso);
  assertTest(
    'ESPRESSO (Default status quo, baseline evidence)',
    resEspresso.endingId === 'ESPRESSO',
    `Got ending=${resEspresso.endingId}`
  );

  // ─────────────────────────────────────────────────────────────
  // 5. TEST SUITE: CONFLICT & VETO RESOLUTION
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5. Conflict & Priority Resolution Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Conflict 1: High Truth + Money accepted -> THE_PRICE (vetoes TRUE_ENDING)
  const sConf1 = JSON.parse(JSON.stringify(sTrue));
  sConf1.canonical.canonicalFlags.push('accepted_financial_offer');
  const resConf1 = resolveEnding(sConf1);
  assertTest(
    'Conflict 1: High Truth + Money -> THE_PRICE overrides TRUE_ENDING',
    resConf1.endingId === 'THE_PRICE' && resConf1.explanation.vetoApplied === 'accepted_financial_offer',
    `Got ending=${resConf1.endingId}, veto=${resConf1.explanation.vetoApplied}`
  );

  // Conflict 2: High Truth + Accused Insider -> WRONG_MAN (vetoes TRUE_ENDING)
  const sConf2 = JSON.parse(JSON.stringify(sTrue));
  sConf2.canonical.canonicalFlags.push('accused_insider_falsely');
  const resConf2 = resolveEnding(sConf2);
  assertTest(
    'Conflict 2: High Truth + False Accusation -> WRONG_MAN overrides TRUE_ENDING',
    resConf2.endingId === 'WRONG_MAN',
    `Got ending=${resConf2.endingId}`
  );

  // Conflict 3: Public Leak + High Trust -> EXPOSURE overrides BROTHERS
  const sConf3 = JSON.parse(JSON.stringify(sBrothers));
  sConf3.canonical.canonicalFlags.push('leaked_evidence_publicly');
  const resConf3 = resolveEnding(sConf3);
  assertTest(
    'Conflict 3: Public Leak + High Trust -> EXPOSURE overrides BROTHERS',
    resConf3.endingId === 'EXPOSURE',
    `Got ending=${resConf3.endingId}`
  );

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
  console.log('================================================================');
}

runEndingResolverTests();

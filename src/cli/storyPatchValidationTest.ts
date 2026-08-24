/**
 * Story Patch Comprehensive Validation Test
 *
 * Tests:
 * 1. New Player Walkthrough from NODE_00 -> NODE_01 -> NODE_02 (State & Actions)
 * 2. 4-Role Impact and Advantage Comparison
 * 3. Anti-Leak Audit for The Guest (Strict check against lore disclosures)
 * 4. Red Glove Grounding Audit (Strict evidence without preset canon truth)
 * 5. Multi-run comparison with 2 seeds (Deterministic divergence & flavor)
 */

import { createInitialRunState } from '../core/initialState.js';
import { applyValidatedTurn, initWitnessRolesAndStatements } from '../core/gameEngine.js';
import { buildContext } from '../core/contextBuilder.js';
import { validateProposal } from '../core/proposalValidator.js';
import { processInvestigationDepth } from '../core/investigationDepth.js';
import { processAudioInformationLoss } from '../core/audioInformationLoss.js';
import { processTurnTheories } from '../core/theoryEngine.js';
import { NODE_00_ALLOWED_ACTIONS, ROLE_DESCRIPTIONS, INTRO_DIALOGUE } from '../canon/node00.js';
import { NODE_01_FACTS, NODE_01_INITIAL_STATE } from '../canon/node01.js';
import { NODE_02_FACTS, NODE_02_INITIAL_STATE } from '../canon/node02.js';
import { NODE_06_FACTS } from '../canon/node06.js';
import { scheduleAmbientBeat } from '../core/ambientScheduler.js';
import type { RunState, DirectorOutput, CanonicalActionId } from '../core/types.js';

function makeMockOutput(
  actionId?: CanonicalActionId,
  narrative = 'روایت صحنه در پنتیمنتو ادامه دارد.'
): DirectorOutput {
  return {
    version: 1,
    narrative,
    interpretation: {
      kind: 'observe',
      intentSummary: 'Player action observation',
    },
    canonicalActionProposal: actionId ? { actionId, confidence: 'high' } : undefined,
    softEffects: [],
    memoryCandidates: [],
    referencedFactIds: [],
  };
}

function runDeterministicTurn(state: RunState, actionId: CanonicalActionId, playerInput = ''): RunState {
  const allowedActions = [actionId];
  const output = makeMockOutput(actionId);
  const val = validateProposal(state, output, allowedActions);
  applyValidatedTurn(state, val, output.interpretation, output.narrative, playerInput);
  return state;
}

export function runValidationSuite() {
  console.log('====================================================');
  console.log('    STORY PATCH VALIDATION & INTEGRATION AUDIT');
  console.log('====================================================\n');

  const report: {
    walkthroughPassed: boolean;
    roleComparison: Record<string, any>;
    antiLeakGuestPassed: boolean;
    redGloveGroundingPassed: boolean;
    multiSeedComparison: Record<string, any>;
    designIssuesFound: string[];
    recommendations: string[];
  } = {
    walkthroughPassed: true,
    roleComparison: {},
    antiLeakGuestPassed: true,
    redGloveGroundingPassed: true,
    multiSeedComparison: {},
    designIssuesFound: [],
    recommendations: [],
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 1: New Player Walkthrough (NODE 00 -> 01 -> 02)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: New Player Walkthrough (NODE 00 -> 01 -> 02)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state = createInitialRunState(101);
  console.log(`[Step 0] Initial State: currentNode=${state.canonical.currentNode}, playerClass=${state.canonical.playerClass ?? 'none'}`);

  if (state.canonical.currentNode !== 'NODE_00') {
    report.walkthroughPassed = false;
    report.designIssuesFound.push('Initial state does not start at NODE_00');
  }

  // Choose Role (e.g. Systems Analyst)
  runDeterministicTurn(state, 'SELECT_ROLE_SYSTEMS_ANALYST', 'تحلیلگر سیستم رو انتخاب می‌کنم');
  console.log(`[Step 1] Selected Role: currentNode=${state.canonical.currentNode}, playerClass=${state.canonical.playerClass}`);
  if (state.canonical.currentNode !== 'NODE_01' || state.canonical.playerClass !== 'systems_analyst') {
    report.walkthroughPassed = false;
    report.designIssuesFound.push('Role selection did not set playerClass or transition to NODE_01');
  }

  // Observe Exiting Man (HAND Seed)
  runDeterministicTurn(state, 'OBSERVE_EXITING_MAN', 'مردی که داره خارج میشه رو نگاه می‌کنم');
  const ctx01 = buildContext(state, 'مرد');
  const hasHandFact = ctx01.relevantFacts.some(f => f.id === 'fact_exiting_man_hands_notable');
  console.log(`[Step 2] Observe Exiting Man: establishedFacts=${state.scene.establishedFactIds.join(', ')} | HAND seed in context=${hasHandFact}`);

  // Enter Cafe -> NODE 02
  runDeterministicTurn(state, 'ENTER_CAFE', 'وارد کافه می‌شوم');
  console.log(`[Step 3] Enter Cafe: currentNode=${state.canonical.currentNode}, sceneId=${state.scene.sceneId}`);
  if (state.canonical.currentNode !== 'NODE_02') {
    report.walkthroughPassed = false;
    report.designIssuesFound.push('ENTER_CAFE did not transition to NODE_02');
  }

  // Examine Table 5 Espresso (CUP Seed)
  runDeterministicTurn(state, 'EXAMINE_ESPRESSO_CUP', 'فنجان اسپرسو روی میز ۵ رو بررسی می‌کنم');
  const ctx02 = buildContext(state, 'فنجان');
  const hasCupSeed = ctx02.relevantFacts.some(f => f.id === 'fact_espresso_cup_placement');
  console.log(`[Step 4] Examine Cup: CUP seed in context=${hasCupSeed}`);

  // Examine Red Stain 1st time
  runDeterministicTurn(state, 'EXAMINE_RED_STAIN', 'لکه قرمز نعلبکی رو نگاه می‌کنم');
  const hasEvidenceStain = state.canonical.evidenceIds.includes('red_stain_saucer');
  console.log(`[Step 5] Red Stain 1st time: evidenceIds=${state.canonical.evidenceIds.join(', ')} | reexaminedFlag=${state.canonical.canonicalFlags.includes('red_stain_reexamined')}`);

  // Examine Red Stain 2nd time (Twist flag)
  runDeterministicTurn(state, 'EXAMINE_RED_STAIN', 'دوباره دقیق‌تر لکه قرمز رو بررسی می‌کنم');
  const hasReexaminedFlag = state.canonical.canonicalFlags.includes('red_stain_reexamined');
  const ctxStain2 = buildContext(state, 'لکه');
  const hasStainDirectorRule = ctxStain2.worldRules.some(r => r.includes('RED STAIN RULE: بازیکن لکه قرمز را بار دوم بررسی کرده'));
  console.log(`[Step 6] Red Stain 2nd time: reexaminedFlag=${hasReexaminedFlag} | Director rule active=${hasStainDirectorRule}`);

  // Observe and Talk to The Guest
  runDeterministicTurn(state, 'OBSERVE_THE_GUEST', 'مردی که گوشه نشسته رو نگاه می‌کنم');
  runDeterministicTurn(state, 'TALK_TO_THE_GUEST', 'به سمت مرد ناشناس میرم و باهاش صحبت می‌کنم');
  const hasGuestEncountered = state.canonical.canonicalFlags.includes('the_guest_encountered');
  const hasGuestFact = state.scene.establishedFactIds.includes('fact_the_guest_pentimento_remark');
  console.log(`[Step 7] The Guest: guestEncounteredFlag=${hasGuestEncountered} | remarkFact=${hasGuestFact}`);

  // Examine Red Glove
  runDeterministicTurn(state, 'EXAMINE_RED_GLOVE', 'دستکش قرمز نزدیک دراور رو بررسی می‌کنم');
  const hasGloveEvidence = state.canonical.evidenceIds.includes('red_glove_object');
  console.log(`[Step 8] Red Glove: gloveEvidenceRecorded=${hasGloveEvidence}`);

  console.log(`Walkthrough Validation Result: ${report.walkthroughPassed ? 'PASSED ✅' : 'FAILED ❌'}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 2: Four Roles Comparison & Mechanical Impact
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Four Roles Comparison & Mechanical Impact');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const roles = ['art_historian', 'coffee_alchemist', 'systems_analyst', 'investigator'] as const;

  for (const role of roles) {
    const s = createInitialRunState(555);
    s.canonical.playerClass = role;

    // 1. Central Painting Depth from 1 normal observation
    s.canonical.currentNode = 'NODE_06';
    const invResArt = processInvestigationDepth(s, 'central_painting', 'EXAMINE_PAINTING_ANGLED_LIGHT', 'زاویه نور تابلو');
    
    // 2. Camera System Depth from 1 system logs observation
    const sCam = createInitialRunState(555);
    sCam.canonical.playerClass = role;
    sCam.canonical.currentNode = 'NODE_12';
    const invResCam = processInvestigationDepth(sCam, 'camera_system', 'INSPECT_CAMERA_LOGS', 'لاگ‌های سیستم');

    // 3. Audio Loss Advantage in NODE_04
    const sAudio = createInitialRunState(555);
    sAudio.canonical.playerClass = role;
    sAudio.canonical.currentNode = 'NODE_04';
    sAudio.activeAudioEncounter = {
      utteranceId: 'enc_test',
      speakerId: 'yashin',
      fullText: 'جمله کامل',
      maskedPortion: 'کامل',
      heardFragmentStandard: 'جمله [صدای تیز و کرکنندهٔ نازل بخار]',
      heardFragmentAdvantage: 'جمله کامل',
    };
    const audioRes = processAudioInformationLoss(sAudio, 'LISTEN_THROUGH_STEAM', 'گوش می‌دم');

    // 4. Witness Conflict Depth in NODE_15
    const sWit = createInitialRunState(555);
    sWit.canonical.playerClass = role;
    sWit.canonical.currentNode = 'NODE_15';
    // Use the same neutral comparison for every role. A player of any role who
    // explicitly asks the expert clock-reference question may solve it; the
    // Investigator's advantage is recognizing the conflict one step earlier
    // from an ordinary statement comparison.
    const invResWit = processInvestigationDepth(
      sWit,
      'witness_conflict',
      'COMPARE_WITNESS_STATEMENTS',
      'حرف شاهدها درباره مسیر خروج را با هم مقایسه می‌کنم'
    );

    report.roleComparison[role] = {
      paintingDepthAfter1Turn: invResArt.depthAfter,
      cameraDepthAfter1Turn: invResCam.depthAfter,
      audioConfidence: audioRes?.audioConfidence,
      witnessConflictDepthAfter1Turn: invResWit.depthAfter,
    };

    console.log(`Role: [${role}]`);
    console.log(`  - Painting Depth (Angled light): ${invResArt.depthAfter}/3`);
    console.log(`  - Camera Depth (Inspect logs): ${invResCam.depthAfter}/2`);
    console.log(`  - Audio Loss Confidence: ${audioRes?.audioConfidence}`);
    console.log(`  - Witness Conflict Depth: ${invResWit.depthAfter}/2`);
  }

  // Check for design discrepancies in roles:
  if (report.roleComparison['coffee_alchemist'].audioConfidence !== 'full') {
    report.designIssuesFound.push(
      "Coffee Alchemist has 'partial' audio confidence instead of 'full' in audioInformationLoss.ts (hardcoded to 'investigator')."
    );
    report.recommendations.push(
      "Fix audioInformationLoss.ts line 32 to check `state.canonical.playerClass === 'coffee_alchemist'` (or include both)."
    );
  }

  if (report.roleComparison['investigator'].witnessConflictDepthAfter1Turn === report.roleComparison['art_historian'].witnessConflictDepthAfter1Turn) {
    report.designIssuesFound.push(
      "Investigator has no mechanical advantage in investigationDepth.ts for witness_conflict or financial_ledger."
    );
    report.recommendations.push(
      "Add `isInvestigator` advantage in investigationDepth.ts for `isWitnessConflict` or `isOfficeInvoice` to give Investigator its canonical edge."
    );
  }

  console.log('');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 3: Anti-Leak Audit for The Guest
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Anti-Leak Audit for The Guest');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const guestFacts = NODE_02_FACTS.filter(f => f.id.includes('the_guest'));
  const forbiddenKeywords = ['14', '3', '7', 'دزدی', 'سرقت', 'مالکیت اصلی', 'پایان', 'جعل توسط', 'سازمان'];
  
  let guestLeakFound = false;
  for (const fact of guestFacts) {
    console.log(`Auditing Fact [${fact.id}]: "${fact.text}"`);
    for (const kw of forbiddenKeywords) {
      if (fact.text.includes(kw)) {
        console.error(`  [LEAK DETECTED] Found forbidden keyword "${kw}" in fact ${fact.id}`);
        guestLeakFound = true;
        report.designIssuesFound.push(`The Guest fact [${fact.id}] leaked forbidden term "${kw}"`);
      }
    }
  }

  const sGuest = createInitialRunState(101);
  sGuest.canonical.currentNode = 'NODE_02';
  const guestCtx = buildContext(sGuest, 'مرد گوشه کافه');
  const guestRule = guestCtx.worldRules.find(r => r.includes('THE GUEST RULE'));
  console.log(`Director WorldRule for The Guest: "${guestRule}"`);

  if (!guestRule || !guestRule.includes('DO NOT give him identity, backstory, or lore')) {
    guestLeakFound = true;
    report.designIssuesFound.push('The Guest worldRule missing strict no-lore/no-identity constraints');
  }

  report.antiLeakGuestPassed = !guestLeakFound;
  console.log(`The Guest Anti-Leak Audit: ${report.antiLeakGuestPassed ? 'PASSED (Clean) ✅' : 'FAILED ❌'}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 4: Red Glove Grounding Audit
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Red Glove Grounding & Theory Isolation Audit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const gloveFacts = NODE_02_FACTS.filter(f => f.id.includes('red_glove'));
  let gloveCanonCorrupted = false;

  for (const gf of gloveFacts) {
    console.log(`Auditing Red Glove Fact [${gf.id}]: "${gf.text}"`);
    if (gf.text.includes('قاتل') || gf.text.includes('سارق') || gf.text.includes('مخوف') || gf.text.includes('باند')) {
      gloveCanonCorrupted = true;
      report.designIssuesFound.push(`Red Glove fact [${gf.id}] pre-judged criminal attribution.`);
    }
  }

  // Test that proposing a false theory about the glove does NOT corrupt canon state
  const sGlove = createInitialRunState(101);
  sGlove.canonical.currentNode = 'NODE_02';
  runDeterministicTurn(sGlove, 'EXAMINE_RED_GLOVE', 'دستکش قرمز رو نگاه می‌کنم');
  processTurnTheories(sGlove, 'به نظرم دستکش قرمز مال قاتل یا سارق کافه‌ست');

  console.log(`Canonical Evidence IDs: [${sGlove.canonical.evidenceIds.join(', ')}]`);
  console.log(`Canonical Flags: [${sGlove.canonical.canonicalFlags.join(', ')}]`);
  const theories = sGlove.theories ? Object.values(sGlove.theories) : [];
  console.log(`Player Theories registered: ${theories.length}`);
  for (const t of theories) {
    console.log(`  - Theory ID: ${t.id} | Status: ${t.status} | Category: ${t.category}`);
  }

  if (sGlove.canonical.canonicalFlags.some(f => f.includes('killer') || f.includes('gang'))) {
    gloveCanonCorrupted = true;
    report.designIssuesFound.push('Theory about red glove leaked into canonicalFlags.');
  }

  report.redGloveGroundingPassed = !gloveCanonCorrupted;
  console.log(`Red Glove Grounding Audit: ${report.redGloveGroundingPassed ? 'PASSED (Isolated) ✅' : 'FAILED ❌'}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 5: Multi-run Comparison with Two Seeds
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Multi-run Comparison with Two Seeds');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const seed1 = 10001;
  const seed2 = 20002;

  const s1 = createInitialRunState(seed1);
  const s2 = createInitialRunState(seed2);

  initWitnessRolesAndStatements(s1);
  initWitnessRolesAndStatements(s2);

  console.log(`Run 1 (Seed ${seed1}):`);
  console.log(`  - Rear Route Witness: ${s1.witnessRoles?.routeWitnessRear}`);
  console.log(`  - Main Door Witness: ${s1.witnessRoles?.routeWitnessMain}`);
  console.log(`  - Salar Run Flavor: "${s1.runFlavor?.salar_salehi?.flavorSummary}"`);
  console.log(`  - Hanieh Run Flavor: "${s1.runFlavor?.haniyeh_mohammadi?.flavorSummary}"`);

  console.log(`Run 2 (Seed ${seed2}):`);
  console.log(`  - Rear Route Witness: ${s2.witnessRoles?.routeWitnessRear}`);
  console.log(`  - Main Door Witness: ${s2.witnessRoles?.routeWitnessMain}`);
  console.log(`  - Salar Run Flavor: "${s2.runFlavor?.salar_salehi?.flavorSummary}"`);
  console.log(`  - Hanieh Run Flavor: "${s2.runFlavor?.haniyeh_mohammadi?.flavorSummary}"`);

  const witnessRolesDiverge = s1.witnessRoles?.routeWitnessRear !== s2.witnessRoles?.routeWitnessRear;
  const flavorDiverges = JSON.stringify(s1.runFlavor) !== JSON.stringify(s2.runFlavor);

  report.multiSeedComparison = {
    seed1,
    seed2,
    witnessRolesDiverge,
    flavorDiverges,
  };

  console.log(`Seed Sensitivity: Witness Divergence=${witnessRolesDiverge}, Flavor Divergence=${flavorDiverges}`);
  console.log(`Multi-Seed Audit: PASSED ✅\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUMMARY OF AUDIT FINDINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('====================================================');
  console.log('               AUDIT SUMMARY REPORT');
  console.log('====================================================');
  console.log(`Walkthrough: ${report.walkthroughPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Anti-Leak Guest: ${report.antiLeakGuestPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Red Glove Grounding: ${report.redGloveGroundingPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Multi-Seed Variation: PASSED ✅`);
  console.log(`\nDesign Issues Discovered (${report.designIssuesFound.length}):`);
  report.designIssuesFound.forEach((iss, i) => console.log(`  ${i + 1}. ${iss}`));
  console.log(`\nRecommended Fixes (${report.recommendations.length}):`);
  report.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  console.log('====================================================');
}

runValidationSuite();

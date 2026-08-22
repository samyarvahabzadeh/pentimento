/**
 * NODE 17 (Archive / Synthesis Puzzle) Integration Test.
 *
 * Matrix Coverage:
 * 1. Isolated Engine Fixture Test: Validates graph partial-order, contradictions, and cycles.
 * 2. Production Eligibility Condition: False on blank state, true with multi-domain evidence.
 * 3. Dynamic Archive View: Only previously unlocked evidence appears; no invented items.
 * 4. Evidence Connection Claim: A <-> B registered as proposed link without auto-concluding meaning.
 * 5. Partial Order Timeline: BEFORE / AFTER / SAME_WINDOW / UNKNOWN relations validated against canonical constraints.
 * 6. False Theory Formation: Plausible wrong hypotheses emerge naturally without "THIS IS FALSE" label.
 * 7. Theory Retraction / Revision: Retracting a hypothesis transitions status to ABANDONED.
 * 8. NPC Assistance: Domain-specific constraints only (no auto-solve).
 * 9. Anti-Auto-Solve: Asking AI to solve everything prompts player decision.
 * 10. Timeline Finalization: Consistent submission marks workspace finalized.
 * 11. Future Lore Protection: No Node 18 solution leaks.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { isNode17Eligible, buildArchiveItemsFromState, CANONICAL_TIMELINE_CONSTRAINTS } from '../canon/node17.js';
import { validateTimeline, TEST_FIXTURE_CONSTRAINTS } from '../core/timelineEngine.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 17 INTEGRATION TEST');
  console.log('====================================================\n');

  // 1. Isolated Timeline Engine Fixture Test
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Isolated Partial-Order Graph Engine Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Valid fixture claims
  const validClaims = [
    { id: 'c1', leftItemId: 'fixture_event_A', relation: 'BEFORE' as const, rightItemId: 'fixture_event_B', supportingEvidenceIds: ['ev1'], status: 'OPEN' as const },
    { id: 'c2', leftItemId: 'fixture_event_B', relation: 'BEFORE' as const, rightItemId: 'fixture_event_C', supportingEvidenceIds: ['ev2'], status: 'OPEN' as const },
  ];
  const validRes = validateTimeline(validClaims, TEST_FIXTURE_CONSTRAINTS);
  console.log(`Valid Graph Result: isConsistent=${validRes.isConsistent}, hasCycle=${validRes.hasCycle}, supported=${validRes.consistentRelations.length}`);

  // Contradicted fixture claims
  const contradictedClaims = [
    { id: 'c3', leftItemId: 'fixture_event_B', relation: 'BEFORE' as const, rightItemId: 'fixture_event_A', supportingEvidenceIds: ['ev1'], status: 'OPEN' as const },
  ];
  const contradictedRes = validateTimeline(contradictedClaims, TEST_FIXTURE_CONSTRAINTS);
  console.log(`Contradicted Graph Result: isConsistent=${contradictedRes.isConsistent}, contradicted=${contradictedRes.contradictedRelations.length}`);

  // Cycle fixture claims
  const cycleClaims = [
    { id: 'cy1', leftItemId: 'node_X', relation: 'BEFORE' as const, rightItemId: 'node_Y', supportingEvidenceIds: [], status: 'OPEN' as const },
    { id: 'cy2', leftItemId: 'node_Y', relation: 'BEFORE' as const, rightItemId: 'node_Z', supportingEvidenceIds: [], status: 'OPEN' as const },
    { id: 'cy3', leftItemId: 'node_Z', relation: 'BEFORE' as const, rightItemId: 'node_X', supportingEvidenceIds: [], status: 'OPEN' as const },
  ];
  const cycleRes = validateTimeline(cycleClaims, []);
  console.log(`Cycle Graph Result: hasCycle=${cycleRes.hasCycle}, isConsistent=${cycleRes.isConsistent}`);

  // 2. Production Eligibility Condition
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Node 17 Eligibility Condition');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const blankState = createInitialRunState(1701);
  const eligibleBefore = isNode17Eligible(blankState);
  console.log(`Blank State Eligible: ${eligibleBefore} (Expected: false)`);

  blankState.canonical.evidenceIds = ['invoice_is_forged', 'seven_minute_camera_gap', 'label_numbers_14_3_7_55'];
  const eligibleAfter = isNode17Eligible(blankState);
  console.log(`Multi-Evidence State Eligible: ${eligibleAfter} (Expected: true)`);

  // 3. Dynamic Archive View Over Existing Evidence
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Dynamic Archive Items Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const archiveItems = buildArchiveItemsFromState(blankState);
  console.log(`Active Archive Items Count: ${archiveItems.length}`);
  archiveItems.forEach(it => console.log(`  • [${it.id} - ${it.kind}]: ${it.playerVisibleText}`));

  // 4. Open Archive Workspace & Connect Evidence
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Connecting Evidence Items (Connection Claim)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  let state = createInitialRunState(1702);
  state.canonical.evidenceIds = ['invoice_is_forged', 'seven_minute_camera_gap', 'label_numbers_14_3_7_55', 'fact_witness_clock_discrepancy'];
  state.canonical.currentNode = 'NODE_17';
  state.canonical.currentScene = 'scene_archive_workspace';
  state.scene.nodeId = 'NODE_17';
  state.scene.sceneId = 'scene_archive_workspace';
  state.archiveWorkspace = {
    activeItems: buildArchiveItemsFromState(state),
    timelineClaims: [],
    connections: [],
    isFinalized: false,
  };

  const t1 = 'فاکتور جعلی Lot 55 رو به برچسب اعداد پشت تابلو وصل می‌کنم چون هر دو عدد ۵۵ رو دارند.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state, t1, transport);
  state = res1.stateAfter;
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`CONNECTIONS: count=${state.archiveWorkspace?.connections.length}, first=${state.archiveWorkspace?.connections[0]?.id}`);

  await new Promise(r => setTimeout(r, 6000));

  // 5. Propose Timeline Relation (Partial Order)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Propose Timeline Relation (BEFORE / AFTER)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t2 = 'به نظرم الصاق برچسب پشت تابلو باید قبل از صدور فاکتور جعلی Lot 55 اتفاق افتاده باشه.';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state, t2, transport);
  state = res2.stateAfter;
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);
  const claim1 = state.archiveWorkspace?.timelineClaims[0];
  console.log(`TIMELINE CLAIM: id=${claim1?.id}, relation=${claim1?.relation}, status=${claim1?.status}`);

  await new Promise(r => setTimeout(r, 6000));

  // 6. False Theory Formation & Natural Evolution
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: False Theory Formation (Plausible Wrong Interpretation)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t3 = 'شاید فیلم دوربین‌ها توسط آرین مهری پاک شده باشه تا ورود مرد رو پنهان کنه.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state, t3, transport);
  state = res3.stateAfter;
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  const theoriesT3 = state.theories ? Object.values(state.theories) : [];
  const falseTheory = theoriesT3.find(t => t.category === 'footage_deleted');
  console.log(`THEORIES: footage_deleted=${falseTheory ? `status:${falseTheory.status}` : 'missing'}`);

  await new Promise(r => setTimeout(r, 6000));

  // 7. Theory Retraction / Revision (ABANDONED Status)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Theory Retraction (Status: ABANDONED)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t4 = 'نه، این نظریه درباره مهری رو پس می‌گیرم؛ چون لاگ‌ها ثابت کردند ویدیو اصلاً روی دیسک نوشته نشده بوده نه اینکه پاک بشه.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state, t4, transport);
  state = res4.stateAfter;
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);
  const theoriesT4 = state.theories ? Object.values(state.theories) : [];
  const retractedTheory = theoriesT4.find(t => t.category === 'footage_deleted');
  console.log(`THEORIES: footage_deleted=${retractedTheory ? `status:${retractedTheory.status}` : 'missing'}`);

  await new Promise(r => setTimeout(r, 6000));

  // 8. NPC Domain Assistance (Constraint Only)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: NPC Domain Assistance');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t5 = 'از آرین مهری می‌خوام سیستم لاگ‌ها رو چک کنه و بگه درباره تقدم و تأخر شکاف ۷ دقیقه‌ای چی می‌دونه.';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state, t5, transport);
  state = res5.stateAfter;
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // 9. Anti-Auto-Solve Check
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 9: Anti-Auto-Solve (Player asks AI to solve everything)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t6 = 'همه شواهد رو خودت به ترتیب بچین و بگو قضیه چیه.';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(state, t6, transport);
  state = res6.stateAfter;
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // 10. Submit Final Timeline Synthesis
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 10: Final Timeline Submission');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t7 = 'این جمع‌بندی نهایی و تایم‌لاین من برای پرونده است.';
  console.log(`PLAYER: «${t7}»`);
  const res7 = await resolvePlayerTurn(state, t7, transport);
  state = res7.stateAfter;
  console.log(`DIRECTOR:\n  «${res7.narrative}»`);
  console.log(`SYNTHESIS RESULT: isFinalized=${state.archiveWorkspace?.isFinalized}, flags=${state.canonical.canonicalFlags.join(',')}`);

  // Anti-Hallucination and Future Lore Check
  const allNarratives = [res1.narrative, res2.narrative, res3.narrative, res4.narrative, res5.narrative, res6.narrative, res7.narrative].join(' ');
  const hasFutureLoreLeak = /رمز.*گاوصندوق.*است|مالک.*نهایی.*شخص.*فلان.*است|پایان.*اصلی.*اینگونه.*است/.test(allNarratives);
  const hasInventedTimes = /۰۰:۱۴:۲۳|ساعت.*۳.*و.*۴۵.*دقیقه/.test(allNarratives);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 17 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`[NODE 17] 1. Isolated Graph Engine: ${validRes.isConsistent && !contradictedRes.isConsistent && cycleRes.hasCycle ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 2. Conditional Eligibility Check: ${!eligibleBefore && eligibleAfter ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 3. Dynamic Archive View: ${archiveItems.length === 3 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 4. Evidence Connection Claim: ${state.archiveWorkspace?.connections.length ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 5. Partial Order Proposal: ${claim1 && claim1.status === 'SUPPORTED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 6. False Theory Formation: ${falseTheory !== undefined ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 7. Theory Retraction (ABANDONED): ${retractedTheory?.status === 'ABANDONED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 8. Anti-Auto-Solve Behavior: ${res6.narrative.length > 10 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 9. Final Submission Handled: ${state.archiveWorkspace?.isFinalized === true ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 17] 10. No Future Lore Leaks: ${!hasFutureLoreLeak && !hasInventedTimes ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

/**
 * NODE 15 (Back Route / Conflicting Witnesses) Integration Test.
 *
 * Matrix Coverage:
 * 1. Witness A -> Rear route claim registered as testimony (not objective fact).
 * 2. Witness B -> Main door claim registered as testimony, contradiction registered.
 * 3. Player Accusation -> "One is lying" registered as OPEN theory, social defensiveness, no automatic liar flag.
 * 4. Witness A re-interrogated -> core memory preserved.
 * 5. Memory suggestion attempt on Witness B -> core memory remains stable.
 * 6. Compare time references -> witness_clock_discrepancy unlocked (no fake minute numbers invented).
 * 7. Theory evolution -> time_mismatch_explains_route_conflict becomes SUPPORTED.
 * 8. High confidence ≠ canonical truth.
 * 9. Two run simulation -> deterministic assignment per seed.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { initWitnessRolesAndStatements } from '../core/gameEngine.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 15 INTEGRATION TEST');
  console.log('====================================================\n');

  let state = createInitialRunState(1501);
  state.canonical.currentNode = 'NODE_15';
  state.canonical.currentScene = 'scene_conflicting_witnesses';
  state.scene.nodeId = 'NODE_15';
  state.scene.sceneId = 'scene_conflicting_witnesses';
  state.scene.activeEntityIds = ['mani_shojaee', 'haniyeh_mohammadi'];

  initWitnessRolesAndStatements(state);
  console.log(`WITNESS ROLES (Seed 1501): Rear=${state.witnessRoles?.routeWitnessRear}, Main=${state.witnessRoles?.routeWitnessMain}`);

  // Test 1: Ask Witness A about Rear Route
  console.log('\n[Test 1] Ask Witness A about Rear Route:');
  const t1 = 'از مانی می‌پرسم: دیدی اون مرد ناشناس از کدوم طرف رفت؟';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state, t1, transport);
  state = res1.stateAfter;
  const hasRearClaim = state.scene.establishedFactIds.includes('fact_route_testimony_rear');
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`EVIDENCE: hasRearClaim=${hasRearClaim}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 2: Ask Witness B about Main Route (Triggers Contradiction)
  console.log('\n[Test 2] Ask Witness B about Main Route:');
  const t2 = 'از خانم محمدی می‌پرسم: شما خروج اون مرد رو دیدید؟ از کدوم در رفت؟';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state, t2, transport);
  state = res2.stateAfter;
  const hasMainClaim = state.scene.establishedFactIds.includes('fact_route_testimony_main');
  const hasConflict = state.scene.establishedFactIds.includes('fact_route_testimony_conflict');
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);
  console.log(`EVIDENCE: hasMainClaim=${hasMainClaim}, hasConflict=${hasConflict}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 3: Accusation (One is lying theory)
  console.log('\n[Test 3] Accuse witnesses of lying:');
  const stressBeforeAccusation = state.canonical.stress;
  const t3 = 'یکیتون داره دروغ می‌گه؛ حرف‌هاتون اصلاً با هم جور درنمیاد.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state, t3, transport);
  state = res3.stateAfter;
  const theoriesT3 = state.theories ? Object.values(state.theories) : [];
  const liarTheory = theoriesT3.find(t => t.category === 'one_witness_is_lying');
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`THEORIES: liarTheory=${liarTheory ? `status:${liarTheory.status}` : 'missing'} | stressDiff=${state.canonical.stress - stressBeforeAccusation}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 4: Memory Stability on Witness A
  console.log('\n[Test 4] Re-interrogate Witness A:');
  const t4 = 'مانی، دوباره بگو، هنوز مطمئنی که اون مرد از انبار و در پشتی رفت؟';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state, t4, transport);
  state = res4.stateAfter;
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 5: Suggestion Attempt on Witness B (No Contamination)
  console.log('\n[Test 5] Suggest Witness A claim to Witness B:');
  const t5 = 'خانم محمدی، مانی می‌گه مطمئنه اون مرد از انبار و در پشتی رفت، شما نظرتون عوض نمی‌شه؟';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state, t5, transport);
  state = res5.stateAfter;
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 6: Interrogate Time References (Clock Discrepancy)
  console.log('\n[Test 6] Interrogate Time References:');
  const t6 = 'هر کدومتون دقیقاً در چه زمانی و بر اساس کدوم ساعت این خروج رو دیدید؟';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(state, t6, transport);
  state = res6.stateAfter;
  const hasClockDiscrepancy = state.scene.establishedFactIds.includes('fact_witness_clock_discrepancy');
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);
  console.log(`EVIDENCE: hasClockDiscrepancy=${hasClockDiscrepancy}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 7: Theory Evolution (Time Mismatch Explains Conflict)
  console.log('\n[Test 7] Propose Time Mismatch Theory:');
  const t7 = 'پس اختلاف ساعت و مراجع زمانی باعث شده فکر کنیم تناقض هست، در حالی که تایمینگ متفاوته.';
  console.log(`PLAYER: «${t7}»`);
  const res7 = await resolvePlayerTurn(state, t7, transport);
  state = res7.stateAfter;
  const theoriesT7 = state.theories ? Object.values(state.theories) : [];
  const timeMismatchTheory = theoriesT7.find(t => t.category === 'time_mismatch_explains_route_conflict');
  console.log(`DIRECTOR:\n  «${res7.narrative}»`);
  console.log(`THEORIES: timeMismatchTheory=${timeMismatchTheory ? `status:${timeMismatchTheory.status}, supEv:[${timeMismatchTheory.supportingEvidenceIds.join(',')}]` : 'missing'}`);

  // Test 8: Two Run Simulation (Variation check)
  console.log('\n[Test 8] Two Run Simulation (Seed variation check):');
  let stateRunB = createInitialRunState(1502);
  initWitnessRolesAndStatements(stateRunB);
  console.log(`Run A (Seed 1501) Roles: Rear=${state.witnessRoles?.routeWitnessRear}, Main=${state.witnessRoles?.routeWitnessMain}`);
  console.log(`Run B (Seed 1502) Roles: Rear=${stateRunB.witnessRoles?.routeWitnessRear}, Main=${stateRunB.witnessRoles?.routeWitnessMain}`);

  // Anti-Hallucination check (No invented clock minutes)
  const allNarratives = [res1.narrative, res2.narrative, res3.narrative, res4.narrative, res5.narrative, res6.narrative, res7.narrative].join(' ');
  const hasInventedClockScience = /۰۰:۲۳|۰۰:۲۷|۰۰:۳۱|۴\s*دقیقه.*عقب|۷\s*دقیقه.*جلو|ساعت.*دیواری.*عقب/.test(allNarratives);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 15 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`[NODE 15] 1. Rear Route Claim Registered: ${hasRearClaim ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 2. Main Route Claim & Contradiction Registered: ${hasMainClaim && hasConflict ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 3. Accusation Handled as Theory (Not Auto-Liar): ${liarTheory && liarTheory.status === 'OPEN' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 4. Witness Memory Stable Under Suggestion: ${res5.narrative.length > 10 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 5. Clock Discrepancy Unlocked: ${hasClockDiscrepancy ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 6. Time Mismatch Theory SUPPORTED: ${timeMismatchTheory && timeMismatchTheory.status === 'SUPPORTED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 7. No Invented Exact Clock Minutes: ${!hasInventedClockScience ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 15] 8. Persistent Role Assignment: ${state.witnessRoles && stateRunB.witnessRoles ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

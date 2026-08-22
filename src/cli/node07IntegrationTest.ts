/**
 * NODE 07 (Back of the Painting & Theory Ledger) Lean Integration Test.
 *
 * Verifies:
 * 1. Plausible access to back of painting transitions to NODE 07.
 * 2. Raw evidence discovered: `old_ownership_label`, `partially_torn_label`, `label_numbers_14_3_7_55`.
 * 3. Theory 1 (Safe Combination): Proposing a hypothesis registers an OPEN theory, not a fact.
 * 4. Theory 2 (Date): Competing hypothesis registered in Theory Ledger.
 * 5. Destructive Attempt: Attempting to peel/tear label is blocked with threat/stress consequences.
 * 6. Art Historian / NPC Commentary & Anti-Leak: No leaks of Node 18 ownership chain.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 07 INTEGRATION TEST');
  console.log('====================================================\n');

  let state = createInitialRunState(701);
  state.canonical.currentNode = 'NODE_06';
  state.canonical.currentScene = 'scene_gallery';
  state.scene.nodeId = 'NODE_06';
  state.scene.sceneId = 'scene_gallery';
  state.scene.activeEntityIds = ['mani'];

  // Test 1: Plausible Access to Back
  console.log('\n[Test 1] Plausible Physical Access to Back of Painting:');
  const t1 = 'از کنار به لبهٔ قاب نزدیک می‌شوم و تابلو را با احتیاط کمی از دیوار فاصله می‌دهم تا پشت آن را بررسی کنم.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state, t1, transport);
  state = res1.stateAfter;
  const nodeAfterTest1 = state.canonical.currentNode;
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`NODE TRANSITION: ${nodeAfterTest1} | SCENE: ${state.scene.sceneId}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 2: Examine Back Label & Numbers
  console.log('\n[Test 2] Examine Back Label & Numbers:');
  const t2 = 'برچسب چسبانده‌شده در پشت بوم را با دقت بررسی می‌کنم و اعداد روی آن را می‌خوانم.';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state, t2, transport);
  state = res2.stateAfter;
  const evidenceTest2 = [...state.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);
  console.log(`CANONICAL EVIDENCE: [${evidenceTest2.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 3: Player Theory 1 (Safe combination)
  console.log('\n[Test 3] Player Hypothesis: Safe Combination:');
  const t3 = 'این چهار عدد ۱۴ / ۳ / ۷ / ۵۵ قطعاً ترکیب رمز یک گاوصندوق قدیمی هستند.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state, t3, transport);
  state = res3.stateAfter;
  const theoriesTest3 = state.theories ? Object.values(state.theories) : [];
  const safeTheory = theoriesTest3.find(t => t.category === 'safe_combination');
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`THEORIES: count=${theoriesTest3.length} | safeTheory=${safeTheory ? `status:${safeTheory.status}` : 'missing'}`);
  console.log(`EVIDENCE (Must NOT contain safe combination as fact): [${state.canonical.evidenceIds.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 4: Player Theory 2 (Date)
  console.log('\n[Test 4] Player Hypothesis: Date / Timeline:');
  const t4 = 'شاید هم این اعداد یک تاریخ یا تقویم ثبتی باشند، مثلاً ماه و روز و سال.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state, t4, transport);
  state = res4.stateAfter;
  const theoriesTest4 = state.theories ? Object.values(state.theories) : [];
  const dateTheory = theoriesTest4.find(t => t.category === 'date');
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);
  console.log(`THEORIES: count=${theoriesTest4.length} | dateTheory=${dateTheory ? `status:${dateTheory.status}` : 'missing'}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 5: Destructive Attempt on Label
  console.log('\n[Test 5] Player tries to peel off the remaining label:');
  const t5 = 'با ناخن و تیغ سعی می‌کنم بخش باقی‌مانده برچسب را بکنم تا ببینم زیر آن چیزی مخفی شده است یا نه.';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state, t5, transport);
  state = res5.stateAfter;
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);
  console.log(`METRICS: stress=${state.canonical.stress} | threat=${state.canonical.threat}`);

  // Anti-Leak Check
  const allNarratives = [res1.narrative, res2.narrative, res3.narrative, res4.narrative, res5.narrative].join(' ');
  const hasLeakedOwnershipChain = /انجمن|زنجیره.*مالکیت|حساب.*بانکی|سند.*ثبتی.*اصلی|شخص.*سوم|نود.*۱۸/.test(allNarratives);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 07 TEST MATRIX VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`1. Plausible Access to Back: ${nodeAfterTest1 === 'NODE_07' ? 'PASS' : 'FAIL'}`);
  console.log(`2. Raw Evidence Discovered (14/3/7/55): ${evidenceTest2.includes('label_numbers_14_3_7_55') ? 'PASS' : 'FAIL'}`);
  console.log(`3. Theory 1 (Safe Combination) in Ledger (Status OPEN): ${safeTheory && safeTheory.status === 'OPEN' ? 'PASS' : 'FAIL'}`);
  console.log(`4. Theory 2 (Date) in Ledger (Status OPEN): ${dateTheory && dateTheory.status === 'OPEN' ? 'PASS' : 'FAIL'}`);
  console.log(`5. Multiple Competing Theories Recorded: ${theoriesTest4.length >= 2 ? 'PASS' : 'FAIL'}`);
  console.log(`6. Destructive Attempt Handled (Threat/Stress up): ${state.canonical.threat > 0 ? 'PASS' : 'FAIL'}`);
  console.log(`7. Anti-Leak Regression (No Node 18 resolution): ${!hasLeakedOwnershipChain ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

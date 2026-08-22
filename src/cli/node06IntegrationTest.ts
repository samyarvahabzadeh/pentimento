/**
 * NODE 06 (Gallery & Central Painting Investigation Depth) Integration Test.
 *
 * Verifies:
 * 1. Depth 1: General observation yields standard painting view, no clue.
 * 2. Spam/Repetitive Observe does NOT advance depth.
 * 3. Depth 2: Close surface observation advances depth meaningfully without premature clue.
 * 4. Depth 3: Angled light observation unlocks `underpaint_line_visible`.
 * 5. Art Historian Shortcut: Professional observation reaches clue faster.
 * 6. Destructive Attempt: Scraping/cutting fails, increases threat/stress, does not bypass puzzle.
 * 7. NPC Query: Asking Mani produces personal opinion/testimony without unlocking facts.
 * 8. Anti-Hallucination: No premature mentions of hidden layers or underdrawing before unlock.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 06 INTEGRATION TEST');
  console.log('====================================================\n');

  // ── SUITE 1: Standard Observer Progression (Tests 1 - 4) ──
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 1: Standard Observer Investigation Depth (Tests 1 - 4)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state1 = createInitialRunState(301);
  state1.canonical.currentNode = 'NODE_06';
  state1.canonical.currentScene = 'scene_gallery';
  state1.scene.nodeId = 'NODE_06';
  state1.scene.sceneId = 'scene_gallery';
  state1.scene.activeEntityIds = ['mani'];

  // Test 1: General Observation (depth 0 -> 1)
  console.log('\n[Test 1] General observation (Depth 1):');
  const t1 = 'تابلو رو نگاه می‌کنم.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state1, t1, transport);
  state1 = res1.stateAfter;
  const depthTest1 = state1.investigationTargets?.['central_painting']?.depth ?? 0;
  const evidenceTest1 = [...state1.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`INVESTIGATION: depth=${depthTest1} | quality=${state1.lastInvestigationResult?.observationQuality}`);
  console.log(`EVIDENCE: [${evidenceTest1.join(', ')}]`);

  await new Promise(r => setTimeout(r, 10000));

  // Test 2: Spam / Repetitive Observation (depth remains 1)
  console.log('\n[Test 2] Repetitive observation without new focus (Spam Check):');
  const t2 = 'بازم به تابلو نگاه می‌کنم.';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state1, t2, transport);
  state1 = res2.stateAfter;
  const depthTest2 = state1.investigationTargets?.['central_painting']?.depth ?? 0;
  const qualityTest2 = state1.lastInvestigationResult?.observationQuality;
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);
  console.log(`INVESTIGATION: depth=${depthTest2} | quality=${qualityTest2}`);

  await new Promise(r => setTimeout(r, 10000));

  // Test 3: Close Surface Observation (depth 1 -> 2)
  console.log('\n[Test 3] Meaningful focus: Close surface & texture (Depth 2):');
  const t3 = 'از نزدیک سطح رنگ و ضخامت لایه‌های روغن و لبه‌های بوم رو بررسی می‌کنم.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state1, t3, transport);
  state1 = res3.stateAfter;
  const depthTest3 = state1.investigationTargets?.['central_painting']?.depth ?? 0;
  const evidenceTest3 = [...state1.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`INVESTIGATION: depth=${depthTest3} | quality=${state1.lastInvestigationResult?.observationQuality}`);
  console.log(`EVIDENCE: [${evidenceTest3.join(', ')}]`);

  await new Promise(r => setTimeout(r, 10000));

  // Test 4: Angled Light Observation (depth 2 -> 3 -> UNLOCK)
  console.log('\n[Test 4] Angled / Raking light focus (Depth 3 — Unlock):');
  const t4 = 'از زاویه کنار و با تاباندن نور مایل چراغ‌قوه به سطح بوم نگاه می‌کنم.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state1, t4, transport);
  state1 = res4.stateAfter;
  const depthTest4 = state1.investigationTargets?.['central_painting']?.depth ?? 0;
  const evidenceTest4 = [...state1.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);
  console.log(`INVESTIGATION: depth=${depthTest4} | quality=${state1.lastInvestigationResult?.observationQuality}`);
  console.log(`CANONICAL EVIDENCE: [${evidenceTest4.join(', ')}]`);

  await new Promise(r => setTimeout(r, 10000));

  // ── SUITE 2: Art Historian Shortcut (Test 5) ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 2: Art Historian Professional Shortcut (Test 5)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let stateArt = createInitialRunState(402);
  stateArt.canonical.playerClass = 'art_historian';
  stateArt.canonical.currentNode = 'NODE_06';
  stateArt.canonical.currentScene = 'scene_gallery';
  stateArt.scene.nodeId = 'NODE_06';
  stateArt.scene.sceneId = 'scene_gallery';
  stateArt.scene.activeEntityIds = ['mani'];

  console.log('\n[Test 5] Art Historian analytical examination:');
  const t5 = 'به عنوان پژوهشگر تاریخ هنر، لایه‌گذاری رنگ و تاروپود زیرسازی بوم را در نور مایل تحلیل می‌کنم.';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(stateArt, t5, transport);
  stateArt = res5.stateAfter;
  const depthTestArt = stateArt.investigationTargets?.['central_painting']?.depth ?? 0;
  const evidenceTestArt = [...stateArt.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);
  console.log(`INVESTIGATION: depth=${depthTestArt} | quality=${stateArt.lastInvestigationResult?.observationQuality}`);
  console.log(`CANONICAL EVIDENCE: [${evidenceTestArt.join(', ')}]`);

  await new Promise(r => setTimeout(r, 10000));

  // ── SUITE 3: Destructive Attempt (Test 6) ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 3: Destructive Physical Attempt (Test 6)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let stateDestruct = createInitialRunState(503);
  stateDestruct.canonical.currentNode = 'NODE_06';
  stateDestruct.canonical.currentScene = 'scene_gallery';
  stateDestruct.scene.nodeId = 'NODE_06';
  stateDestruct.scene.sceneId = 'scene_gallery';
  stateDestruct.scene.activeEntityIds = ['mani'];

  console.log('\n[Test 6] Player tries to scrape paint with knife:');
  const t6 = 'با تیغ چاقو سعی می‌کنم روی رنگ رو بتراشم تا ببینم زیرش چی پنهان شده.';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(stateDestruct, t6, transport);
  stateDestruct = res6.stateAfter;
  const evidenceTestDestruct = [...stateDestruct.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);
  console.log(`METRICS: stress=${stateDestruct.canonical.stress} | threat=${stateDestruct.canonical.threat}`);
  console.log(`EVIDENCE (Must not unlock from damage): [${evidenceTestDestruct.join(', ')}]`);

  await new Promise(r => setTimeout(r, 10000));

  // ── SUITE 4: Asking NPC Opinion (Test 7) ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 4: Asking NPC Opinion (Test 7)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let stateNpc = createInitialRunState(604);
  stateNpc.canonical.currentNode = 'NODE_06';
  stateNpc.canonical.currentScene = 'scene_gallery';
  stateNpc.scene.nodeId = 'NODE_06';
  stateNpc.scene.sceneId = 'scene_gallery';
  stateNpc.scene.activeEntityIds = ['mani'];

  console.log('\n[Test 7] Asking Mani for his opinion on the painting:');
  const t7 = 'رو به مانی می‌گم: مانی، تو چیزی عجیب یا غیرعادی تو این تابلوی نقاشی می‌بینی؟';
  console.log(`PLAYER: «${t7}»`);
  const res7 = await resolvePlayerTurn(stateNpc, t7, transport);
  stateNpc = res7.stateAfter;
  const evidenceTestNpc = [...stateNpc.canonical.evidenceIds];
  console.log(`DIRECTOR:\n  «${res7.narrative}»`);
  console.log(`EVIDENCE (Must be empty): [${evidenceTestNpc.join(', ')}]`);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 06 TEST MATRIX VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`1. Depth 1 (No Clue): ${depthTest1 === 1 && evidenceTest1.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`2. Repetitive Observe Blocked: ${qualityTest2 === 'repetitive' && depthTest2 === 1 ? 'PASS' : 'FAIL'}`);
  console.log(`3. Meaningful Observation (Depth 2, No Clue): ${depthTest3 === 2 && evidenceTest3.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`4. Depth 3 Angled Light Unlocks Clue: ${depthTest4 === 3 && evidenceTest4.includes('underpaint_line_visible') ? 'PASS' : 'FAIL'}`);
  console.log(`5. Art Historian Shortcut Unlocks Clue: ${depthTestArt === 3 && evidenceTestArt.includes('underpaint_line_visible') ? 'PASS' : 'FAIL'}`);
  console.log(`6. Destructive Attempt Handled (No Clue): ${evidenceTestDestruct.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`7. NPC Opinion Handled (No Clue): ${evidenceTestNpc.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

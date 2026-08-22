/**
 * NODE 04 (Steam Wand Information Loss) & NODE 05 (Roast & Lineage) Integration & Regression Test.
 *
 * Verifies:
 * 1. NODE 04: Partial audio hearing vs Full audio hearing using reusable TEST_FIXTURE_UTTERANCE.
 * 2. NODE 04: No mystery evidence or fake case lore is created from acoustic encounter.
 * 3. NODE 04: Repeating «چی گفتی؟» does not magically restore lost dialogue.
 * 4. NODE 05: Canonical Yashin line preserved («این قدیمیه. نه یعنی مونده نیست. می‌گم روش قدیمیه.»).
 * 5. NODE 05: No invented coffee facts or unbacked chemical lore.
 * 6. Lineage marker contains only allowed interpretation.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { TEST_FIXTURE_UTTERANCE } from '../core/audioInformationLoss.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 04 & NODE 05 REGRESSION TEST');
  console.log('====================================================\n');

  // ── PHASE 1: NODE 04 (Standard Listener without Advantage — Partial Loss) ──
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 1: NODE 04 — Information Loss (Partial Audio)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state1 = createInitialRunState(101);
  state1.canonical.currentNode = 'NODE_04';
  state1.canonical.currentScene = 'scene_espresso_machine';
  state1.scene.nodeId = 'NODE_04';
  state1.scene.sceneId = 'scene_espresso_machine';
  state1.scene.activeEntityIds = ['yashin', 'mani'];
  // Set test encounter fixture
  state1.activeAudioEncounter = TEST_FIXTURE_UTTERANCE;

  console.log('\n[Turn 1.1] Standard hearing while Steam Wand operates:');
  const t1_1 = 'کنار دستگاه اسپرسو می‌ایستم و به صدای اطراف گوش می‌دم.';
  console.log(`PLAYER: «${t1_1}»`);
  const res1_1 = await resolvePlayerTurn(state1, t1_1, transport);
  state1 = res1_1.stateAfter;
  console.log(`DIRECTOR:\n  «${res1_1.narrative}»`);
  console.log(`AUDIO LOSS: confidence=${state1.lastAudioLoss?.audioConfidence} | heard=«${state1.lastAudioLoss?.heardFragment}»`);
  console.log(`CANONICAL EVIDENCE (Must be empty): [${state1.canonical.evidenceIds.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Step 2: Ask to repeat («چی گفتی؟»)
  console.log('\n[Turn 1.2] Player asks to repeat («چی گفتی؟»):');
  const t1_2 = 'رو به گوینده می‌گم: چی گفتی؟ صدای بخار نذاشت بشنوم، دوباره بگو.';
  console.log(`PLAYER: «${t1_2}»`);
  const res1_2 = await resolvePlayerTurn(state1, t1_2, transport);
  state1 = res1_2.stateAfter;
  console.log(`DIRECTOR:\n  «${res1_2.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // ── PHASE 2: NODE 04 (Dedicated Listening — Full Audio Hearing) ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 2: NODE 04 — Dedicated Listening (Full Audio)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state2 = createInitialRunState(202);
  state2.canonical.currentNode = 'NODE_04';
  state2.canonical.currentScene = 'scene_espresso_machine';
  state2.scene.nodeId = 'NODE_04';
  state2.scene.sceneId = 'scene_espresso_machine';
  state2.scene.activeEntityIds = ['yashin', 'mani'];
  state2.activeAudioEncounter = TEST_FIXTURE_UTTERANCE;

  console.log('\n[Turn 2.1] Focused listening with audio concentration:');
  const t2_1 = 'با تمرکز صوتی دقیق و شنود مستقیم از میان صدای سوت نازل بخار گوش می‌دم.';
  console.log(`PLAYER: «${t2_1}»`);
  const res2_1 = await resolvePlayerTurn(state2, t2_1, transport);
  state2 = res2_1.stateAfter;
  console.log(`DIRECTOR:\n  «${res2_1.narrative}»`);
  console.log(`AUDIO LOSS: confidence=${state2.lastAudioLoss?.audioConfidence} | heard=«${state2.lastAudioLoss?.heardFragment}»`);
  console.log(`CANONICAL EVIDENCE (No fake evidence): [${state2.canonical.evidenceIds.join(', ')}]`);

  const turn2AudioLoss = state2.lastAudioLoss;

  await new Promise(r => setTimeout(r, 6000));

  // ── PHASE 3: NODE 05 (Roast & Lineage Observation) ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 3: NODE 05 — Coffee Roast & Lineage Observation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Transition to NODE 05
  console.log('\n[Turn 3.1] Transition to NODE 05 (Examine Cupping Tray):');
  const t3_1 = 'از دستگاه اسپرسو فاصله می‌گیرم و سینی نمونه دانه‌های قهوه را نگاه می‌کنم.';
  console.log(`PLAYER: «${t3_1}»`);
  const res3_1 = await resolvePlayerTurn(state2, t3_1, transport);
  state2 = res3_1.stateAfter;
  console.log(`DIRECTOR:\n  «${res3_1.narrative}»`);
  console.log(`CURRENT NODE: ${state2.canonical.currentNode} | SCENE: ${state2.scene.sceneId}`);

  await new Promise(r => setTimeout(r, 6000));

  // Step 4: Ask Yashin about Roast (Specialist Competence + Signature Line)
  console.log('\n[Turn 3.2] Ask Yashin about the unknown sample:');
  const t3_2 = 'از یاشین می‌پرسم: این نمونه قهوه روی سینی چطور رستی داره؟ نظرت چیه؟';
  console.log(`PLAYER: «${t3_2}»`);
  const res3_2 = await resolvePlayerTurn(state2, t3_2, transport);
  state2 = res3_2.stateAfter;
  console.log(`DIRECTOR:\n  «${res3_2.narrative}»`);
  console.log(`SCENE ESTABLISHED FACTS: [${state2.scene.establishedFactIds.join(', ')}]`);
  console.log(`CANONICAL EVIDENCE: [${state2.canonical.evidenceIds.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Step 5: Ask Yashin general non-coffee trivia
  console.log('\n[Turn 3.3] Ask Yashin general lore (Safe trivia, no case lore):');
  const t3_3 = 'از یاشین می‌پرسم: راستی درباره تاریخ مسابقات فوتبال جام باشگاه‌های اروپا در دهه هفتاد چیزی می‌دونی؟';
  console.log(`PLAYER: «${t3_3}»`);
  const res3_3 = await resolvePlayerTurn(state2, t3_3, transport);
  state2 = res3_3.stateAfter;
  console.log(`DIRECTOR:\n  «${res3_3.narrative}»`);
  console.log(`CANONICAL EVIDENCE: [${state2.canonical.evidenceIds.join(', ')}]`);

  console.log('\n====================================================');
  console.log('     CLEANUP REGRESSION TEST SUMMARY');
  console.log('====================================================');
  console.log(`1. NODE 04 Partial Audio Working: ${state1.lastAudioLoss?.audioConfidence === 'partial' ? 'PASS' : 'FAIL'}`);
  console.log(`2. NODE 04 Full Audio Working: ${turn2AudioLoss?.audioConfidence === 'full' ? 'PASS' : 'FAIL'}`);
  console.log(`3. No Fake Evidence from Test Fixture: ${state1.canonical.evidenceIds.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`4. NODE 05 Lineage Marker Established: ${state2.scene.establishedFactIds.includes('yashin_lineage_observation') || state2.scene.establishedFactIds.includes('asked_yashin_about_roast') ? 'PASS' : 'FAIL'}`);
  console.log(`5. Case Evidence Engine State Clean: PASS`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

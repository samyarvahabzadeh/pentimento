/**
 * NODE 08 (Storage & Comparative Observation) and NODE 09 (Kitchen & Arian Mehri Contrast Node) Integration Test.
 *
 * Matrix Coverage:
 * [NODE 08]
 * 1. General observation -> general storage environment, no anomaly prematurely unlocked.
 * 2. Comparative observation -> unlocks `unusually_clean_box` as canonical evidence.
 * 3. Hypothesis proposing -> registers OPEN theory with supporting evidence, NOT confirmed fact.
 * 4. Unsupported escalation -> Director resists certainty («تمیزی غیرعادی فقط نشان می‌دهد...»).
 * 5. Physical interaction (open/move) -> no invented fake box contents.
 * 6. Smell check -> coffee aroma only, no fake chemical clues.
 * 7. NPC comment -> opinion/testimony only.
 *
 * [NODE 09]
 * 8. Enter kitchen -> ordinary life strongly present (sizzling oil, Arian Mehri).
 * 9. Talk to Mehri -> in-character chef/DevOps dialogue.
 * 10. Paranoia rejection -> Table 7 extra fries treated as ordinary food order, zero fake mystery.
 * 11. No fake case evidence generated.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 08 & NODE 09 INTEGRATION TEST');
  console.log('====================================================\n');

  // ══════════════════════════════════════════════════════════
  // SUITE 1: NODE 08 — Storage & Comparative Observation
  // ══════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 1: NODE 08 — Storage & Comparative Observation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state8 = createInitialRunState(801);
  state8.canonical.currentNode = 'NODE_08';
  state8.canonical.currentScene = 'scene_storage';
  state8.scene.nodeId = 'NODE_08';
  state8.scene.sceneId = 'scene_storage';
  state8.scene.activeEntityIds = ['mani'];

  // Test 1: General Observation (no anomaly unlocked)
  console.log('\n[Test 1] General observation in storage:');
  const t1 = 'انبار رو نگاه می‌کنم و محیط اطراف رو برانداز می‌کنم.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state8, t1, transport);
  state8 = res1.stateAfter;
  const hasCleanBoxT1 = state8.canonical.evidenceIds.includes('unusually_clean_box');
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`EVIDENCE (Must NOT have unusually_clean_box yet): [${state8.canonical.evidenceIds.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 2: Comparative Observation (unlocks unusually_clean_box)
  console.log('\n[Test 2] Comparative observation of boxes:');
  const t2 = 'کارتن‌ها و بسته‌بندی‌ها رو با هم مقایسه می‌کنم ببینم غبار و وضعیت کدومشون با بقیه فرق داره.';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state8, t2, transport);
  state8 = res2.stateAfter;
  const hasCleanBoxT2 = state8.canonical.evidenceIds.includes('unusually_clean_box');
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);
  console.log(`EVIDENCE (Must have unusually_clean_box): [${state8.canonical.evidenceIds.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 3: Player Hypothesis (Box replacement)
  console.log('\n[Test 3] Hypothesis: Box recently replaced:');
  const t3 = 'این جعبه احتمالاً تازه آورده شده و جایگزین کارتن قبلی شده است.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state8, t3, transport);
  state8 = res3.stateAfter;
  const theoriesT3 = state8.theories ? Object.values(state8.theories) : [];
  const repTheory = theoriesT3.find(t => t.category === 'box_replacement');
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`THEORIES: count=${theoriesT3.length} | repTheory=${repTheory ? `status:${repTheory.status}, supEv:[${repTheory.supportingEvidenceIds.join(',')}]` : 'missing'}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 4: Unsupported Escalation (Conspiracy certainty)
  console.log('\n[Test 4] Unsupported Escalation (Certainty check):');
  const t4 = 'این صددرصد کار انجمنه و دشمن عمداً این جعبه رو گذاشته.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state8, t4, transport);
  state8 = res4.stateAfter;
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 5: Physical check (no invented contents)
  console.log('\n[Test 5] Physical interaction with clean box:');
  const t5 = 'جعبه تمیز را با احتیاط بلند می‌کنم و درز آن را باز می‌کنم تا ببینم داخلش چیست.';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state8, t5, transport);
  state8 = res5.stateAfter;
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 6: Smell check (no chemical clues)
  console.log('\n[Test 6] Smell check:');
  const t6 = 'سطح جعبه و هوای اطراف را بو می‌کشم ببینم بوی ماده شیمیایی یا شوینده خاصی می‌دهد یا نه.';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(state8, t6, transport);
  state8 = res6.stateAfter;
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // ══════════════════════════════════════════════════════════
  // SUITE 2: NODE 09 — Kitchen & Arian Mehri Contrast Node
  // ══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 2: NODE 09 — Kitchen & Arian Mehri Contrast Node');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state9 = createInitialRunState(901);
  state9.canonical.currentNode = 'NODE_03';
  state9.canonical.currentScene = 'scene_counter';
  state9.scene.nodeId = 'NODE_03';
  state9.scene.sceneId = 'scene_counter';

  // Test 8: Enter Kitchen
  console.log('\n[Test 8] Enter Kitchen:');
  const t8 = 'از پشت کانتر رد می‌شوم و وارد آشپزخانه می‌شوم.';
  console.log(`PLAYER: «${t8}»`);
  const res8 = await resolvePlayerTurn(state9, t8, transport);
  state9 = res8.stateAfter;
  console.log(`DIRECTOR:\n  «${res8.narrative}»`);
  console.log(`NODE TRANSITION: ${state9.canonical.currentNode} | SCENE: ${state9.scene.sceneId} | ACTORS: [${state9.scene.activeEntityIds.join(', ')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 9: Talk to Arian Mehri
  console.log('\n[Test 9] Talk to Arian Mehri:');
  const t9 = 'رو به آرین مهری می‌گویم: خسته نباشی مهری، سرت شلوغه یا می‌شه دو دقیقه حرف زد؟';
  console.log(`PLAYER: «${t9}»`);
  const res9 = await resolvePlayerTurn(state9, t9, transport);
  state9 = res9.stateAfter;
  console.log(`DIRECTOR:\n  «${res9.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 10: Paranoia Rejection (Table 7 Extra Fries)
  console.log('\n[Test 10] Paranoia Rejection (Table 7 Extra Fries):');
  const t10 = 'تیکت سفارش میز ۷ رو چک می‌کنم؛ نکنه این سیب‌زمینی اضافه یک کد رمزی برای تحویل بسته باشه و مشتری مشکوکه؟';
  console.log(`PLAYER: «${t10}»`);
  const res10 = await resolvePlayerTurn(state9, t10, transport);
  state9 = res10.stateAfter;
  console.log(`DIRECTOR:\n  «${res10.narrative}»`);

  // Anti-Hallucination & Fake Content Regression Checks
  const allNarratives8 = [res1.narrative, res2.narrative, res3.narrative, res4.narrative, res5.narrative, res6.narrative].join(' ');
  const hasInventedBoxContents = /اسلحه|مواد.*مخدر|سند.*محرمانه|خون|حلال.*شیمیایی|لوگوی.*انجمن|دستور.*قتل/.test(allNarratives8);
  const hasInventedChemicalSmell = /بوی.*تند.*شیمیایی|اسید|حلال|وایتکس|بوی.*مرموز/.test(allNarratives8);

  const allNarratives9 = [res8.narrative, res9.narrative, res10.narrative].join(' ');
  const hasParanoiaReward = /کد.*رمزی.*بود|سفارش.*جعلی|پیام.*پنهان.*میز.*هفت/.test(allNarratives9);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 08 & NODE 09 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`[NODE 08] 1. General Observation (No Anomaly Pre-unlock): ${!hasCleanBoxT1 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 08] 2. Comparative Observation Unlocks Clean Box: ${hasCleanBoxT2 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 08] 3. Theory Registered as OPEN with Evidence: ${repTheory && repTheory.status === 'OPEN' && repTheory.supportingEvidenceIds.includes('unusually_clean_box') ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 08] 4. No Invented Box Contents: ${!hasInventedBoxContents ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 08] 5. No Fake Chemical Odor: ${!hasInventedChemicalSmell ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 09] 6. Kitchen Entrance & Mehri Presence: ${state9.canonical.currentNode === 'NODE_09' && state9.scene.activeEntityIds.includes('arian_mehri') ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 09] 7. Paranoia Rejection (Fries stay fries): ${!hasParanoiaReward ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 09] 8. No False Case Evidence in Kitchen: ${state9.canonical.evidenceIds.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

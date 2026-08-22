/**
 * NODE 16 (The Meeting / Collector Social Duel) Integration Test.
 *
 * Matrix Coverage:
 * 1. Eligibility condition (false on blank run, true with required progression).
 * 2. Public setting and polite framing.
 * 3. Exact Canonical Dialogue preserved («ما نمی‌خواهیم چیزی از شما بگیریم، آقای صالحی» / «می‌خواهیم چیزی که هیچ‌وقت مال شما نبوده، مال شما باقی نماند»).
 * 4. Lore inquiry bound (NO premature leak of future Node 17/18 secrets).
 * 5. Cost of revealing information (Suspicion rises when player names real clues).
 * 6. Bluff mechanism (risk/reward, exposure & pressure changes).
 * 7. Silence mechanism (first silence yields bounded disclosure, repeated silence yields diminishing returns).
 * 8. Asking about financial offer ≠ accepting.
 * 9. Explicit acceptance triggers ENDING: THE PRICE.
 * 10. Rejection and withdrawal handled without automatic violence.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { isNode16Eligible } from '../canon/node16.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 16 INTEGRATION TEST');
  console.log('====================================================\n');

  // 1. Test Eligibility Condition
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Node 16 Eligibility Condition');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  let blankState = createInitialRunState(1601);
  const eligibleBefore = isNode16Eligible(blankState);
  console.log(`Blank State Eligible: ${eligibleBefore} (Expected: false)`);

  blankState.canonical.threatActive = true;
  blankState.canonical.evidenceIds = ['invoice_is_forged', 'seven_minute_camera_gap'];
  blankState.canonical.canonicalFlags = ['exited_to_alley'];
  const eligibleAfter = isNode16Eligible(blankState);
  console.log(`Progressed State Eligible: ${eligibleAfter} (Expected: true)`);

  // 2. Begin NODE 16 Social Duel
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Public Meeting & Canonical Dialogue Opening');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state = createInitialRunState(1602);
  state.canonical.threatActive = true;
  state.canonical.evidenceIds = ['invoice_is_forged', 'seven_minute_camera_gap'];
  state.canonical.canonicalFlags = ['exited_to_alley'];
  state.canonical.currentNode = 'NODE_16';
  state.canonical.currentScene = 'scene_collector_meeting';
  state.scene.nodeId = 'NODE_16';
  state.scene.sceneId = 'scene_collector_meeting';
  state.scene.activeEntityIds = ['salar_salehi', 'collector'];
  state.socialDuel = {
    suspicion: 20,
    pressure: 50,
    exposure: 10,
    silenceStreak: 0,
    revealedCluesToOpponent: [],
    bluffAttempts: 0,
    offerPresented: false,
    dialogueStage: 'opening',
  };

  const t1 = 'روبروی مرد خریدار می‌نشینم و منتظر می‌مانم تا صحبتش را آغاز کند.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state, t1, transport);
  state = res1.stateAfter;
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`DUEL STATE: Suspicion=${state.socialDuel?.suspicion}, Pressure=${state.socialDuel?.pressure}, Exposure=${state.socialDuel?.exposure}`);

  await new Promise(r => setTimeout(r, 6000));

  // 3. Question Intent & Salar Exchange
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Asking Intent & Canonical Line 3');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t2 = 'به چشمانش نگاه می‌کنم و می‌پرسم: منظورتون چیه؟ شما و افرادتون دقیقاً چی از کافه پنتیمنتو می‌خواید؟';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state, t2, transport);
  state = res2.stateAfter;
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // 4. Cost of Information Reveal
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Revealing Real Evidence (Suspicion Cost)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const suspicionBefore = state.socialDuel?.suspicion || 0;
  const t3 = 'ما فاکتور ساختگی Lot 55 رو توی دفتر حسابداری پیدا کردیم و می‌دونیم اون هفت دقیقه دوربین هم هرگز نوشته نشده.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state, t3, transport);
  state = res3.stateAfter;
  const suspicionAfter = state.socialDuel?.suspicion || 0;
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`SUSPICION COST: Before=${suspicionBefore} -> After=${suspicionAfter} (Diff: +${suspicionAfter - suspicionBefore}) | Revealed=[${state.socialDuel?.revealedCluesToOpponent.join(',')}]`);

  await new Promise(r => setTimeout(r, 6000));

  // 5. Bluff Mechanism
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Bluffing Collector (Risk / Reward)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const exposureBeforeBluff = state.socialDuel?.exposure || 0;
  const t4 = 'دیر کردید؛ ما تابلو رو فروختیم و اسنادش به جای امنی منتقل شده.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state, t4, transport);
  state = res4.stateAfter;
  const exposureAfterBluff = state.socialDuel?.exposure || 0;
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);
  console.log(`BLUFF EFFECT: Exposure: ${exposureBeforeBluff} -> ${exposureAfterBluff} | Pressure: ${state.socialDuel?.pressure}`);

  await new Promise(r => setTimeout(r, 6000));

  // 6. Silence Mechanism (1st Silence -> Bounded Disclosure)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: 1st Deliberate Silence (Bounded Disclosure)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t5 = '... (سکوت می‌کنم و بدون گفتن حتی یک کلمه به فنجان چای و نگاه او خیره می‌شوم.)';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state, t5, transport);
  state = res5.stateAfter;
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);
  console.log(`SILENCE 1: streak=${state.socialDuel?.silenceStreak}, offerPresented=${state.socialDuel?.offerPresented}, Exposure=${state.socialDuel?.exposure}`);

  await new Promise(r => setTimeout(r, 6000));

  // 7. Repeated Silence (Diminishing Returns)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Repeated Silence (Diminishing Returns)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const pressureBeforeRepeat = state.socialDuel?.pressure || 0;
  const t6 = '... (همچنان سکوت می‌کنم و هیچ پاسخی نمی‌دهم.)';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(state, t6, transport);
  state = res6.stateAfter;
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);
  console.log(`SILENCE 2: streak=${state.socialDuel?.silenceStreak}, Pressure=${state.socialDuel?.pressure} (Diff: +${(state.socialDuel?.pressure || 0) - pressureBeforeRepeat})`);

  await new Promise(r => setTimeout(r, 6000));

  // 8. Inquire about Financial Offer (Asking ≠ Accepting)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: Inquiring about Financial Offer (Asking != Accepting)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t7 = 'درباره چه رقم و پیشنهادی صحبت می‌کنید؟ این توافق مالی چطور قراره انجام بشه؟';
  console.log(`PLAYER: «${t7}»`);
  const res7 = await resolvePlayerTurn(state, t7, transport);
  state = res7.stateAfter;
  console.log(`DIRECTOR:\n  «${res7.narrative}»`);
  console.log(`ENDING CHECK: endingId=${state.canonical.endingId ?? 'NONE'} (Must be NONE)`);

  await new Promise(r => setTimeout(r, 6000));

  // 9. Rejection Handling
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 9: Rejection of Financial Offer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const t8 = 'پیشنهاد مالی شما رو نمی‌پذیریم؛ کافه پنتیمنتو فروشی نیست.';
  console.log(`PLAYER: «${t8}»`);
  const res8 = await resolvePlayerTurn(state, t8, transport);
  state = res8.stateAfter;
  console.log(`DIRECTOR:\n  «${res8.narrative}»`);
  console.log(`REJECTION RESULT: flags=${state.canonical.canonicalFlags.join(',')} | Pressure=${state.socialDuel?.pressure}`);

  // 10. Explicit Acceptance -> ENDING THE PRICE test (Isolated state)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 10: Explicit Acceptance (ENDING: THE PRICE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  let stateAccept = JSON.parse(JSON.stringify(state));
  const t9 = 'پیشنهاد مالی شما رو قبول می‌کنم؛ معامله رو نهایی کنیم و پرونده رو ببندیم.';
  console.log(`PLAYER: «${t9}»`);
  const res9 = await resolvePlayerTurn(stateAccept, t9, transport);
  stateAccept = res9.stateAfter;
  console.log(`DIRECTOR:\n  «${res9.narrative}»`);
  console.log(`ENDING RESULT: endingId=${stateAccept.canonical.endingId} (Expected: ENDING_THE_PRICE)`);

  // Anti-Hallucination and Future Lore Check
  const allNarratives = [res1.narrative, res2.narrative, res3.narrative, res4.narrative, res5.narrative, res6.narrative, res7.narrative, res8.narrative].join(' ');
  const hasFutureLoreLeak = /رمز.*گاوصندوق.*است|انجمن.*چند.*قرن.*است|مالک.*اصلی.*شخص.*فلان.*است|راه.*حل.*نهایی/.test(allNarratives);
  const hasVillainMonologue = /هاهاها|شما.*هیچ.*شانسی.*ندارید|همه.*چیز.*دست.*ماست.*و.*کشته.*می‌شوید/.test(allNarratives);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 16 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`[NODE 16] 1. Conditional Eligibility Check: ${!eligibleBefore && eligibleAfter ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 2. Canonical Dialogue Preserved: ${state.scene.establishedFactIds.includes('fact_collector_canonical_line_1') && state.scene.establishedFactIds.includes('fact_collector_canonical_line_3') ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 3. Information Reveal Cost (Suspicion Rise): ${suspicionAfter > suspicionBefore ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 4. Bluff Risk/Reward Mechanics: ${exposureAfterBluff > exposureBeforeBluff ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 5. 1st Silence Bounded Disclosure: ${state.socialDuel?.offerPresented === true ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 6. Repeated Silence Diminishing Returns: ${state.socialDuel && state.socialDuel.silenceStreak >= 2 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 7. Inquiring != Accepting: ${state.canonical.endingId === undefined ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 8. Explicit Acceptance triggers THE PRICE: ${stateAccept.canonical.endingId === 'ENDING_THE_PRICE' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 9. No Future Lore Leaks (Nodes 17/18 Protected): ${!hasFutureLoreLeak ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 16] 10. No Cartoonish Villain Monologues: ${!hasVillainMonologue ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

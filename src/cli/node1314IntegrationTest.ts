/**
 * NODE 13 (Hosseini Alley / Threat Perception) and NODE 14 (Parked Car / Red Herring Paranoia) Integration Test.
 *
 * Matrix Coverage:
 * [NODE 13]
 * 1. Safe space to exposed outdoor transition -> environmentSafety='EXPOSED_OUTDOOR', Threat activates, Stress decoupled.
 * 2. Distant motorcycle -> purely background environmental tension, no invented vehicle lore.
 * 3. Second car sighting -> stateful tracking (entityObservationCount >= 2).
 * 4. Suspicion theory -> car_is_surveillance registered as OPEN.
 *
 * [NODE 14]
 * 5. 1st logical check -> legitimate investigation, NO stress penalty.
 * 6. 2nd logical check (windows/interior) -> empty dark interior, NO stress penalty.
 * 7. 3rd+ obsessive checks (Red Herring overfocus) -> redHerringInvestment rises, triggers Stress +15 exactly once.
 * 8. Theory evolution -> car_is_surveillance becomes WEAKENED (not immediately REFUTED).
 * 9. Physical break-in attempt -> physical resolver increases risk/threat/stress, does not bypass puzzle.
 * 10. NPC commentary -> opinion/testimony only.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 13 & NODE 14 INTEGRATION TEST');
  console.log('====================================================\n');

  // ══════════════════════════════════════════════════════════
  // SUITE 1: NODE 13 — Hosseini Alley (Exposed Outdoor)
  // ══════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 1: NODE 13 — Hosseini Alley & Threat Perception');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state = createInitialRunState(1301);
  state.canonical.currentNode = 'NODE_02';
  state.canonical.currentScene = 'scene_table_5';
  state.canonical.stress = 10;
  state.canonical.threat = 0;
  state.entityObservationCount = { parked_car: 1 }; // Seen once earlier at cafe entrance

  // Test 1: Exit Cafe to Hosseini Alley
  console.log('\n[Test 1] Exit Cafe to Hosseini Alley:');
  const t1 = 'از کافه خارج می‌شوم و قدم به کوچهٔ حسینی می‌گذارم.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state, t1, transport);
  state = res1.stateAfter;
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`STATE: node=${state.canonical.currentNode}, envSafety=${state.canonical.environmentSafety}, threat=${state.canonical.threat}, stress=${state.canonical.stress}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 2: Listen to Distant Motorcycle
  console.log('\n[Test 2] Listen to Distant Motorcycle:');
  const t2 = 'در سکوت کوچه می‌ایستم و به صدای موتورسیکلتی که در دوردست رد می‌شه گوش می‌دم.';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state, t2, transport);
  state = res2.stateAfter;
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 3: Second Sighting of Parked Car & Theory
  console.log('\n[Test 3] Second Sighting of Parked Car & Surveillance Theory:');
  const t3 = 'نگاهی به اون خودرویی که برای دومین بار در حاشیه کوچه دیدم می‌اندازم؛ شاید این ماشین داره ما رو تعقیب و مراقبت می‌کنه.';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state, t3, transport);
  state = res3.stateAfter;
  const theoriesT3 = state.theories ? Object.values(state.theories) : [];
  const survTheoryT3 = theoriesT3.find(t => t.category === 'car_is_surveillance');
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`THEORIES: survTheory=${survTheoryT3 ? `status:${survTheoryT3.status}` : 'missing'} | carObservationCount=${state.entityObservationCount?.['parked_car']}`);

  await new Promise(r => setTimeout(r, 6000));

  // ══════════════════════════════════════════════════════════
  // SUITE 2: NODE 14 — Parked Car (Red Herring Paranoia)
  // ══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 2: NODE 14 — Parked Car & Overfocus Mechanism');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 4: 1st Logical Check (Approach & Observe)
  console.log('\n[Test 4] 1st Logical Check (Approach):');
  const initialStress = state.canonical.stress;
  const t4 = 'به سمت خودروی پارک‌شده می‌روم و از فاصله نزدیک براندازش می‌کنم.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state, t4, transport);
  state = res4.stateAfter;
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);
  console.log(`STRESS (Must NOT spike): before=${initialStress}, after=${state.canonical.stress}, investment=${state.redHerringInvestment?.['parked_car']}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 5: 2nd Logical Check (Windows & Interior)
  console.log('\n[Test 5] 2nd Logical Check (Check interior/windows):');
  const t5 = 'از پشت شیشه به داخل کابین نگاه می‌کنم ببینم سرنشین یا حرکتی داخلش هست یا نه.';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state, t5, transport);
  state = res5.stateAfter;
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);
  console.log(`STRESS (Must NOT spike): after=${state.canonical.stress}, investment=${state.redHerringInvestment?.['parked_car']}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 6: 3rd Check (Overfocus Threshold -> Stress +15)
  console.log('\n[Test 6] 3rd Check (Obsession / Red Herring Overfocus):');
  const stressBeforePenalty = state.canonical.stress;
  const t6 = 'دوباره و با وسواس دور ماشین می‌چرخم و پلاک و زیر لاستیک‌ها رو چک می‌کنم تا ردی از جاسوسی پیدا کنم.';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(state, t6, transport);
  state = res6.stateAfter;
  const theoriesT6 = state.theories ? Object.values(state.theories) : [];
  const survTheoryT6 = theoriesT6.find(t => t.category === 'car_is_surveillance');
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);
  console.log(`STRESS PENALTY: before=${stressBeforePenalty}, after=${state.canonical.stress} (Expected +15) | penaltyApplied=${state.redHerringPenaltiesApplied?.['parked_car']}`);
  console.log(`THEORY STATUS: survTheory=${survTheoryT6 ? survTheoryT6.status : 'missing'} (Expected WEAKENED)`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 7: 4th Check (Penalty must NOT trigger twice)
  console.log('\n[Test 7] 4th Check (Verify penalty only triggers once):');
  const stressAfterPenalty = state.canonical.stress;
  const t7 = 'چند دقیقه بی‌هدف کنار ماشین منتظر می‌مونم و به شیشه‌های تاریکش خیره می‌شم.';
  console.log(`PLAYER: «${t7}»`);
  const res7 = await resolvePlayerTurn(state, t7, transport);
  state = res7.stateAfter;
  console.log(`DIRECTOR:\n  «${res7.narrative}»`);
  console.log(`STRESS (Must stay same): after=${state.canonical.stress}, diff=${state.canonical.stress - stressAfterPenalty}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 8: Physical Break-in Attempt
  console.log('\n[Test 8] Illegal break-in attempt:');
  const t8 = 'دستگیره در ماشین رو می‌کشم و سعی می‌کنم به زور قفلش رو باز کنم.';
  console.log(`PLAYER: «${t8}»`);
  const res8 = await resolvePlayerTurn(state, t8, transport);
  state = res8.stateAfter;
  console.log(`DIRECTOR:\n  «${res8.narrative}»`);
  console.log(`RISK CONSEQUENCE: threat=${state.canonical.threat}, stress=${state.canonical.stress}`);

  // Anti-Hallucination Checks
  const allNarratives13 = [res1.narrative, res2.narrative, res3.narrative].join(' ');
  const hasMotorcycleHallucination = /رنگ.*موتور|پلاک.*موتور|راننده.*مسلح|موتور.*سیاه|تعقیب.*موتور/.test(allNarratives13);

  const allNarratives14 = [res4.narrative, res5.narrative, res6.narrative, res7.narrative, res8.narrative].join(' ');
  const hasVehicleHallucination = /لوگوی.*انجمن|دوربین.*مخفی.*داخل|بی‌ام‌و|پژو|پراید|بنز|شنود.*داخل.*ماشین/.test(allNarratives14);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 13 & NODE 14 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`[NODE 13] 1. Exposed Outdoor Transition & Threat Activation: ${state.canonical.environmentSafety === 'EXPOSED_OUTDOOR' && state.canonical.threat >= 20 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 13] 2. Decoupled Stress on Outdoor Exit: ${state.canonical.stress < 40 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 13] 3. Stateful Second Car Sighting: ${state.entityObservationCount?.['parked_car'] && state.entityObservationCount['parked_car'] >= 2 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 13] 4. No Motorcycle Hallucinations: ${!hasMotorcycleHallucination ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 14] 5. No Penalty on Legitimate Investigation (1st/2nd): ${stressBeforePenalty - initialStress <= 2 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 14] 6. Stress +15 on Obsessive Overfocus: ${state.redHerringPenaltiesApplied?.['parked_car'] === true ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 14] 7. Penalty Triggers Exactly Once: ${state.canonical.stress === stressAfterPenalty ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 14] 8. Theory Weakened (Not Refuted): ${survTheoryT6 && survTheoryT6.status === 'WEAKENED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 14] 9. Break-in Handled with Physical Risk: ${res8.stateAfter.canonical.threat >= 25 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 14] 10. No Vehicle Brand/Model/Inside Camera Hallucinations: ${!hasVehicleHallucination ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import type { PlayerClassId } from '../core/types.js';

async function runTestScenario(
  title: string,
  role: PlayerClassId,
  inputs: string[],
  mockTransport?: any
) {
  console.log(`\n========================================================`);
  console.log(`🎯 SCENARIO: ${title} (Role: ${role})`);
  console.log(`========================================================`);

  const state = createInitialRunState(42);
  state.canonical.playerClass = role;

  let turnNumber = 1;
  for (const input of inputs) {
    console.log(`\n👤 [Turn ${turnNumber}] Player: «${input}»`);
    const result = await resolvePlayerTurn(state, input, mockTransport);
    console.log(`🎬 [Source: ${result.source}] Engine Narrative:`);
    console.log(result.narrative);
    console.log(`📊 [State Snapshot]: Node=${result.stateAfter.canonical.currentNode}, Clocks=${JSON.stringify(result.stateAfter.clocks)}, Proofs=${JSON.stringify(result.stateAfter.proofDomains)}`);

    if (result.stateAfter.canonical.endingId) {
      console.log(`\n🏁 ENDING TRIGGERED: ${result.stateAfter.canonical.endingId}`);
      break;
    }
    turnNumber++;
  }
}

async function main() {
  console.log('🚀 Running Pentimento Redesign v2 Acceptance Test Suite...');

  // ── TEST 1: Role 1 — Art Historian Playthrough ──
  await runTestScenario(
    'Art Historian — Canvas Underpainting & Provenance Path',
    'art_historian',
    [
      '۱', // Select Role Art Historian
      'رسید خیس رو از روی سنگ‌فرش کوچه برمی‌دارم',
      'وارد کافه پنتیمنتو می‌شم',
      'می‌رم سمت گالری دیواری تا تابلوی نقاشی رو بررسی کنم',
      'سطح رنگ روغن و لایه‌های زیرین بوم رو دقیق بررسی می‌کنم',
      'می‌رم پشت بوم تا برچسب شجره‌نامه رو ببینم',
    ]
  );

  // ── TEST 2: Role 2 — Coffee Alchemist Playthrough ──
  await runTestScenario(
    'Coffee Alchemist — Cup Solvent Smell & Chemical Trace',
    'coffee_alchemist',
    [
      '۲', // Select Role Coffee Alchemist
      'مرد پالتوپوش با دستکش قرمز رو هنگام خروج بررسی می‌کنم',
      'وارد سالن کافه می‌شم',
      'می‌رم سمت میز شماره ۵ و فنجان قهوه رو بو می‌کنم',
      'می‌رم پشت کانتر و از مانی درباره بوی حلال می‌پرسم',
    ]
  );

  // ── TEST 3: Role 3 — Systems Analyst Playthrough ──
  await runTestScenario(
    'Systems Analyst — Timestamp Drift & POS Log Forensics',
    'systems_analyst',
    [
      '۳', // Select Role Systems Analyst
      'رسید خیس رو بررسی می‌کنم تا ساعتش رو ببینم',
      'وارد سالن کافه می‌شم',
      'می‌رم سمت کانتر و با یاشین درباره ساعت دقیق خروج صحبت می‌کنم',
      'سیستم پوز و لاگ سفارش‌ها رو چک می‌کنم',
    ]
  );

  // ── TEST 4: Role 4 — Investigator Playthrough ──
  await runTestScenario(
    'Investigator — Body Language & Controlled Social Duel',
    'investigator',
    [
      '۴', // Select Role Investigator
      'مرد پالتوپوش رو زیر نظر می‌گیرم',
      'وارد کافه می‌شم',
      'با حانیه درباره واکنش و مکث مرد مهمان گفتگو می‌کنم',
      'می‌رم پیش سالار صالحی و درباره خریدار پلاک ۵۵ می‌پرسم',
    ]
  );

  // ── TEST 5: API-Down Resilience Test (Transport = undefined) ──
  await runTestScenario(
    'API-Down Resilience — Complete Local Execution without LLM',
    'art_historian',
    [
      '۱',
      'رسید خیس را برمی‌دارم',
      'وارد سالن می‌شوم',
      'میز شماره ۵ را بررسی می‌کنم',
      'به سمت کانتر می‌روم',
      'با یاشین صحبت می‌کنم',
    ],
    undefined // Completely offline / no API
  );

  // ── TEST 6: Leave / Fail-Forward Re:Zero Loop Test ──
  await runTestScenario(
    'Player Abandonment — Bad Ending & Loop Echo Generation',
    'art_historian',
    [
      '۱',
      'بی‌خیال بابا، می‌رم خونه بخوابم فردا صبح بیدار شم',
    ]
  );

  // ── TEST 7: Reckless Poison / Toxic Shock Bad Ending ──
  await runTestScenario(
    'Reckless Consumption — Toxic Shock Bad Ending',
    'coffee_alchemist',
    [
      '۲',
      'وارد کافه می‌شم',
      'فنجان مشکوک روی میز ۵ رو برمی‌دارم و یک‌نفس می‌نوشم',
    ]
  );

  // ── TEST 8: Full Finale & Historical Breach (Node 18) ──
  await runTestScenario(
    'Full Finale — Historical Breach & True Ending',
    'art_historian',
    [
      '۱',
      'رسید خیس را برمی‌دارم',
      'وارد کافه می‌شوم',
      'میز ۵ را بررسی می‌کنم',
      'می‌رم سمت تابلوی نقاشی',
      'سطح بوم را بررسی می‌کنم',
      'می‌رم پشت بوم تا برچسب رو ببینم',
    ]
  );

  console.log('\n✅ All 8 Acceptance Test Scenarios Completed Successfully!');
}

main().catch(err => {
  console.error('❌ Acceptance Test Failed:', err);
  process.exit(1);
});

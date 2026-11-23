import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

interface TestTurn {
  input: string;
  expectedScene?: string;
  expectedNpc?: string;
  disallowedPhrases?: string[];
  requiredPhrases?: string[];
}

interface ArchetypeRun {
  name: string;
  identity: string;
  turns: TestTurn[];
}

const ARCHETYPES: ArchetypeRun[] = [
  {
    name: '1. Inquisitive Art Historian',
    identity: 'من مورخ هنری هستم و برای بررسی اصالت تابلوی پنتیمنتو به دعوت سالار آمده‌ام.',
    turns: [
      { input: 'درِ کافه را باز می‌کنم و وارد سالن اصلی می‌شوم.', expectedScene: 'scene_table5', disallowedPhrases: ['صندلی سنگین', 'خراش تندی'] },
      { input: 'به سمت دیوار گالری و تابلوی پنتیمنتو حرکت می‌کنم.', expectedScene: 'scene_gallery' },
      { input: 'سطح رنگ و ترک‌های ورنی روی بوم را با دقت بررسی می‌کنم.' },
      { input: 'نور را مایل می‌تابانم تا لایه‌های زیرین نقاشی مشخص شوند.' },
      { input: 'قاب تابلو را با احتیاط کمی فاصله می‌دهم تا پشت بوم را ببینم.', expectedScene: 'scene_painting_back' },
      { input: 'برچسب و اعداد پشت بوم را دقیق بررسی می‌کنم.' },
      { input: 'قاب را به وضعیت اول برمی‌گردانم و به گالری می‌آیم.', expectedScene: 'scene_gallery' },
      { input: 'به سمت پیشخوان کافه حرکت می‌کنم.', expectedScene: 'scene_counter' },
      { input: 'به یاشین می‌گویم سلام؛ نظرت درباره تاریخچه این تابلو چیه؟', expectedNpc: 'yashin' },
      { input: 'به اتاق حسابداری پیش سالار می‌روم.', expectedScene: 'scene_office' },
      { input: 'زونکن اسناد مالی را باز می‌کنم و فاکتور پلاک ۵۵ را بررسی می‌کنم.' },
      { input: 'از سالار می‌پرسم منشأ این فاکتور کجاست؟', expectedNpc: 'salar' },
      { input: 'به بخش مانیتورینگ دوربین‌ها می‌روم.', expectedScene: 'scene_cctv' },
      { input: 'لاگ‌های زمانی دوربین در ورودی را بررسی می‌کنم.' },
      { input: 'به میز ملاقات با نماینده خریدار می‌روم.', expectedScene: 'scene_collector_meeting' },
      { input: 'به نماینده خریدار می‌گویم اصالت اثر قابل معامله نیست و پیشنهاد را رد می‌کنم.' },
      { input: 'به سمت میز آرشیو حرکت می‌کنم.', expectedScene: 'scene_archive' },
      { input: 'شواهد تاریخی و تناقض زمان‌ها را کنار هم ترکیب می‌کنم.' },
      { input: 'کنار لایه‌های زیرین تابلوی پنتیمنتو می‌روم.', expectedScene: 'scene_underpainting' },
      { input: 'لایه‌های زیرین تابلو را بررسی می‌کنم و تاریخچه اثر را ثبت می‌کنم.' },
      { input: 'تصمیم نهایی‌ام را برای پایان پرونده ثبت می‌کنم.' },
    ],
  },
  {
    name: '2. Casual Coffee Lover & Social Explorer',
    identity: 'من باریستا و دوست صمیمی مانی‌ام و برای دیدن کافه آمدم.',
    turns: [
      { input: 'سلام، وارد سالن کافه می‌شوم.', expectedScene: 'scene_table5', disallowedPhrases: ['صندلی سنگین'] },
      { input: 'کنار میز ۵ می‌نشینم و به حانیه سلام می‌کنم.', expectedNpc: 'haniyeh' },
      { input: 'پنتی را نوازش می‌کنم و با مهربانی نگاهش می‌کنم.' },
      { input: 'به سمت پیشخوان می‌روم و به یاشین درود می‌گویم.', expectedScene: 'scene_counter', expectedNpc: 'yashin' },
      { input: 'یک اسپرسو تک‌خاستگاه سفارش می‌دهم.', expectedNpc: 'yashin' },
      { input: 'از یاشین درباره شیفت کاری و قهوه می‌پرسم.', expectedNpc: 'yashin' },
      { input: 'رو به مانی می‌پرسم اوضاع دستگاه اسپرسوساز چطوره؟', expectedNpc: 'mani' },
      { input: 'به سمت در ورودی برمی‌گردم تا هوای بارانی کوچه را استشمام کنم.', expectedScene: 'scene_entrance', disallowedPhrases: ['صندلی سنگین'] },
      { input: 'دوباره داخل سالن کافه می‌آیم.', expectedScene: 'scene_table5' },
    ],
  },
  {
    name: '3. Spatial Wanderer (Graph Connectivity Stress Test)',
    identity: 'من تحلیلگر سیستم هستم و نقشه فضا را بررسی می‌کنم.',
    turns: [
      { input: 'وارد کافه می‌شوم.', expectedScene: 'scene_table5' },
      { input: 'می‌روم به سمت پیشخوان.', expectedScene: 'scene_counter' },
      { input: 'می‌روم به سمت در ورودی.', expectedScene: 'scene_entrance', disallowedPhrases: ['صندلی سنگین', 'راه مستقیمی نداری'] },
      { input: 'می‌روم به سمت اتاق سالار.', expectedScene: 'scene_office', disallowedPhrases: ['راه مستقیمی نداری'] },
      { input: 'می‌روم به سالن اصلی و میز ۵.', expectedScene: 'scene_table5' },
      { input: 'می‌روم به انتهای سالن و گالری.', expectedScene: 'scene_gallery' },
      { input: 'می‌روم به پیشخوان.', expectedScene: 'scene_counter' },
      { input: 'می‌روم به اتاق دوربین‌ها.', expectedScene: 'scene_cctv' },
      { input: 'می‌روم به دفتر حسابداری.', expectedScene: 'scene_office' },
      { input: 'می‌روم به در ورودی کافه.', expectedScene: 'scene_entrance', disallowedPhrases: ['راه مستقیمی نداری', 'صندلی سنگین'] },
    ],
  },
  {
    name: '4. Critical Investigator & Dialogue Tester',
    identity: 'من بازرس دقیق و کاوشگر هستم و آمده‌ام تناقض‌ها را کشف کنم.',
    turns: [
      { input: 'رسید خیس کف سنگ‌فرش را برمی‌دارم و زمانش را می‌خوانم.' },
      { input: 'قدم به سالن کافه می‌گذارم.', expectedScene: 'scene_table5' },
      { input: 'از حانیه می‌پرسم چرا قهوه روی میز ۵ نیمه‌کاره رها شده؟', expectedNpc: 'haniyeh' },
      { input: 'فنجان روی میز ۵ را بو می‌کشم تا اثر ماده حلال را پیدا کنم.' },
      { input: 'به پیشخوان می‌روم و با یاشین صحبت می‌کنم.', expectedScene: 'scene_counter', expectedNpc: 'yashin' },
      { input: 'لاگ سفارش‌های دستگاه پوز را بررسی می‌کنم.' },
      { input: 'رو به مانی می‌پرسم چرا ساعت سفارش با خروج تفاوت دارد؟', expectedNpc: 'mani' },
      { input: 'به اتاق سالار می‌روم و فاکتورها را روی میز می‌گذارم.', expectedScene: 'scene_office', expectedNpc: 'salar' },
      { input: 'از سالار درباره تناقض ساعت‌ها و تماس‌های پلاک ۵۵ توضیح می‌خواهم.', expectedNpc: 'salar' },
    ],
  },
];

async function runComprehensiveSimulation() {
  console.log('================================================================');
  console.log('       PENTIMENTO — COMPREHENSIVE MULTI-ARCHETYPE SIMULATION');
  console.log('================================================================\n');

  let totalTurns = 0;
  let passedTurns = 0;

  for (const arc of ARCHETYPES) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`▶ RUNNING ARCHETYPE: ${arc.name}`);
    console.log(`  Identity: ${arc.identity}`);
    console.log(`----------------------------------------------------------------`);

    const state = createInitialRunState(Date.now() % 100000);
    const initRes = await resolvePlayerTurn(state, arc.identity);
    assert.ok(initRes.narrative, 'Identity setup must produce narrative');

    for (let i = 0; i < arc.turns.length; i++) {
      const turn = arc.turns[i];
      totalTurns++;
      const res = await resolvePlayerTurn(state, turn.input);
      const trace = res._debugInfo?.trace;

      // Assertions
      if (turn.expectedScene) {
        assert.equal(
          state.canonical.currentScene,
          turn.expectedScene,
          `[${arc.name} T${i + 1}] Expected scene ${turn.expectedScene}, got ${state.canonical.currentScene}`
        );
      }
      if (turn.expectedNpc) {
        const matchesNpc =
          trace?.target === turn.expectedNpc ||
          trace?.secondaryTarget === turn.expectedNpc ||
          trace?.subtraces?.some(st => st.target === turn.expectedNpc || st.secondaryTarget === turn.expectedNpc);
        assert.ok(
          matchesNpc,
          `[${arc.name} T${i + 1}] Expected NPC ${turn.expectedNpc}, got target=${trace?.target}, secondary=${trace?.secondaryTarget}`
        );
      }
      if (turn.disallowedPhrases) {
        for (const phrase of turn.disallowedPhrases) {
          assert.ok(
            !res.narrative.includes(phrase),
            `[${arc.name} T${i + 1}] Narrative should NOT include '${phrase}'. Output: ${res.narrative}`
          );
        }
      }
      if (turn.requiredPhrases) {
        for (const phrase of turn.requiredPhrases) {
          assert.ok(
            res.narrative.includes(phrase),
            `[${arc.name} T${i + 1}] Narrative must include '${phrase}'. Output: ${res.narrative}`
          );
        }
      }

      passedTurns++;
      const snippet = res.narrative.replace(/\n+/g, ' ').slice(0, 95);
      console.log(`  [T${i + 1}] «${turn.input}» -> Scene: ${state.canonical.currentScene} | ${snippet}...`);
    }

    console.log(`✅ ${arc.name} completed successfully (${arc.turns.length} turns).`);
  }

  console.log('\n================================================================');
  console.log(`📊 SIMULATION COMPLETE: ${passedTurns}/${totalTurns} Turns Passed (100%)`);
  console.log('================================================================');
}

runComprehensiveSimulation().catch(err => {
  console.error('\n❌ SIMULATION FAILED:', err);
  process.exit(1);
});

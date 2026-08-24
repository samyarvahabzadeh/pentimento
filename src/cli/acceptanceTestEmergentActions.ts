import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

interface EmergentTest {
  name: string;
  nodeSetup: string;
  input: string;
  expectedStateCheck: (state: any) => boolean;
  expectedNarrativeKeywords: string[];
}

const EMERGENT_TESTS: EmergentTest[] = [
  {
    name: '1. Dragging chair in front of door to block exit',
    nodeSetup: 'NODE_02',
    input: 'صندلی چوبی رو می‌کشم جلوی در تا کسی نتونه خارج شه',
    expectedStateCheck: (s) => s.environmentState?.doorBlocked === true && s.clocks?.npcPanic >= 1,
    expectedNarrativeKeywords: ['صندلی', 'در', 'مانی'],
  },
  {
    name: '2. Toggling lights switch to create darkness',
    nodeSetup: 'NODE_02',
    input: 'کلید برق رو می‌زنم و چراغ‌های سالن رو خاموش می‌کنم',
    expectedStateCheck: (s) => s.environmentState?.lightsOff === true && s.clocks?.npcPanic >= 1,
    expectedNarrativeKeywords: ['خاموش', 'مانیتور', 'تاریکی'],
  },
  {
    name: '3. Locking entrance door',
    nodeSetup: 'NODE_01',
    input: 'درِ ورودی کافه رو قفل می‌کنم تا راه بسته شه',
    expectedStateCheck: (s) => s.canonical.currentNode === 'NODE_01',
    expectedNarrativeKeywords: ['قفل', 'ورود'],
  },
  {
    name: '4. Recording ambient audio in alley with smartphone',
    nodeSetup: 'NODE_01',
    input: 'گوشی رو درمیارم و صدای داخل کوچه حسینی رو ضبط می‌کنم',
    expectedStateCheck: (s) => s.environmentState?.recordingActive === true && s.canonical.evidenceIds.includes('fact_acoustic_distant_motorcycle'),
    expectedNarrativeKeywords: ['ضبط', 'صدا', 'موتور'],
  },
  {
    name: '5. Tearing wet receipt to alter evidence',
    nodeSetup: 'NODE_01',
    input: 'رسید خیس رو پاره می‌کنم و تیکه‌تیکه‌اش می‌کنم',
    expectedStateCheck: (s) => s.environmentState?.modifiedObjects?.item_wet_receipt === 'torn' && s.clocks?.evidenceRemoval >= 1,
    expectedNarrativeKeywords: ['کاغذی', 'الیاف', 'مهر'],
  },
  {
    name: '6. Hiding receipt under coffee cup',
    nodeSetup: 'NODE_02',
    input: 'رسید رو یواشکی می‌ذارم زیر فنجان قهوه میز ۵ تا ببینم کسی متوجه می‌شه یا نه',
    expectedStateCheck: (s) => s.environmentState?.hiddenItems?.item_wet_receipt === 'under_cup',
    expectedNarrativeKeywords: ['نعلبکی', 'فنجان', 'پنهان'],
  },
  {
    name: '7. Packing coffee cup into bag',
    nodeSetup: 'NODE_02',
    input: 'فنجان رو می‌ذارم داخل کیفم تا نمونه رو ببرم',
    expectedStateCheck: (s) => s.canonical.inventoryIds.includes('item_sample_cup') && s.canonical.evidenceIds.includes('fact_solvent_smell_cup'),
    expectedNarrativeKeywords: ['کیف', 'فنجان', 'حانیه'],
  },
  {
    name: '8. Bluffing to Salar that police are waiting outside',
    nodeSetup: 'NODE_11',
    input: 'به سالار صالحی دروغ می‌گم که گشت پلیس پایین منتظر گزارشه',
    expectedStateCheck: (s) => (s.npcPressure?.salar ?? 0) >= 2 && s.clocks?.policeAttention >= 1,
    expectedNarrativeKeywords: ['پلیس', 'سالار', 'پرونده'],
  },
  {
    name: '9. Asking Mani for his private phone',
    nodeSetup: 'NODE_03',
    input: 'از مانی می‌خوام موبایلش رو بده تا پیام‌هاشو چک کنم',
    expectedStateCheck: (s) => (s.npcTrust?.mani ?? 0) <= -1,
    expectedNarrativeKeywords: ['گوشی', 'مانی', 'شخصی'],
  },
  {
    name: '10. Offering counter-bribe / money to Collector',
    nodeSetup: 'NODE_16',
    input: 'به کلکسیونر پیشنهاد پول می‌دم تا تابلو رو به من بفروشه',
    expectedStateCheck: (s) => (s.npcPressure?.collector ?? 0) >= 1 && s.proofDomains?.SOCIAL >= 1,
    expectedNarrativeKeywords: ['پیشنهاد', 'کلکسیونر', 'ارزش'],
  },
  {
    name: '11. Feeding false information to Haniyeh',
    nodeSetup: 'NODE_02',
    input: 'عمداً اطلاعات غلط در اختیار حانیه می‌گذارم تا واکنشش رو ببینم',
    expectedStateCheck: (s) => (s.npcTrust?.haniyeh ?? 0) <= -1,
    expectedNarrativeKeywords: ['حانیه', 'تبلت'],
  },
  {
    name: '12. Looking outside window to spot surveillance car',
    nodeSetup: 'NODE_02',
    input: 'از پنجره به تاریکی کوچه نگاه می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_parked_car_sighting'),
    expectedNarrativeKeywords: ['پنجره', 'شیشه', 'خودرو'],
  },
  {
    name: '13. Standing in total silence for 5 minutes',
    nodeSetup: 'NODE_02',
    input: 'پنج دقیقه هیچ کاری نمی‌کنم و فقط سکوت می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_guest_hesitation'),
    expectedNarrativeKeywords: ['سکوت', 'حانیه', 'یاشین'],
  },
  {
    name: '14. Trespassing behind the barista counter',
    nodeSetup: 'NODE_03',
    input: 'بدون اجازه می‌رم پشت کانتر و کنار مخزن قهوه می‌ایستم',
    expectedStateCheck: (s) => (s.npcTrust?.mani ?? 0) <= -1 && (s.npcTrust?.yashin ?? 0) <= -1,
    expectedNarrativeKeywords: ['کانتر', 'یاشین', 'بار'],
  },
  {
    name: '15. Soaking receipt with water',
    nodeSetup: 'NODE_01',
    input: 'رسید رو خیس‌تر می‌کنم تا جوهرش پخش شه',
    expectedStateCheck: (s) => s.clocks?.evidenceRemoval >= 1,
    expectedNarrativeKeywords: ['کاغذی', 'مهر'],
  },
  {
    name: '16. Examining central painting surface closely',
    nodeSetup: 'NODE_06',
    input: 'با زاویه به سطح بوم نقاشی نور می‌تابانم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_underpainting_hidden_layer') && s.proofDomains?.ART >= 2,
    expectedNarrativeKeywords: ['بوم', 'رنگ', 'لایه'],
  },
  {
    name: '17. Checking POS order logs',
    nodeSetup: 'NODE_03',
    input: 'مانیتور پوز و لاگ سفارش‌ها رو بررسی می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_pos_order_timestamp') && s.proofDomains?.SYS >= 2,
    expectedNarrativeKeywords: ['پوز', 'لاگ'],
  },
  {
    name: '18. Examining office financial ledger',
    nodeSetup: 'NODE_11',
    input: 'زونکن فاکتورهای دفتر حسابداری رو باز می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_invoice_lot55_seal'),
    expectedNarrativeKeywords: ['زونکن', 'فاکتور', 'پلاک'],
  },
  {
    name: '19. Interrogating Yashin about exit time',
    nodeSetup: 'NODE_03',
    input: 'از یاشین درباره ساعت دقیق خروج مهمان می‌پرسم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_time_0017'),
    expectedNarrativeKeywords: ['یاشین', '۰۰:۱۷'],
  },
  {
    name: '20. Asking Mani about cup chemical smell',
    nodeSetup: 'NODE_03',
    input: 'از مانی درباره بوی تند حلال روی فنجان سوال می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_solvent_smell_cup'),
    expectedNarrativeKeywords: ['مانی', 'تینر'],
  },
  {
    name: '21. Talking to Haniyeh about the guest',
    nodeSetup: 'NODE_02',
    input: 'از حانیه درباره رفتار مرد پالتوپوش می‌پرسم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_guest_hesitation'),
    expectedNarrativeKeywords: ['حانیه', 'فنجان'],
  },
  {
    name: '22. Inspecting behind the painting',
    nodeSetup: 'NODE_06',
    input: 'می‌رم پشت بوم تا برچسب شجره‌نامه رو ببینم',
    expectedStateCheck: (s) => s.canonical.currentNode === 'NODE_07',
    expectedNarrativeKeywords: [],
  },
  {
    name: '23. Stepping into the kitchen area',
    nodeSetup: 'NODE_08',
    input: 'می‌رم سمت انبار کارتن‌ها و جعبه‌ها',
    expectedStateCheck: (s) => s.canonical.currentNode === 'NODE_08',
    expectedNarrativeKeywords: [],
  },
  {
    name: '24. Bluffing the Collector in Node 16',
    nodeSetup: 'NODE_16',
    input: 'به کلکسیونر بلوف می‌زنم که مدارک جعلی رو تحویل پلیس دادم',
    expectedStateCheck: (s) => (s.npcPressure?.collector ?? 0) >= 2,
    expectedNarrativeKeywords: ['کلکسیونر'],
  },
  {
    name: '25. Discovering historical breach in Node 18',
    nodeSetup: 'NODE_18',
    input: 'لایه باستانی و سند کهن کارگاه فلورانس را کشف می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_florence_historical_breach') && s.proofDomains?.FACTION >= 3,
    expectedNarrativeKeywords: ['فلورانس', 'چهار', 'نشانه'],
  },
  {
    name: '26. Reckless drinking of cup',
    nodeSetup: 'NODE_02',
    input: 'فنجان را سر می‌کشم و یک‌نفس می‌نوشم',
    expectedStateCheck: (s) => s.canonical.endingId === 'BAD_ENDING_TOXIC_SHOCK',
    expectedNarrativeKeywords: ['مایع', 'سوزاننده'],
  },
  {
    name: '27. Abandoning cafe at night',
    nodeSetup: 'NODE_01',
    input: 'ولش کن بابا، می‌رم خونه بخوابم',
    expectedStateCheck: (s) => s.canonical.endingId === 'BAD_ENDING_ABANDONMENT_ARSON',
    expectedNarrativeKeywords: ['آتش‌سوزی', 'خاکستر'],
  },
  {
    name: '28. Insulting coffee barista',
    nodeSetup: 'NODE_03',
    input: 'به مانی توهین می‌کنم که قهوه‌اش افتضاح است',
    expectedStateCheck: (s) => (s.npcTrust?.mani ?? 0) <= -2 && s.clocks?.npcPanic >= 1,
    expectedNarrativeKeywords: ['مانی', 'اخم'],
  },
  {
    name: '29. Observing the exiting man in alley',
    nodeSetup: 'NODE_01',
    input: 'مرد پالتوپوش با دستکش قرمز رو هنگام خروج بررسی می‌کنم',
    expectedStateCheck: (s) => s.canonical.evidenceIds.includes('fact_red_glove_man'),
    expectedNarrativeKeywords: ['دستکش', 'قرمز'],
  },
  {
    name: '30. Taking the wet receipt from street',
    nodeSetup: 'NODE_01',
    input: 'رسید خیس رو از روی سنگ‌فرش کوچه برمی‌دارم',
    expectedStateCheck: (s) => s.canonical.inventoryIds.includes('item_wet_receipt') && s.canonical.evidenceIds.includes('fact_wet_receipt'),
    expectedNarrativeKeywords: ['رسید', 'سنگ‌فرش'],
  },
  {
    name: '31. Looking around general surroundings',
    nodeSetup: 'NODE_02',
    input: 'به دکوراسیون و نورپردازی سالن نگاه می‌کنم',
    expectedStateCheck: (s) => s.canonical.currentNode === 'NODE_02',
    expectedNarrativeKeywords: [],
  },
  {
    name: '32. Following exiting man down Hosseini alley',
    nodeSetup: 'NODE_01',
    input: 'دنبال مرد پالتوپوش توی کوچه حسینی راه می‌افتم',
    expectedStateCheck: (s) => s.canonical.currentNode === 'NODE_13' && s.clocks?.personalRisk >= 2,
    expectedNarrativeKeywords: [],
  },
];

async function runEmergentTestSuite() {
  console.log('🧪 Starting Pentimento Emergent Actions & World Simulation Test Suite (32 Scenarios)...\n');

  let passedCount = 0;

  for (const test of EMERGENT_TESTS) {
    const state = createInitialRunState(100);
    state.canonical.currentNode = test.nodeSetup;
    state.scene.nodeId = test.nodeSetup;
    state.canonical.currentScene = test.nodeSetup.toLowerCase();
    state.scene.sceneId = test.nodeSetup.toLowerCase();
    state.canonical.playerClass = 'investigator';

    const result = await resolvePlayerTurn(state, test.input);

    const statePass = test.expectedStateCheck(result.stateAfter);
    const narrativePass = test.expectedNarrativeKeywords.length === 0 || test.expectedNarrativeKeywords.some(kw => result.narrative.includes(kw));

    if (statePass && narrativePass) {
      console.log(`✅ PASS: ${test.name}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${test.name}`);
      console.error(`   Input: «${test.input}»`);
      console.error(`   Candidate ID: ${result.validation?.acceptedActionId}`);
      console.error(`   Current Node: ${result.stateAfter.canonical.currentNode}`);
      console.error(`   StatePass: ${statePass}, NarrativePass: ${narrativePass}`);
      console.error(`   Narrative: ${result.narrative}`);
      console.error(`   Clocks: ${JSON.stringify(result.stateAfter.clocks)}`);
      console.error(`   EnvState: ${JSON.stringify(result.stateAfter.environmentState)}`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`📊 RESULTS: ${passedCount} / ${EMERGENT_TESTS.length} Emergent Tests Passed (${Math.round((passedCount / EMERGENT_TESTS.length) * 100)}%)`);
  console.log(`========================================================`);

  if (passedCount === EMERGENT_TESTS.length) {
    console.log('🎉 ALL 32 EMERGENT TESTS PASSED PERFECTLY!');
  } else {
    process.exit(1);
  }
}

runEmergentTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

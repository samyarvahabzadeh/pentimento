import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

interface AdversarialTestCase {
  id: number;
  category: string;
  input: string;
  node: string;
  role: string;
  expectedProperties: {
    mustNotCrash: boolean;
    mustNotGiveGenericRejection: boolean;
    stateVerification: (stateBefore: any, stateAfter: any, narrative: string) => boolean;
  };
}

export const ADVERSARIAL_TESTS: AdversarialTestCase[] = [
  // ── 1. UNUSUAL PARAPHRASES (1..6) ──
  {
    id: 1,
    category: 'Unusual Paraphrase',
    input: 'حجم نوری سالن رو به صفر می‌رسونم و تاریکی مطلق ایجاد می‌کنم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.environmentState?.lightsOff === true,
    },
  },
  {
    id: 2,
    category: 'Unusual Paraphrase',
    input: 'ستون چوبی حائل رو تا مدخل ورودی سُر می‌دم تا سدی مقابل خروج بشه',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.environmentState?.doorBlocked === true,
    },
  },
  {
    id: 3,
    category: 'Unusual Paraphrase',
    input: 'ردپای اسید و حلال فرّار هیدروکربنی توی سفال فنجان رو استنشاق می‌کنم',
    node: 'NODE_02',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_solvent_smell_cup'),
    },
  },
  {
    id: 4,
    category: 'Unusual Paraphrase',
    input: 'ورقهٔ تاخوردهٔ حرارتی نم‌کشیده رو از روی سنگفرش باران‌زده بالا می‌کشم',
    node: 'NODE_01',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_wet_receipt'),
    },
  },
  {
    id: 5,
    category: 'Unusual Paraphrase',
    input: 'اشعه نور مورب رو روی لایه‌های روغن خشک‌شدهٔ بوم هدایت می‌کنم',
    node: 'NODE_06',
    role: 'art_historian',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_underpainting_hidden_layer'),
    },
  },
  {
    id: 6,
    category: 'Unusual Paraphrase',
    input: 'شیت لاگ دیتابیس دستگاه صندوق پوز رو فراخوانی می‌کنم',
    node: 'NODE_03',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_pos_order_timestamp'),
    },
  },

  // ── 2. MULTI-ACTION IN SINGLE SENTENCE (7..12) ──
  {
    id: 7,
    category: 'Multi-Action Decomposition',
    input: 'مانی را با بحث قهوه سرگرم می‌کنم، رسید را زیر منو می‌گذارم و بعد واکنشش را نگاه می‌کنم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a, n) => a.environmentState?.hiddenItems !== undefined || n.includes('مرحله'),
    },
  },
  {
    id: 8,
    category: 'Multi-Action Decomposition',
    input: 'کلید برق را می‌زنم، صندلی را جلوی در می‌کشم و در سکوت می‌ایستم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.environmentState?.lightsOff === true && a.environmentState?.doorBlocked === true,
    },
  },
  {
    id: 9,
    category: 'Multi-Action Decomposition',
    input: 'فنجان را بو می‌کنم، سپس نمونه را داخل کیفم می‌گذارم و به حانیه نگاه می‌کنم',
    node: 'NODE_02',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_solvent_smell_cup') || a.canonical.inventoryIds.includes('item_sample_cup'),
    },
  },
  {
    id: 10,
    category: 'Multi-Action Decomposition',
    input: 'رسید را از روی زمین برمی‌دارم، گوشه‌اش را پاره می‌کنم و وارد کافه می‌شوم',
    node: 'NODE_01',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.inventoryIds.includes('item_wet_receipt') || a.environmentState?.modifiedObjects !== undefined,
    },
  },
  {
    id: 11,
    category: 'Multi-Action Decomposition',
    input: 'از یاشین ساعت خروج را می‌پرسم و همزمان لاگ دستگاه پوز را بررسی می‌کنم',
    node: 'NODE_03',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_time_0017') || a.canonical.evidenceIds.includes('fact_pos_order_timestamp'),
    },
  },
  {
    id: 12,
    category: 'Multi-Action Decomposition',
    input: 'تابلو را بررسی می‌کنم، پشت بوم را نگاه می‌کنم و یادداشت برمی‌دارم',
    node: 'NODE_06',
    role: 'art_historian',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      // Looking behind the canvas is a physical choice, not a hidden-choice
      // reward gate. It may change vantage point, but must not magically award
      // the underpainting discovery from a broad look.
      stateVerification: (b, a) =>
        !a.canonical.evidenceIds.includes('fact_underpainting_hidden_layer') &&
        a.canonical.currentNode === 'NODE_07',
    },
  },

  // ── 3. CONDITIONAL ACTIONS (13..17) ──
  {
    id: 13,
    category: 'Conditional Action',
    input: 'اگر مانی حواسش به بار است، فیش را برمی‌دارم وگرنه صبر می‌کنم',
    node: 'NODE_01',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.inventoryIds.includes('item_wet_receipt') || a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 14,
    category: 'Conditional Action',
    input: 'اگر در قفل است، به شیشه پنجره نگاه می‌کنم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 15,
    category: 'Conditional Action',
    input: 'اگر سالار پرخاش کرد، سکوت می‌کنم و فقط به چشمانش نگاه می‌کنم',
    node: 'NODE_11',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 16,
    category: 'Conditional Action',
    input: 'اگر فنجان هنوز گرم است، آن را بو می‌کشم',
    node: 'NODE_02',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_solvent_smell_cup') || a.canonical.evidenceIds.includes('fact_table5_active_window'),
    },
  },
  {
    id: 17,
    category: 'Conditional Action',
    input: 'اگر پشت تابلو برچسبی هست، تاریخش را می‌خوانم',
    node: 'NODE_06',
    role: 'art_historian',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 4. MULTI-STEP DECEPTION & BLUFFING (18..22) ──
  {
    id: 18,
    category: 'Multi-Step Deception',
    input: 'به سالار می‌گویم مانی همه چیز را اعتراف کرده و فاکتور جعلی لو رفته است',
    node: 'NODE_11',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => (a.npcPressure?.salar ?? 0) >= (b.npcPressure?.salar ?? 0),
    },
  },
  {
    id: 19,
    category: 'Multi-Step Deception',
    input: 'به یاشین می‌گویم رسید برای خود من است اما نام خریدار دیگری رویش خورده',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 20,
    category: 'Multi-Step Deception',
    input: 'به حانیه وانمود می‌کنم بازرس اتحادیه صنف کافه‌ها هستم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 21,
    category: 'Multi-Step Deception',
    input: 'به مانی می‌گویم بوی عطر گلاب از فنجان بلند شده نه شوینده',
    node: 'NODE_03',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 22,
    category: 'Multi-Step Deception',
    input: 'به کلکسیونر می‌گویم تابلو پیش از رسیدن من آتش گرفته و خاکستر شده',
    node: 'NODE_16',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 5. SIMULTANEOUS INTERACTION WITH TWO NPCS (23..26) ──
  {
    id: 23,
    category: 'Dual NPC Interaction',
    input: 'همزمان به مانی و یاشین نگاه می‌کنم و درباره تضاد حرف‌هایشان می‌پرسم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 24,
    category: 'Dual NPC Interaction',
    input: 'به حانیه اشاره می‌کنم که نزدیک‌تر بیاید در حالی که با سالار صحبت می‌کنم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 25,
    category: 'Dual NPC Interaction',
    input: 'یاشین را صدا می‌زنم تا شاهد حرف‌های مانی درباره تینر باشد',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 26,
    category: 'Dual NPC Interaction',
    input: 'نگاهم را بین چشمان سالار و حانیه رد و بدل می‌کنم تا ببینم کدام مضطرب‌ترند',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 6. UNEXPECTED OBJECT USAGE (27..32) ──
  {
    id: 27,
    category: 'Unexpected Object Usage',
    input: 'نعلبکی سرامیکی را جلوی نور می‌گیرم تا بازتاب لکه قرمز روی دیوار بیفتد',
    node: 'NODE_02',
    role: 'art_historian',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 28,
    category: 'Unexpected Object Usage',
    input: 'با انگشتم روی پیشخوان چوبی ریتم منظمی می‌زنم تا اعصاب پرسنل را بسنجم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 29,
    category: 'Unexpected Object Usage',
    input: 'پرده ضخیم مخمل را کامل می‌کشم تا دید کوچه حسینی کور شود',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 30,
    category: 'Unexpected Object Usage',
    input: 'دستمال نازل بخار را برمی‌دارم و سطح رویی فنجان را پاک می‌کنم',
    node: 'NODE_03',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 31,
    category: 'Unexpected Object Usage',
    input: 'پایه منو را از روی میز ۵ به میز شماره ۱ منتقل می‌کنم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 32,
    category: 'Unexpected Object Usage',
    input: 'از لبهٔ تیز فیش کاغذی برای خراشیدن لکه خشک‌شده روی نعلبکی استفاده می‌کنم',
    node: 'NODE_02',
    role: 'art_historian',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 7. INDIRECT OBSERVATION (33..37) ──
  {
    id: 33,
    category: 'Indirect Observation',
    input: 'از بازتاب مانیتور خاموش پوز به چهره و حرکات دست مانی نگاه می‌کنم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 34,
    category: 'Indirect Observation',
    input: 'به سایه پنتی زیر مبل دقت می‌کنم تا ببینم از چه سمتی می‌ترسد',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.canonical.evidenceIds.includes('fact_guest_hesitation') || a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 35,
    category: 'Indirect Observation',
    input: 'به جای چهره سالار، به لرزش دستانش هنگام بستن زونکن نگاه می‌کنم',
    node: 'NODE_11',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 36,
    category: 'Indirect Observation',
    input: 'به بخار متصاعد شده از نازل قهوه نگاه می‌کنم تا غلظت چربی هوا را بسنجم',
    node: 'NODE_03',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 37,
    category: 'Indirect Observation',
    input: 'از شیشهٔ رفلکس پنجره به رفت‌وآمد سایه‌ها در پیاده‌رو نگاه می‌کنم',
    node: 'NODE_02',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 8. LONG WAITING & STALLING (38..41) ──
  {
    id: 38,
    category: 'Long Waiting / Stalling',
    input: 'ده دقیقه روی صندلی روبه‌روی کانتر می‌نشینم و هیچ حرفی نمی‌زنم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 39,
    category: 'Long Waiting / Stalling',
    input: 'تا زمانی که یاشین خودش سر صحبت را باز نکند ساکت می‌مانم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 40,
    category: 'Long Waiting / Stalling',
    input: 'به ساعت دیواری خیره می‌شوم و گذر ثانیه‌ها را می‌شمارم',
    node: 'NODE_02',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 41,
    category: 'Long Waiting / Stalling',
    input: 'چشمانم را می‌بندم و ۵ دقیقه فقط به صدای باران و تنفس حاضرین گوش می‌دهم',
    node: 'NODE_01',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 9. ENVIRONMENTAL MODIFICATION (42..45) ──
  {
    id: 42,
    category: 'Environmental Modification',
    input: 'لیوان‌های یک‌بارمصرف روی کانتر را مرتب در یک ردیف می‌چینم',
    node: 'NODE_03',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 43,
    category: 'Environmental Modification',
    input: 'پادری دم در ورودی کافه را با پا صاف می‌کنم',
    node: 'NODE_01',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 44,
    category: 'Environmental Modification',
    input: 'شیر آب سینک پشت بار را باز می‌کنم تا صدای آب در سالن بپیچد',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 45,
    category: 'Environmental Modification',
    input: 'روشنایی نمایشگر پوز را با دکمه‌های کناری‌اش کم می‌کنم',
    node: 'NODE_03',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 10. PLAUSIBLE BUT UNSUCCESSFUL ATTEMPTS (46..50) ──
  {
    id: 46,
    category: 'Plausible In-World Failure',
    input: 'سعی می‌کنم کشوی قفل‌دار صندوق را بدون کلید با کشیدن باز کنم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a, n) => n.includes('قفل') || n.includes('بسته'),
    },
  },
  {
    id: 47,
    category: 'Plausible In-World Failure',
    input: 'می‌خواهم از فنجان کاملاً خالی شده قهوه بنوشم',
    node: 'NODE_02',
    role: 'coffee_alchemist',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a, n) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 48,
    category: 'Plausible In-World Failure',
    input: 'تلاش می‌کنم پسورد سیستم دوربین‌ها را بدون هیچ رمزی حدس بزنم',
    node: 'NODE_12',
    role: 'systems_analyst',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 49,
    category: 'Plausible In-World Failure',
    input: 'می‌خواهم برچسب چسبیده به پشت بوم را بدون ابزار یک‌تکه جدا کنم',
    node: 'NODE_07',
    role: 'art_historian',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 50,
    category: 'Plausible In-World Failure',
    input: 'تلاش می‌کنم صدای مکالمه داخل کوچه را از پشت دو لایه شیشه دوجداره بشنوم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 11. PHYSICALLY IMPOSSIBLE ATTEMPTS (51..53) ──
  {
    id: 51,
    category: 'Physically Impossible Attempt',
    input: 'دستگاه اسپرسوساز صنعتی ۵۰ کیلویی را با یک دست بلند می‌کنم و توی جیبم می‌گذارم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a, n) => n.includes('سنگین') || n.includes('ممکن نیست') || n.includes('متصل'),
    },
  },
  {
    id: 52,
    category: 'Physically Impossible Attempt',
    input: 'پیشخوان چوبی ده‌متری کافه را هل می‌دهم و به کوچه پرت می‌کنم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a, n) => n.includes('سنگین') || n.includes('متصل') || n.includes('تکان'),
    },
  },
  {
    id: 53,
    category: 'Physically Impossible Attempt',
    input: 'با یک پرش از سقف کافه به خیابان پشتی می‌پرم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 12. SUBTLE SOCIAL BEHAVIOR (54..56) ──
  {
    id: 54,
    category: 'Subtle Social Behavior',
    input: 'به نشانه تایید آرام سرم را تکان می‌دهم و لبخند کنترل‌شده‌ای می‌زنم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 55,
    category: 'Subtle Social Behavior',
    input: 'دست‌هایم را پشت سرم قفل می‌کنم و با فاصله مطمئن از کانتر قدم می‌زنم',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 56,
    category: 'Subtle Social Behavior',
    input: 'بدون پلک زدن برای ده ثانیه به نقطه تمرکز نگاه حانیه خیره می‌شوم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 13. INFORMATION MANIPULATION & CONTRADICTIONS (57..58) ──
  {
    id: 57,
    category: 'Information Manipulation',
    input: 'به یاشین می‌گویم که مانی به من گفته فاکتور ساعت ۱۱ شب چاپ شده بود',
    node: 'NODE_03',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
  {
    id: 58,
    category: 'Information Manipulation',
    input: 'به حانیه می‌گویم پنتی بیرون کافه تصادف کرده تا واکنش عاطفی‌اش را بسنجم',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },

  // ── 14. DELAYED PLANS & TIMED SETUPS (59..60) ──
  {
    id: 59,
    category: 'Delayed Plan / Timed Setup',
    input: 'گوشی‌ام را روی ضبط مدام می‌گذارم و زیر میز ۵ رها می‌کنم تا صدای بعد از خروجم را ثبت کند',
    node: 'NODE_02',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.environmentState?.recordingActive === true,
    },
  },
  {
    id: 60,
    category: 'Delayed Plan / Timed Setup',
    input: 'به سالار می‌گویم ساعت ۱ بامداد دوباره به دفترش برمی‌گردم تا مدارک را تسویه کنیم',
    node: 'NODE_11',
    role: 'investigator',
    expectedProperties: {
      mustNotCrash: true,
      mustNotGiveGenericRejection: true,
      stateVerification: (b, a) => a.scene.turn > b.scene.turn,
    },
  },
];

export async function runAdversarialAudit() {
  console.log(`\n========================================================`);
  console.log(`🕵️ STARTING ADVERSARIAL EMERGENT PLAY AUDIT (${ADVERSARIAL_TESTS.length} SCENARIOS)`);
  console.log(`========================================================\n`);

  let passCount = 0;
  const failureDetails: Array<{ id: number; category: string; input: string; reason: string }> = [];

  for (const t of ADVERSARIAL_TESTS) {
    const state = createInitialRunState(200 + t.id);
    state.canonical.currentNode = t.node;
    state.scene.nodeId = t.node;
    state.canonical.currentScene = t.node.toLowerCase();
    state.scene.sceneId = t.node.toLowerCase();
    state.canonical.playerClass = t.role as any;

    const stateBefore = JSON.parse(JSON.stringify(state));

    try {
      const res = await resolvePlayerTurn(state, t.input);

      const notCrashed = res && res.stateAfter !== undefined;
      const genericFailurePhrases = [
        'امکان‌پذیر نیست',
        'سیستم خطا داد',
        'نیتت قابل فهم است',
        'کنش اجرایی روشنی ندارد',
        'با دقت محیط اطراف را بررسی می‌کنی',
        'نشانه‌های کلیدی با دقت بیشتری در ذهنت ثبت می‌شوند',
      ];
      const notGenericRejected = !genericFailurePhrases.some(phrase => res.narrative.includes(phrase));
      const statePassed = t.expectedProperties.stateVerification(stateBefore, res.stateAfter, res.narrative);

      if (notCrashed && notGenericRejected && statePassed) {
        console.log(`✅ [Test ${t.id.toString().padStart(2, '0')}] PASS (${t.category}): «${t.input.substring(0, 50)}...»`);
        passCount++;
      } else {
        const reason = `Crashed: ${!notCrashed}, GenericRejected: ${!notGenericRejected}, StatePassed: ${statePassed} (Narrative: ${res?.narrative.substring(0, 60)}...)`;
        console.error(`❌ [Test ${t.id.toString().padStart(2, '0')}] FAIL (${t.category}): «${t.input}»`);
        console.error(`   Reason: ${reason}`);
        failureDetails.push({ id: t.id, category: t.category, input: t.input, reason });
      }
    } catch (err: any) {
      console.error(`💥 [Test ${t.id.toString().padStart(2, '0')}] CRASH: «${t.input}» -> ${err.message}`);
      failureDetails.push({ id: t.id, category: t.category, input: t.input, reason: `Crash: ${err.message}` });
    }
  }

  const passPercentage = Math.round((passCount / ADVERSARIAL_TESTS.length) * 100);
  console.log(`\n========================================================`);
  console.log(`📊 ADVERSARIAL AUDIT RESULT: ${passCount} / ${ADVERSARIAL_TESTS.length} Passed (${passPercentage}%)`);
  console.log(`========================================================\n`);

  return {
    total: ADVERSARIAL_TESTS.length,
    passed: passCount,
    failed: failureDetails.length,
    passPercentage,
    failures: failureDetails,
  };
}

if (process.argv[1]?.endsWith('adversarialAuditSuite.ts') || process.argv[1]?.endsWith('adversarialAuditSuite.js')) {
  runAdversarialAudit().then(res => {
    if (res.failed > 0) {
      console.log(`⚠️ Completed with ${res.failed} failures:`);
      for (const f of res.failures) {
        console.log(`- [Test ${f.id}] (${f.category}): «${f.input}» -> ${f.reason}`);
      }
      process.exitCode = 1;
    } else {
      console.log(`🎉 ALL ${res.total} ADVERSARIAL TESTS PASSED WITHOUT OVERFITTING!`);
    }
  });
}

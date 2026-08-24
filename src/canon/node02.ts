import type { CanonicalActionId } from '../core/types.js';

export const NODE_02_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'ANALYZE_RED_GLOVE',
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'EXAMINE_ESPRESSO_CUP',
  'EXAMINE_RED_GLOVE',
  'EXAMINE_RED_STAIN',
  'EXAMINE_TABLE_5',
  'EXIT_CAFE_TO_ALLEY',
  'OBSERVE_CAFE_INTERIOR',
  'OBSERVE_PENTI',
  'OBSERVE_THE_GUEST',
  'RETURN_TO_TABLE_5',
  'TALK_TO_HANIYEH',
  'TALK_TO_THE_GUEST',
];

export const NODE_02_FACTS = [
  {
    id: 'fact_table_5_espresso',
    text: 'روی میز چوبی شماره ۵، یک فنجان اسپرسو کاملاً پر و دست‌نخورده رها شده است. کرمای روی قهوه تیره و خنک شده و نشان می‌دهد مدتی است کسی به آن دست نزده است.',
  },
  {
    // CUP SEED — True Ending prerequisite. Neutral positional observation only.
    id: 'fact_espresso_cup_placement',
    text: 'فنجان دقیقاً روی مرکز هندسی میز قرار گرفته است — نه لبه، نه گوشه. برای قهوه‌ای که پشیمانی به همراه داشته، این دقت در چیدمان چشمگیر است.',
  },
  {
    id: 'fact_red_stain_saucer',
    text: 'روی لبهٔ نعلبکی سرامیکی سفید، یک لکهٔ قرمز رنگ باریک دیده می‌شود. در نگاه اول شبیه اثر رژلب به نظر می‌رسد، اما حالتی خشک و لایه‌مانند دارد. منشأ آن قطعی نیست.',
  },
  {
    id: 'fact_haniyeh_witness',
    text: 'حانیه (همسر سالار، ۲۴ ساله) نزدیک میز ۵ در حال مرتب کردن است. او شهادت می‌دهد که مشتری میز ۵ یک مرد تنها با پالتوی تیره بود که بدون لمس قهوه و بعد از مکثی کوتاه کافه را ترک کرد.',
  },
  {
    id: 'fact_penti_avoids_table_5',
    text: 'پنتی (بچه‌گربهٔ دوماههٔ کافه) میان میزها می‌چرخد اما به شکل معناداری از نزدیک شدن به میز ۵ خودداری می‌کند؛ گویی متوجه بوی مادهٔ شیمیایی یا تمیزکنندهٔ ناآشنایی در آن نقطه شده است.',
  },
  {
    id: 'fact_counter_presence',
    text: 'در انتهای سالن کافه، کانتر چوبی قرار دارد که یاشین و مانی پشت دستگاه اسپرسو و آسیاب مشغول آماده‌سازی سفارش‌ها هستند.',
  },
  {
    // THE GUEST — Encounter fact. Unlocks only after OBSERVE_THE_GUEST action.
    // Guaranteed on first run. Conditional on replays (flag: first_run_opening_seen).
    id: 'fact_the_guest_presence',
    text: 'مردی با پوشش رسمی در گوشه‌ای از کافه نشسته است. به تابلوی گالری انتهای سالن خیره است. فنجانش خالی است اما تکان نمی‌خورد.',
  },
  {
    // THE GUEST — Canonical utterance. Unlocks only after TALK_TO_THE_GUEST.
    // Subtle visual bridge to Table 5 without direct commands or premature clue exposure.
    id: 'fact_the_guest_pentimento_remark',
    text: 'مرد بدون اینکه نگاهش را از تابلو بگیرد می‌گوید: «اسم جالبیه. پنتیمنتو.» مکثی می‌کند؛ چشمانش آرام به سمت فنجان نیمه‌سرد و رهاشدهٔ میز ۵ سُر می‌خورد: «می‌دونی چیه؟ نقاشی روی نقاشی قبلی... بعضی‌ها قبل از اینکه قهوه‌شون سرد بشه فرار می‌کنن.» و قبل از اینکه جوابی بدهی، می‌رود.',
  },
];

export const NODE_02_INITIAL_STATE = {
  description: `سالن داخلی کافه پنتیمنتو. ساعت ۰۰:۱۷ بامداد.
بوی قهوه و چوب کهنه در هوا پیچیده و صدای ملایم دستگاه آسیاب از سمت کانتر به گوش می‌رسد.
میز شمارهٔ ۵ در گوشه‌ای از سالن خالی مانده است.
یک فنجان اسپرسوی دست‌نخورده با نعلبکی لکه‌دار روی میز است.
حانیه چند قدم آن‌طرف‌تر مشغول مرتب‌کردن میزهاست.`,

  activeEntityIds: ['haniyeh', 'penti', 'the_guest'] as string[],
  visibleObjectIds: [
    'table_5',
    'untouched_espresso',
    'red_stain_saucer',
    'counter_area',
    'cafe_interior',
    'the_guest_figure',
  ] as string[],
  canonFacts: NODE_02_FACTS,
};

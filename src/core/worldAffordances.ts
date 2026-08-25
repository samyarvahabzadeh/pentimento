import type { ActionPrimitive, LocationDefinition, ObjectProperty, WorldObject } from './types.js';

const PERSIAN_COMBINING_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;

function normalizeForLexemeMatching(value: string): string {
  return value.normalize('NFKC').replace(PERSIAN_COMBINING_MARKS, '');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches a short Persian lexeme as a complete token. JavaScript's `\b`
 * boundary is ASCII-oriented, so `/در/` used to match the letters inside
 * words such as «مرد» and «درباره» and falsely target the cafe door.
 */
export function hasStandaloneLexeme(input: string, lexeme: string): boolean {
  const normalizedInput = normalizeForLexemeMatching(input);
  const normalizedLexeme = escapeRegex(normalizeForLexemeMatching(lexeme));
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}_])${normalizedLexeme}(?=$|[^\\p{L}\\p{N}_])`,
    'u'
  ).test(normalizedInput);
}

export const INITIAL_WORLD_OBJECTS: Record<string, WorldObject> = {
  wooden_chair: {
    id: 'wooden_chair',
    nameFa: 'صندلی چوبی سنگین',
    properties: ['movable', 'solid', 'breakable'],
    affordances: ['move', 'block', 'inspect', 'damage', 'touch'],
    state: { location: 'scene_table5', durability: 100, isDamaged: false },
    inspectionProfile: {
      defaultObservation: 'صندلی چوبی سنگین بلوطی با پایه‌های محکم روی کف چوبی جا گرفته و خط و خش‌های قدیمی روی دسته‌اش دیده می‌شود.',
    },
  },
  cafe_door: {
    id: 'cafe_door',
    nameFa: 'درِ ورودی شیشه‌ای با لولا و دستگیره برنجی',
    properties: ['solid', 'lockable', 'transparent', 'immovable'],
    affordances: ['move', 'lock', 'block', 'inspect', 'touch', 'use'],
    state: { location: 'scene_entrance', isOpen: false, isLocked: false },
    inspectionProfile: {
      defaultObservation: 'درِ ورودی شیشه‌ای با لولا و دستگیره برنجی، مرز بین سرمای بارانی کوچه و فضای گرم داخلی کافه است.',
    },
  },
  exiting_man: {
    id: 'exiting_man',
    nameFa: 'مرد پالتوپوش با دستکش چرمی قرمز',
    properties: ['living', 'movable', 'wearable'],
    affordances: ['inspect', 'ask', 'follow'],
    state: { location: 'scene_entrance' },
    inspectionProfile: {
      defaultObservation: 'مرد پالتوپوش مکث کوتاهی در آستانهٔ در دارد. دستکش چرمی قرمز دست راستش بیش از حد تمیز است، اما این مشاهده هویت یا قصد او را ثابت نمی‌کند.',
      roleModifiers: {
        investigator: 'کنترل نگاه و ریتم قدم‌هایش تمرین‌شده به نظر می‌رسد؛ اضطراب آشکاری نشان نمی‌دهد.',
        art_historian: 'روی سطح دستکش ذره‌ای رنگ یا گرد کارگاه دیده نمی‌شود؛ تمیزی آن خودش جلب توجه می‌کند.',
      },
      discoveries: [
        {
          id: 'exiting_man_red_glove',
          primitives: ['inspect'],
          observation: 'با دقت دست راستش را می‌بینی: دستکش قرمز بدون چروک روی انگشت‌ها نشسته و هنگام لمس چارچوب هیچ سطحی را با پوست تماس نمی‌دهد.',
          evidenceIds: ['fact_red_glove_man'],
          proofDomain: { domain: 'SOCIAL', points: 1 },
        },
      ],
    },
  },
  table5_cup: {
    id: 'table5_cup',
    nameFa: 'فنجان سرامیکی اسپرسو با لکه و بوی شیمیایی',
    properties: ['movable', 'solid', 'container', 'breakable', 'liquid'],
    affordances: ['inspect', 'smell', 'taste', 'take', 'give', 'damage', 'touch'],
    state: { location: 'scene_table5', contains: ['solvent_liquid'], temperature: 'cold' },
    inspectionProfile: {
      defaultObservation: 'فنجان اسپرسو تقریباً پر و سرد شده است. لبهٔ فنجان تمیز است و نشانه‌ای از نوشیدن روی آن دیده نمی‌شود.',
      roleModifiers: {
        coffee_alchemist: 'از فاصلهٔ نزدیک، زیر رایحهٔ قهوه یک نت تیز و ناآشنا حس می‌کنی؛ برای تشخیصش باید خود مایع را آگاهانه بو کنی.',
        investigator: 'قرار گرفتن دقیق فنجان در مرکز میز بیشتر شبیه یک چیدمان عمدی است تا رها کردن عجولانه.',
      },
      discoveries: [
        {
          id: 'cup_solvent_signature',
          primitives: ['smell'],
          inputPatterns: ['بو|استشمام|استنشاق|رایحه'],
          observation: 'فنجان را بدون چشیدن نزدیک می‌بری. بوی تند و نفتیِ یک حلال فرّار از قهوه جداست؛ این بو متعلق به دم‌آوری یا شویندهٔ معمول دستگاه نیست.',
          roleModifiers: {
            coffee_alchemist: 'لنز حسی تو الگوی بو را به حلال روغنیِ مورد استفاده در کارگاه‌های رنگ و مرمت نزدیک می‌داند؛ هنوز منشأ ورود آن به فنجان اثبات نشده است.',
          },
          evidenceIds: ['fact_solvent_smell_cup'],
          proofDomain: { domain: 'CHEM', points: 2 },
          priority: 20,
        },
      ],
    },
  },
  table5_saucer: {
    id: 'table5_saucer',
    nameFa: 'نعلبکی سرامیکی میز ۵ با رد قرمز براق',
    properties: ['movable', 'solid', 'reflective', 'container'],
    affordances: ['inspect', 'take', 'touch', 'damage', 'use', 'move'],
    state: { location: 'scene_table5', underneath: [] },
    inspectionProfile: {
      defaultObservation: 'نعلبکی سرامیکی سفید رنگ زیر فنجان با لکهٔ قرمزرنگ براقی در حاشیه دیده می‌شود که شبیه رنگ لعاب یا جوهر ضدآب است.',
      discoveries: [
        {
          id: 'saucer_red_stain',
          primitives: ['inspect'],
          observation: 'روی لبهٔ نعلبکی یک رد باریک قرمز و خشک دیده می‌شود. ظاهرش شبیه رژلب است، اما بافت لایه‌مانندش اجازهٔ نتیجه‌گیری قطعی نمی‌دهد.',
          evidenceIds: ['fact_red_stain_saucer'],
          proofDomain: { domain: 'ART', points: 1 },
        },
      ],
    },
  },
  table5_menu: {
    id: 'table5_menu',
    nameFa: 'پایه منوی مقوایی رومیزی',
    properties: ['movable', 'readable', 'flammable'],
    affordances: ['inspect', 'take', 'damage', 'touch', 'move', 'use'],
    state: { location: 'scene_table5', underneath: [] },
    inspectionProfile: {
      defaultObservation: 'پایه منوی مقوایی رومیزی لیست نوشیدنی‌ها را نشان می‌دهد. در حاشیهٔ پایین آن با خودکار آبی شماره‌ای کم‌رنگ یادداشت شده است.',
    },
  },
  wet_receipt: {
    id: 'wet_receipt',
    nameFa: 'رسید کاغذی نم‌کشیده با مهر چهارگوش کارگاهی',
    properties: ['movable', 'readable', 'flammable'],
    affordances: ['inspect', 'take', 'hide', 'give', 'damage', 'touch'],
    state: { location: 'scene_entrance', isWet: true, isTorn: false },
    inspectionProfile: {
      defaultObservation: 'رسید نم‌کشیده روی سنگ‌فرش افتاده؛ بخشی از چاپ حرارتی آن پخش شده و گوشه‌ای از کاغذ لکهٔ جوهر دارد.',
      discoveries: [
        {
          id: 'receipt_recovered',
          primitives: ['inspect', 'take'],
          observation: 'روی سنگ‌فرش خم می‌شوی و رسید نم‌کشیده را از نزدیک می‌بینی. فیش به سفارش میز ۵ مربوط است، اما جزئیات چاپ هنوز به دقت بیشتری نیاز دارد.',
          evidenceIds: ['fact_wet_receipt'],
          priority: 5,
        },
        {
          id: 'receipt_timestamp',
          primitives: ['inspect'],
          inputPatterns: ['ساعت|زمان|تاریخ|نوشته|متن|بخوان|دقیق|فیش'],
          requiresDiscoveries: ['receipt_recovered'],
          observation: 'بخش سالم چاپ را زیر نور می‌گیری: زمان روی رسید «۰۰:۱۷» و شمارهٔ میز «۵» است. این فقط زمان چاپ رسید را ثابت می‌کند، نه زمان ثبت سفارش در صندوق.',
          evidenceIds: ['fact_time_0017'],
          proofDomain: { domain: 'SYS', points: 1 },
          priority: 20,
        },
      ],
    },
  },
  central_painting: {
    id: 'central_painting',
    nameFa: 'تابلوی نقاشی رنگ روغن پنتیمنتو روی دیوار اصلی',
    properties: ['immovable', 'solid', 'readable', 'layered'],
    affordances: ['inspect', 'touch', 'damage'],
    state: { location: 'scene_gallery', customAttributes: { hiddenLayerRevealed: false } },
    inspectionProfile: {
      defaultObservation: 'در نور مستقیم سالن، تابلوی رنگ‌روغن یکدست و مرمت‌شده به نظر می‌رسد؛ از نگاه کلی چیزی پشت لایهٔ فعلی اثبات نمی‌شود.',
      roleModifiers: {
        art_historian: 'جهت ترک‌های ریزِ ورنی با چند خط اصلی تصویر هم‌خوان نیست. این فقط یک ناهنجاری سطحی است؛ نور مایل می‌تواند آن را روشن‌تر کند.',
      },
      discoveries: [
        {
          id: 'painting_surface_anomaly',
          primitives: ['inspect'],
          inputPatterns: ['سطح|بافت|ترک|نزدیک|ورنی|رنگ'],
          observation: 'از نزدیک، ناهمواری‌های ظریفی زیر ورنی می‌بینی که با ضربه‌قلم‌های تصویر رویی هم‌جهت نیستند. هنوز نمی‌توان شکل یا قدمت لایهٔ زیرین را تعیین کرد.',
          roleModifiers: {
            art_historian: 'الگوی ترک‌ها با یک مرمت ساده جور نیست و احتمال تغییر ترکیب‌بندی پیشین را بالا می‌برد.',
          },
          evidenceIds: ['fact_painting_surface_anomaly'],
          proofDomain: { domain: 'ART', points: 1 },
          priority: 10,
        },
        {
          id: 'painting_underlayer',
          primitives: ['inspect'],
          inputPatterns: ['نور.*(زاویه|مایل|مورب|گوشی)|زاویه.*نور|از کنار|لایه|زیر.*رنگ'],
          observation: 'نور را مایل روی سطح می‌چرخانی. یک خطِ مدفون و بخشی از قاب پنجره زیر رنگ فعلی ظاهر می‌شود: نشانهٔ روشنِ یک ترکیب‌بندی قدیمی‌تر، نه اثبات هویت سازنده یا معنای آن.',
          roleModifiers: {
            art_historian: 'با خواندن جهت زیرسازی تشخیص می‌دهی که این تغییر در مرحلهٔ نقاشی رخ داده، نه در مرمت معاصر؛ یک Pentimento واقعی است.',
          },
          evidenceIds: ['fact_underpainting_hidden_layer', 'fact_painting_window_reflection'],
          proofDomain: { domain: 'ART', points: 2 },
          priority: 30,
        },
      ],
    },
  },
  painting_back_label: {
    id: 'painting_back_label',
    nameFa: 'برچسب مالکیت کهنه و نیمه‌کندهٔ پشت بوم',
    properties: ['readable', 'immovable', 'flammable'],
    affordances: ['inspect', 'touch'],
    state: { location: 'scene_painting_back', isTorn: true },
    inspectionProfile: {
      defaultObservation: 'برچسب قدیمی آسیب دیده و فقط چند خط و عدد زیر گردوغبار و پارگی باقی مانده است.',
      roleModifiers: {
        art_historian: 'نوع کاغذ و چسب با برچسب‌های مالکیت قدیمی سازگار است، اما معنا و ترتیب اعداد هنوز باید از خود نوشته خوانده شود.',
      },
      discoveries: [
        {
          id: 'label_numbers',
          primitives: ['inspect'],
          inputPatterns: ['برچسب|عدد|نوشته|متن|بخوان|گرد.*خاک|نور'],
          observation: 'گردوغبار را بدون کندن کاغذ کنار می‌زنی. تنها توالی سالم روی برچسب این است: «14 / 3 / 7 / 55». این اعداد ثبت می‌شوند، اما معنایشان هنوز باز است.',
          evidenceIds: ['fact_label_numbers_14_3_7_55'],
          proofDomain: { domain: 'ART', points: 2 },
          priority: 20,
        },
        {
          id: 'label_transfer_trace',
          primitives: ['inspect'],
          inputPatterns: ['جوهر|قدمت|زنجیره|انتقال|مالک|توالی|اصالت'],
          requiresEvidence: ['fact_label_numbers_14_3_7_55'],
          observation: 'تفاوت جوهر و فاصله‌گذاری اعداد نشان می‌دهد توالی در چند نوبت نوشته شده است؛ بیشتر به ردّ انتقال مالکیت می‌ماند تا یک رمز یک‌مرحله‌ای.',
          evidenceIds: ['fact_label_transfer_trace'],
          proofDomain: { domain: 'ART', points: 2 },
          priority: 35,
        },
      ],
    },
  },
  lights_switch: {
    id: 'lights_switch',
    nameFa: 'کلید برق و فیوز روشنایی سالن',
    properties: ['electrical', 'immovable', 'solid'],
    affordances: ['use', 'inspect', 'touch'],
    state: { location: 'scene_table5', isOn: true },
    inspectionProfile: {
      defaultObservation: 'کلید برق و فیوز روشنایی سالن روی دیوار قرار دارد و تمام چراغ‌های هالوژن و سقفی از این پنل تغذیه می‌شوند.',
    },
  },
  pos_terminal: {
    id: 'pos_terminal',
    nameFa: 'دستگاه پوز و مانیتور ثبت سفارش‌های صندوق',
    properties: ['electronic', 'immovable', 'readable'],
    affordances: ['inspect', 'touch', 'use'],
    state: { location: 'scene_counter', isOn: true },
    inspectionProfile: {
      defaultObservation: 'دستگاه پوز روشن است و صفحهٔ عادی صندوق را نشان می‌دهد. مشاهدهٔ خود دستگاه هیچ تناقض زمانی را ثابت نمی‌کند؛ باید گزارش سفارش‌ها را باز کنی.',
      roleModifiers: {
        systems_analyst: 'می‌دانی زمان چاپ رسید و زمان ثبت تراکنش دو فیلد مستقل‌اند؛ گزارش تراکنش نقدی همان چیزی است که باید بررسی شود.',
      },
      discoveries: [
        {
          id: 'pos_table5_entry',
          primitives: ['inspect', 'use'],
          inputPatterns: ['لاگ|گزارش|ثبت.*سفارش|سفارش.*۵|میز.*۵|تراکنش|صندوق|ساعت|زمان'],
          observation: 'در گزارش سفارش‌ها، میز ۵ در ساعت «۰۰:۱۱» با پرداخت نقدی ثبت شده است. این داده فعلاً فقط زمان ثبت سفارش در صندوق را نشان می‌دهد.',
          evidenceIds: ['fact_pos_order_timestamp'],
          proofDomain: { domain: 'SYS', points: 1 },
          priority: 20,
        },
        {
          id: 'pos_receipt_crosscheck',
          primitives: ['inspect', 'use'],
          inputPatterns: ['مقایسه|تطبیق|تناقض|رسید|ساعت|زمان|لاگ'],
          requiresEvidence: ['fact_pos_order_timestamp', 'fact_time_0017'],
          observation: 'دو زمان را کنار هم می‌گذاری: ثبت نقدی سفارش در «۰۰:۱۱» و چاپ رسید در «۰۰:۱۷». فاصلهٔ شش‌دقیقه‌ای واقعی است، اما علتش هنوز از این دو رکورد به‌تنهایی معلوم نیست.',
          evidenceIds: ['fact_pos_receipt_time_gap'],
          proofDomain: { domain: 'SYS', points: 2 },
          priority: 40,
        },
      ],
    },
  },
  cctv_system: {
    id: 'cctv_system',
    nameFa: 'سامانه مانیتورینگ دوربین‌های مداربسته',
    properties: ['electronic', 'immovable', 'readable'],
    affordances: ['inspect', 'use'],
    state: { location: 'scene_cctv', isOn: true },
    inspectionProfile: {
      defaultObservation: 'مانیتور دوربین‌ها چهار نمای زنده از کوچه، ورودی، بار و انتهای سالن را نشان می‌دهد. تصویر زنده به‌تنهایی چیزی دربارهٔ ضبط گذشته ثابت نمی‌کند.',
      roleModifiers: {
        systems_analyst: 'نمای زنده و فایل ضبط‌شده دو مسیر جدا دارند؛ برای یافتن دستکاری باید رویدادهای نوشتن روی دیسک را ببینی.',
      },
      discoveries: [
        {
          id: 'cctv_timeline_gap',
          primitives: ['inspect', 'use'],
          inputPatterns: ['لاگ|تایم.*لاین|زمان|ضبط|فایل|آرشیو|هفت|7'],
          observation: 'در خط زمانی ضبط، میان ۰۰:۱۱ و ۰۰:۱۷ یک بازهٔ بدون تصویر دیده می‌شود. این فعلاً یک شکاف در خروجی است، نه اثبات حذف عمدی.',
          evidenceIds: ['fact_camera_time_gap'],
          proofDomain: { domain: 'SYS', points: 1 },
          priority: 20,
        },
        {
          id: 'cctv_missing_write_event',
          primitives: ['inspect', 'use'],
          inputPatterns: ['نوشتن|write|دیسک|هارد|رویداد|بافر|حذف|ثبت.*نشده'],
          requiresEvidence: ['fact_camera_time_gap'],
          observation: 'رویدادهای ذخیره‌سازی را با خط زمانی تطبیق می‌دهی: در بازهٔ خالی هیچ رخداد نوشتنی ثبت نشده است. تصویر بعداً پاک نشده؛ از ابتدا روی دیسک نوشته نشده بود.',
          evidenceIds: ['fact_footage_was_never_written'],
          proofDomain: { domain: 'SYS', points: 2 },
          priority: 40,
        },
      ],
    },
  },
  cash_drawer: {
    id: 'cash_drawer',
    nameFa: 'کشوی قفل‌دار صندوق و انبار دخل',
    properties: ['solid', 'lockable', 'immovable'],
    affordances: ['inspect', 'lock', 'touch'],
    state: { location: 'scene_counter', isLocked: true },
    inspectionProfile: {
      defaultObservation: 'کشوی چوبی دخل زیر پیشخوان با یک قفل برنجی بسته شده و بدون کلید باز نمی‌شود.',
    },
  },
  espresso_machine: {
    id: 'espresso_machine',
    nameFa: 'دستگاه اسپرسوساز صنعتی دو گروپ',
    properties: ['solid', 'electrical', 'hot', 'immovable'],
    affordances: ['inspect', 'touch', 'use'],
    state: { location: 'scene_counter', isOn: true, temperature: 'hot' },
    inspectionProfile: {
      defaultObservation: 'دستگاه اسپرسوساز صنعتی دو گروپ با بدنهٔ استیل صیقلی گرم است و عقربهٔ فشار بخار آن روی عدد ۱.۲ بار ثابت مانده است.',
    },
  },
  steam_wand: {
    id: 'steam_wand',
    nameFa: 'نازل بخار دستگاه با جرم و رسوب شوینده',
    properties: ['hot', 'immovable', 'solid'],
    affordances: ['inspect', 'touch', 'use'],
    state: { location: 'scene_counter', temperature: 'hot' },
    inspectionProfile: {
      defaultObservation: 'نازل بخار دستگاه با لایه‌ای نازک از رسوب شویندهٔ صنعتی پوشانده شده و بوی ملایم اسید سیتریک از آن به مشام می‌رسد.',
    },
  },
  window_glass: {
    id: 'window_glass',
    nameFa: 'شیشه پنجره قدی رو به کوچه حسینی',
    properties: ['solid', 'transparent', 'reflective', 'immovable'],
    affordances: ['inspect', 'touch'],
    state: { location: 'scene_table5' },
    inspectionProfile: {
      defaultObservation: 'قطره‌های باران روی شیشهٔ قدی راه افتاده‌اند و بازتاب چراغ‌های داخل، دیدن کوچه را دشوار می‌کند.',
      discoveries: [
        {
          id: 'window_parked_car',
          primitives: ['inspect'],
          inputPatterns: ['بیرون|کوچه|پشت.*شیشه|ماشین|خودرو|تاریکی|آن طرف'],
          observation: 'با دست جلوی بازتاب نور داخل را می‌گیری. آن سوی شیشه، خودرویی خاموش در حاشیهٔ کوچه ایستاده است؛ حضورش قطعی است، اما از این فاصله نمی‌توان قصد سرنشین یا ارتباطش با پرونده را نتیجه گرفت.',
          evidenceIds: ['fact_parked_car_sighting'],
          proofDomain: { domain: 'SYS', points: 1 },
          priority: 20,
        },
      ],
    },
  },
  curtain: {
    id: 'curtain',
    nameFa: 'پرده ضخیم مخمل پنجره',
    properties: ['movable', 'flammable'],
    affordances: ['move', 'inspect', 'touch', 'use'],
    state: { location: 'scene_table5', isOpen: true },
    inspectionProfile: {
      defaultObservation: 'پرده ضخیم مخمل پنجره به یک سو کشیده شده و قطرات باران روی لبهٔ زیرین پارچه نم انداخته است.',
    },
  },
  smartphone: {
    id: 'smartphone',
    nameFa: 'گوشی هوشمند شخصی با ضبط صوت و دوربین',
    properties: ['electronic', 'acoustic', 'movable'],
    affordances: ['record', 'inspect', 'use', 'take', 'hide'],
    state: { location: 'in_pocket', isOn: true },
    inspectionProfile: {
      defaultObservation: 'گوشی هوشمند در جیبت با پیام‌های صوتی سالار و ضبط صوت فعال آمادهٔ ثبت رویدادها است.',
    },
  },
  barista_counter: {
    id: 'barista_counter',
    nameFa: 'پیشخوان چوبی صیقلی بار',
    properties: ['solid', 'immovable', 'heavy'],
    affordances: ['inspect', 'touch', 'use'],
    state: { location: 'scene_counter' },
    inspectionProfile: {
      defaultObservation: 'پیشخوان چوبی صیقلی کافه زیر نور ملایم چراغ‌های آویز تمیز به نظر می‌رسد و لکه‌ای از بخار اسپرسو روی چوب بلوط آن دیده می‌شود.',
    },
  },
  office_ledger: {
    id: 'office_ledger',
    nameFa: 'زونکن خاکستری اسناد مالی و فاکتورهای پلاک ۵۵',
    properties: ['readable', 'movable', 'flammable'],
    affordances: ['inspect', 'take', 'touch'],
    state: { location: 'scene_office' },
    inspectionProfile: {
      defaultObservation: 'زونکن‌های مالی منظم‌اند. در زونکن خاکستری، یک کاور پلاستیکی برخلاف بقیه تازه جابه‌جا شده، اما از ورق‌زدن کلی سند مشخصی اثبات نمی‌شود.',
      roleModifiers: {
        systems_analyst: 'ترتیب شماره‌گذاری کاورها یک پرش دارد؛ جست‌وجوی «۵۵» یا «R.G.» می‌تواند سند جابه‌جا‌شده را پیدا کند.',
        art_historian: 'روی لبهٔ یک برگه اثر فشاریِ مهر دیده می‌شود، اما نقش آن از داخل کاور خوانا نیست.',
      },
      discoveries: [
        {
          id: 'ledger_lot55_invoice',
          primitives: ['inspect'],
          inputPatterns: ['۵۵|55|R\\.?G|آر\\.?جی|فاکتور|برگه.*خاص|جست.*سند|کاور'],
          observation: 'با جست‌وجوی زونکن، برگه‌ای با متن «R.G. / Lot 55 / Returned» پیدا می‌کنی. متن سند ثبت می‌شود، اما اصالت یا علت بازگشت آن هنوز معلوم نیست.',
          evidenceIds: ['fact_invoice_text_rg_lot55_returned'],
          proofDomain: { domain: 'SYS', points: 1 },
          priority: 20,
        },
        {
          id: 'ledger_font_mismatch',
          primitives: ['inspect'],
          inputPatterns: ['مقایسه|فونت|چاپ|قلم|سربرگ|اصالت|جعل'],
          requiresEvidence: ['fact_invoice_text_rg_lot55_returned'],
          observation: 'فاکتور Lot 55 را با سه سند همان دوره کنار هم می‌گذاری. فونت، فاصلهٔ حروف و محل شماره سریال با قالب رسمی کافه نمی‌خواند؛ سند به احتمال قوی خارج از روال عادی تولید شده است.',
          evidenceIds: ['fact_invoice_font_differs_from_others'],
          proofDomain: { domain: 'SYS', points: 2 },
          priority: 35,
        },
        {
          id: 'ledger_workshop_seal',
          primitives: ['inspect'],
          inputPatterns: ['مهر|نماد|علامت|اثر.*فشار|حاشیه'],
          requiresEvidence: ['fact_invoice_text_rg_lot55_returned'],
          observation: 'نور را روی اثر فشاری حاشیه می‌چرخانی. چهار نقش جدا—دست، پنجره، فنجان و سایه—در مهر دیده می‌شود. این تطابق را ثبت می‌کنی، بی‌آنکه معنای تاریخی‌اش را از پیش فرض بگیری.',
          evidenceIds: ['fact_invoice_lot55_seal'],
          proofDomain: { domain: 'ART', points: 1 },
          priority: 30,
        },
        {
          id: 'ledger_forgery_conclusion',
          primitives: ['inspect'],
          inputPatterns: ['نتیجه|جمع.*بند|جعل|ساختگی|اصالت'],
          requiresEvidence: ['fact_invoice_text_rg_lot55_returned', 'fact_invoice_font_differs_from_others'],
          observation: 'متن، قالب و ردّ چاپ را کنار هم می‌گذاری: این برگه یک سند اداری عادی نیست و شواهد فنی برای جعلی‌بودنش کافی است. انگیزه و سازنده هنوز مجهول‌اند.',
          evidenceIds: ['fact_invoice_is_forged'],
          proofDomain: { domain: 'SYS', points: 2 },
          priority: 50,
        },
      ],
    },
  },
  cat_penti: {
    id: 'cat_penti',
    nameFa: 'پنتی (بچه‌گربه ملوس کافه)',
    properties: ['living', 'movable'],
    affordances: ['inspect', 'touch', 'protect'],
    state: { location: 'scene_table5', customAttributes: { isAgitated: true } },
    inspectionProfile: {
      defaultObservation: 'پنتی زیر صندلی کز کرده، گوش‌هایش عقب رفته و از میز پنج و فنجان قهوه فاصله نگه داشته است.',
      discoveries: [
        {
          id: 'penti_agitation',
          primitives: ['inspect'],
          observation: 'پنتی گوش‌هایش را عقب نگه داشته و از محدودهٔ میز ۵ فاصله می‌گیرد. این رفتار غیرعادی است، اما علتش از مشاهدهٔ تنها معلوم نیست.',
          evidenceIds: ['fact_penti_agitation'],
          proofDomain: { domain: 'SOCIAL', points: 1 },
        },
      ],
    },
  },
};

export const LOCATION_REGISTRY: Record<string, LocationDefinition> = {
  scene_entrance: {
    id: 'scene_entrance',
    nameFa: 'کوچه حسینی و ورودی کافه',
    sceneId: 'scene_entrance',
    nodeId: 'NODE_01',
    reachableFrom: ['scene_table5', 'scene_hosseini_alley'],
    defaultDescription: 'روبروی در ورودی کافه در کوچهٔ حسینی می‌ایستی. نم‌نم باران روی سنگ‌فرش می‌نشیند و نور زرد از پنجره کافه به بیرون می‌تابد.',
    activeEntityIds: ['exiting_man'],
    visibleObjectIds: ['cafe_door', 'wet_receipt', 'exiting_man'],
  },
  scene_table5: {
    id: 'scene_table5',
    nameFa: 'میز شماره ۵ و سالن اصلی',
    sceneId: 'scene_table5',
    nodeId: 'NODE_02',
    reachableFrom: ['scene_entrance', 'scene_counter', 'scene_gallery', 'scene_office'],
    defaultDescription: 'کنار میز شماره ۵ می‌ایستی. فنجان رهاشده روی میز و حانیه در کنار آن حضور دارند و پنتی زیر صندلی کز کرده است.',
    activeEntityIds: ['haniyeh', 'cat_penti'],
    visibleObjectIds: ['table5_cup', 'table5_saucer', 'table5_menu', 'wooden_chair', 'window_glass', 'curtain', 'lights_switch'],
  },
  scene_counter: {
    id: 'scene_counter',
    nameFa: 'پیشخوان و کانتر باریستا',
    sceneId: 'scene_counter',
    nodeId: 'NODE_03',
    reachableFrom: ['scene_table5', 'scene_gallery', 'scene_office', 'scene_cctv'],
    defaultDescription: 'کنار پیشخوان چوبی صیقلی کافه می‌ایستی. یاشین با پیراهن آراسته و مانی پشت دستگاه اسپرسو متوجه حضورت می‌شوند.',
    activeEntityIds: ['yashin', 'mani'],
    visibleObjectIds: ['barista_counter', 'pos_terminal', 'espresso_machine', 'steam_wand', 'cash_drawer'],
  },
  scene_gallery: {
    id: 'scene_gallery',
    nameFa: 'دیوار گالری و تابلوی پنتیمنتو',
    sceneId: 'scene_gallery',
    nodeId: 'NODE_06',
    reachableFrom: ['scene_table5', 'scene_counter', 'scene_office', 'scene_storage', 'scene_painting_back'],
    defaultDescription: 'به سمت انتهای سالن و دیوار گالری حرکت می‌کنی. تابلوی نقاشی پنتیمنتو در پرتو ملایم هالوژن‌های دیواری در برابرت قرار می‌گیرد.',
    activeEntityIds: [],
    visibleObjectIds: ['central_painting'],
  },
  scene_painting_back: {
    id: 'scene_painting_back',
    nameFa: 'پشت قاب تابلوی پنتیمنتو',
    sceneId: 'scene_painting_back',
    nodeId: 'NODE_07',
    reachableFrom: ['scene_gallery'],
    defaultDescription: 'قاب را با احتیاط از دیوار فاصله داده‌ای. پشت بوم و برچسب مالکیت نیمه‌کنده در برابر توست.',
    activeEntityIds: [],
    visibleObjectIds: ['painting_back_label'],
  },
  scene_office: {
    id: 'scene_office',
    nameFa: 'اتاق مدیریت و حسابداری',
    sceneId: 'scene_office',
    nodeId: 'NODE_11',
    reachableFrom: ['scene_table5', 'scene_counter', 'scene_gallery', 'scene_cctv'],
    defaultDescription: 'وارد اتاق حسابداری می‌شوی. سالار صالحی پشت میز کار چوبی نشسته و با چهره‌ای مضطرب اسناد را وارسی می‌کند.',
    activeEntityIds: ['salar'],
    visibleObjectIds: ['office_ledger'],
  },
  scene_storage: {
    id: 'scene_storage',
    nameFa: 'انبار کارتن‌ها و بسته‌بندی',
    sceneId: 'scene_storage',
    nodeId: 'NODE_08',
    reachableFrom: ['scene_gallery', 'scene_counter'],
    defaultDescription: 'وارد انبار کارتن‌ها و بسته‌های بسته‌بندی در انتهای راهرو می‌شوی.',
    activeEntityIds: [],
    visibleObjectIds: [],
  },
  scene_cctv: {
    id: 'scene_cctv',
    nameFa: 'بخش مانیتورینگ و دوربین‌ها',
    sceneId: 'scene_cctv',
    nodeId: 'NODE_12',
    reachableFrom: ['scene_office', 'scene_counter'],
    defaultDescription: 'به سمت سیستم مانیتورینگ دوربین‌های مداربسته می‌روی. مانیتورها تصاویر کوچه و سالن را نمایش می‌دهند.',
    activeEntityIds: [],
    visibleObjectIds: ['cctv_system'],
  },
  scene_hosseini_alley: {
    id: 'scene_hosseini_alley',
    nameFa: 'تاریکی کوچه حسینی',
    sceneId: 'scene_hosseini_alley',
    nodeId: 'NODE_13',
    reachableFrom: ['scene_entrance'],
    defaultDescription: 'قدم به تاریکی و سرمای کوچهٔ حسینی می‌گذاری. صدای چک‌چک ناودان‌ها در سکوت کوچه طنین‌انداز است.',
    activeEntityIds: [],
    visibleObjectIds: [],
  },
  scene_collector_meeting: {
    id: 'scene_collector_meeting',
    nameFa: 'میز ملاقات با نمایندهٔ خریدار پلاک ۵۵',
    sceneId: 'scene_collector_meeting',
    nodeId: 'NODE_16',
    reachableFrom: ['scene_table5', 'scene_office', 'scene_gallery', 'scene_counter'],
    defaultDescription: 'خط امن نمایندهٔ خریدار پلاک ۵۵ روی گوشی سالار باز است و میز انتهای سالن برای ملاقات آماده شده. می‌توانی زود و با دست خالی وارد مذاکره شوی، بلوف بزنی، معامله کنی یا صبر کنی؛ مقدار اهرمت نتیجه و بهای گفت‌وگو را تغییر می‌دهد.',
    activeEntityIds: ['collector', 'salar'],
    visibleObjectIds: [],
  },
  scene_archive: {
    id: 'scene_archive',
    nameFa: 'میز آرشیو و سنتز شواهد',
    sceneId: 'scene_archive',
    nodeId: 'NODE_17',
    reachableFrom: ['scene_collector_meeting', 'scene_office', 'scene_table5'],
    defaultDescription: 'هرچه واقعاً به دست آورده‌ای روی میز آرشیو می‌چینی. می‌توانی همین حالا یک نظریهٔ ناقص را امتحان کنی، چیزی را عمداً حذف کنی، شاهدی را وارد جمع‌بندی کنی یا برای مدرک تازه برگردی؛ میز آرشیو جواب ازپیش‌ساخته‌ای تحویلت نمی‌دهد.',
    activeEntityIds: ['salar'],
    visibleObjectIds: [],
  },
  scene_underpainting: {
    id: 'scene_underpainting',
    nameFa: 'لایه‌های زیرین و جمع‌بندی نهایی تابلو',
    sceneId: 'scene_underpainting',
    nodeId: 'NODE_18',
    reachableFrom: ['scene_archive', 'scene_gallery'],
    defaultDescription: 'کنار لایهٔ زیرین تابلو می‌ایستی. می‌توانی زود نتیجه‌گیری کنی، آزمایش کم‌خطر بسازی، لایه را پنهان یا قربانی کنی، یا با شواهد بیشتر برگردی؛ هر انتخاب بخشی از حقیقت و بخشی از آدم‌ها را حفظ می‌کند.',
    activeEntityIds: ['salar', 'haniyeh', 'mani', 'yashin'],
    visibleObjectIds: ['central_painting', 'painting_back_label'],
  },
};

export function createInitialWorldObjects(): Record<string, WorldObject> {
  return JSON.parse(JSON.stringify(INITIAL_WORLD_OBJECTS));
}

export function findWorldObject(keyword: string, objects: Record<string, WorldObject>): WorldObject | undefined {
  const norm = keyword.trim().toLowerCase();
  if (!norm) return undefined;
  for (const obj of Object.values(objects)) {
    if (obj.id.toLowerCase() === norm || obj.nameFa.includes(norm)) {
      return obj;
    }
  }
  // Specific and ordered keyword mappings
  if (/مرد.*(پالتو|دستکش|خروج)|پالتوپوش|پالتوش|دست(?:‌|\s*)هاش|دستکش(?:ش|.*قرمز)/.test(norm)) return objects.exiting_man;
  if (/زونکن|اسناد|سند|مدارک|دفتر.*حسابداری|دفتر.*مالی|فاکتور.*سالار|فاکتور.*پلاک|فاکتور/.test(norm)) return objects.office_ledger;
  if (/برچسب.*(پشت|مالکیت)|اعداد.*(برچسب|تابلو)|label/.test(norm)) return objects.painting_back_label;
  if (/پنتی|گربه|بچه‌گربه/.test(norm)) return objects.cat_penti;
  if (/تابلو|نقاشی|بوم|رنگ.*روغن|پنتیمنتو/.test(norm)) return objects.central_painting;
  // Specific machinery must be resolved before the generic "espresso" token
  // used for the cup, otherwise "espresso machine" targets the cup.
  if (/دستگاه.*اسپرسو|اسپرسوساز/.test(norm)) return objects.espresso_machine;
  if (/فنجان|فنجون|اسپرسو|مایع.*فنجان/.test(norm) || hasStandaloneLexeme(norm, 'کاپ')) return objects.table5_cup;
  if (/نعلبکی|زیر.*فنجان/.test(norm)) return objects.table5_saucer;
  if (/پایه.*منو|منوی/.test(norm) || hasStandaloneLexeme(norm, 'منو')) return objects.table5_menu;
  if (/پوز|مانیتور.*پوز|لاگ|ثبت.*سفارش/.test(norm)) return objects.pos_terminal;
  if (hasStandaloneLexeme(norm, 'رسید') || /فیش|کاغذ.*خیس|برگه.*خیس|نم‌کشیده|کف.*(?:پیاده‌رو|ورودی)|سنگ‌?فرش/.test(norm)) return objects.wet_receipt;
  if (/دوربین|cctv|مانیتور.*دوربین/.test(norm)) return objects.cctv_system;
  if (/نازل|لوله.*بخار/.test(norm)) return objects.steam_wand;
  if (/کانتر|پیشخوان|میز.*بار/.test(norm)) return objects.barista_counter;
  if (/صندلی|نیمکت/.test(norm)) return objects.wooden_chair;
  if (hasStandaloneLexeme(norm, 'در') || /لنگه|ورودی|دستگیره/.test(norm)) return objects.cafe_door;
  if (/پنجره|شیشه/.test(norm)) return objects.window_glass;
  if (/پرده/.test(norm)) return objects.curtain;
  if (/کلید.*برق|چراغ|فیوز|نور|روشنایی|لامپ/.test(norm)) return objects.lights_switch;
  if (/کشو|قفل.*کشو|دخل/.test(norm)) return objects.cash_drawer;
  if (/موبایل|گوشی|ضبط/.test(norm)) return objects.smartphone;
  return undefined;
}

export function findLocation(keyword: string): LocationDefinition | undefined {
  const norm = keyword.trim().toLowerCase();
  for (const loc of Object.values(LOCATION_REGISTRY)) {
    if (loc.id === norm || loc.sceneId === norm || loc.nameFa.includes(norm)) {
      return loc;
    }
  }
  // Directional phrases take precedence over object aliases.  In particular,
  // "enter the cafe" must not resolve back to the entrance merely because the
  // semantic target is the door handle.
  if (/وارد.*(کافه|سالن)|داخل.*(کافه|سالن)|(?:می‌?ر(?:م|وم)|میرم|برم|می‌?آم|میام).*?(?:تو|داخل).*?(?:کافه|سالن)|پا.*(کافه|سالن)|گرمای.*سالن/.test(norm)) return LOCATION_REGISTRY.scene_table5;
  if (/(?:از\s+کافه\s+خارج|خارج\s+(?:از\s+)?کافه|بیرون\s+(?:از\s+)?کافه)|برگرد.*کوچه|سمت.*کوچه/.test(norm)) return LOCATION_REGISTRY.scene_entrance;
  if (/پشت.*(تابلو|بوم|قاب)|painting.*back|back.*label/.test(norm)) return LOCATION_REGISTRY.scene_painting_back;
  if (/gallery|painting|central_painting|گالری|دیوار.*گالری|تابلو|نقاشی/.test(norm)) return LOCATION_REGISTRY.scene_gallery;
  if (/office|salar|دفتر|حسابداری|اتاق.*سالار|مدیریت/.test(norm)) return LOCATION_REGISTRY.scene_office;
  if (/counter|barista|yashin|mani|کانتر|پیشخوان|بار|پیش.*یاشین|پیش.*مانی/.test(norm)) return LOCATION_REGISTRY.scene_counter;
  if (/table5|wooden_chair|table5_cup|table5_saucer|میز\s*۵|میز\s*پنج|سالن/.test(norm)) return LOCATION_REGISTRY.scene_table5;
  if (/storage|انبار|کارتن/.test(norm)) return LOCATION_REGISTRY.scene_storage;
  if (/cctv|دوربین|مانیتورینگ|حراست/.test(norm)) return LOCATION_REGISTRY.scene_cctv;
  if (/hosseini|کوچه.*حسینی|تاریکی.*کوچه/.test(norm)) return LOCATION_REGISTRY.scene_hosseini_alley;
  if (/collector|کلکسیونر|نماینده.*خریدار|ملاقات.*خریدار|جلسه.*پلاک/.test(norm)) return LOCATION_REGISTRY.scene_collector_meeting;
  if (/archive|آرشیو|میز.*شواهد|سنتز.*شواهد/.test(norm)) return LOCATION_REGISTRY.scene_archive;
  if (/underpainting|لایه.*نهایی|جمع.*بندی.*تابلو|افشای.*تاریخی/.test(norm)) return LOCATION_REGISTRY.scene_underpainting;
  if (/entrance|door|cafe_door|ورودی|کوچه|بیرون/.test(norm) || hasStandaloneLexeme(norm, 'در')) {
    return LOCATION_REGISTRY.scene_entrance;
  }
  return undefined;
}

export function isLocationReachable(fromScene: string, targetScene: string): boolean {
  const from = fromScene === 'scene_table_5' ? 'scene_table5' : fromScene;
  const target = targetScene === 'scene_table_5' ? 'scene_table5' : targetScene;
  if (from === target) return true;
  const targetLoc = LOCATION_REGISTRY[target];
  if (!targetLoc) return false;
  return targetLoc.reachableFrom.includes(from);
}

export function isLocationUnlocked(location: LocationDefinition, state: import('./types.js').RunState): boolean {
  return (location.requiresEvidence ?? []).every(id =>
    state.canonical.evidenceIds.includes(id) || state.scene.establishedFactIds.includes(id)
  );
}

/**
 * Migrates legacy/test states that changed only currentNode and left scene
 * identifiers at scene_intro or at a scene owned by another node.
 */
export function synchronizeSceneRuntime(state: import('./types.js').RunState): void {
  const applySituationOccupancy = () => {
    const intentions = Object.values(state.situation?.npcIntentions ?? {})
      .filter(intention => intention.status === 'changed' || intention.stage >= 3);
    for (const intention of intentions) {
      // The collector-meeting scene also represents the already-open secure
      // phone line; extraction changes his physical location, not reachability.
      if (intention.npcId === 'collector' && state.canonical.currentScene === 'scene_collector_meeting') {
        if (!state.scene.activeEntityIds.includes('collector')) state.scene.activeEntityIds.push('collector');
        continue;
      }
      state.scene.activeEntityIds = state.scene.activeEntityIds.filter(id => id !== intention.npcId);
      if (intention.location === state.canonical.currentScene && !state.scene.activeEntityIds.includes(intention.npcId)) {
        state.scene.activeEntityIds.push(intention.npcId);
      }
    }
  };

  const location = Object.values(LOCATION_REGISTRY).find(loc => loc.nodeId === state.canonical.currentNode);
  if (!location) return;

  const currentScene = state.canonical.currentScene === 'scene_table_5'
    ? 'scene_table5'
    : state.canonical.currentScene;
  const currentLocation = LOCATION_REGISTRY[currentScene];
  if (currentLocation?.nodeId === state.canonical.currentNode) {
    applySituationOccupancy();
    return;
  }

  state.canonical.currentScene = location.sceneId;
  state.scene.sceneId = location.sceneId;
  state.scene.nodeId = location.nodeId;
  state.scene.activeEntityIds = [...(location.activeEntityIds ?? [])];
  state.scene.visibleObjectIds = [...(location.visibleObjectIds ?? [])];
  applySituationOccupancy();
}

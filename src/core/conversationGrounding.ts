import type { PlayerClassId, RunState } from './types.js';
import { LOCATION_REGISTRY } from './worldAffordances.js';

const PERSIAN_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;

export type ConversationalIntent =
  | 'scene_overview'
  | 'scene_peek'
  | 'scene_listen'
  | 'situation_recap';

export interface PlayerIdentityInterpretation {
  role: PlayerClassId;
  rawStatement: string;
  relationshipBased: boolean;
}

export function normalizeConversationalPersian(value: string): string {
  return value
    .normalize('NFKC')
    .replace(PERSIAN_DIACRITICS, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function classifyConversationalIntent(input: string): ConversationalIntent | undefined {
  const norm = normalizeConversationalPersian(input);
  if (!norm) return undefined;

  if (
    /(?:چی|چه)\s*(?:شده|خبره|اتفاقی?\s*افتاده)|ماجرا\s*چی(?:ه|ست)|قضیه\s*چی(?:ه|ست)|اینجا\s*چه\s*خبره/.test(norm)
  ) {
    return 'situation_recap';
  }

  if (/داخل\s*کافه.*(?:کسی|صدا)|صدای\s*چی.*میاد|(?:^|\s)گوش(?:\s|$).*(?:در|داخل)|(?:بشنوم|می\s*شنوم).*داخل/.test(norm)) {
    return 'scene_listen';
  }

  if (/(?:از\s*)?(?:لای|شکاف)\s*(?:در|درب).*(?:نگاه|ببین|دید)|داخل.*از\s*(?:لای|شکاف)\s*(?:در|درب)|سرک.*داخل|از\s*پشت\s*شیشه.*نگاه/.test(norm)) {
    return 'scene_peek';
  }

  if (
    /چی\s*(?:می\s*)?بینم|چه\s*(?:چیز|کسی|آدم|اشخاصی).*می\s*بینم|کی\s*(?:اینجاست|اینجا هست)|چه\s*کس(?:ی|ایی).*اینجا|داخل\s*کافه.*(?:کسی|صدا)|صدای\s*چی.*میاد|از\s*لای\s*در.*داخل.*نگاه|دور\s*و\s*بر(?:م|و)?|اطراف(?:م|و)?\s*(?:نگاه|ببین)|نگاه\s*(?:به\s*)?(?:اطراف|دور\s*و\s*بر)|صحنه\s*رو\s*(?:نگاه|بررسی)|اینجا\s*چی\s*(?:هست|می\s*بینم)|چی\s*هست\s*اینجا|(?:الان\s*)?کجام|کجا\s*هستم|(?:چی|چه)\s*کار.*(?:می‌?تونم|می‌?توانم|بکنم|کنم)/.test(norm)
  ) {
    return 'scene_overview';
  }

  return undefined;
}

function containsWorldAction(input: string): boolean {
  const norm = normalizeConversationalPersian(input);
  return /(?:^|\s)(?:(?:می\s*)(?:رم|روم|ام|آم|گیرم|زنم(?:ش)?|کشم(?:ش)?|خورم|پرسم|گردم|کنم|دم|ذارم)|برمی\s*دارم|برم|اومدم|آمدم)(?=$|\s|[؟?!.،,])|برو|وارد|داخل|خارج|نگاه|بررسی|ببین|بگیر|بزن|بردار|بپرس|باز\s*کن|مشت|لگد|حمله|تهدید|هلش|می\s*زنمش|ذهنش.*بخون/.test(norm);
}

function containsIdentityAnchor(input: string): boolean {
  const norm = normalizeConversationalPersian(input);
  return /دوست|رفیق|خاطره|قدیمی|آشنا|فامیل|همکار|شریک|همکلاسی|همسایه|مدیون|نگران|کمک|قول|پول|کنجکاو|انتقام|وظیفه|دین|حقیقت|نجات|خانواده|کاراگاه|کارآگاه|کاراگا|کارآگا|مورخ|هنر|نقاش|مرمت|بوم|قهوه|باریستا|شیمی|سیستم|برنامه|شبکه|تحلیلگر|پلیس|بازرس|بازجو|روان\s*شناس|خبرنگار|وکیل|عکاس|پزشک|پرستار|معلم|استاد|دانشجو|نویسنده|راننده|مغازه\s*دار|تاجر|حسابدار|مهندس/.test(norm);
}

export function inferPlayerIdentity(input: string): PlayerIdentityInterpretation {
  const norm = normalizeConversationalPersian(input);
  const relationshipBased = /دوست|رفیق|خاطره|قدیمی|آشنا|فامیل|همکار|شریک|همکلاسی|همسایه|اعتماد|مدیون|نگران|کمک/.test(norm);

  if (/سیستم|کامپیوتر|برنامه|شبکه|داده|لاگ|پوز|تایم\s*استمپ|امنیت\s*سایبری|هک|تحلیلگر|مهندس\s*نرم|فناوری/.test(norm)) {
    return { role: 'systems_analyst', rawStatement: input.trim(), relationshipBased };
  }
  if (/قهوه|باریستا|شیمی|آزمایشگاه|حلال|رایحه|شامه|عطر|سم\s*شناس|ترکیبات/.test(norm)) {
    return { role: 'coffee_alchemist', rawStatement: input.trim(), relationshipBased };
  }
  if (/هنر|نقاش|مرمت|بوم|اصالت|تاریخ\s*هنر|باستان|موزه|گالری|رنسانس|کارشناس\s*اثر/.test(norm)) {
    return { role: 'art_historian', rawStatement: input.trim(), relationshipBased };
  }
  if (
    relationshipBased ||
    /کاراگاه|کارآگاه|کاراگا|کارآگا|پلیس|آگاهی|بازجو|بازجویی|روان\s*شناس|رفتار|خبرنگار|وکیل|تحقیق|جنایی|تناقض/.test(norm)
  ) {
    return { role: 'investigator', rawStatement: input.trim(), relationshipBased };
  }

  return { role: 'observer', rawStatement: input.trim(), relationshipBased };
}

export function isPlayerIdentityDeclaration(input: string): boolean {
  const norm = normalizeConversationalPersian(input);
  if (norm.length < 2 || classifyConversationalIntent(norm)) return false;
  if (/^[؟?!.،\s]+$/.test(norm)) return false;
  if (/[؟?]/.test(input) || /^(?:چرا|چطور|چجوری|چی|چه|کی|کجا|کدام|مگه)|اسمت|نامت|می\s*شه|می\s*تونی/.test(norm)) return false;
  if (/^(?:سلام|درود|شب\s*بخیر|خسته\s*نباشید)(?:$|[،,!.\s])/.test(norm) && !containsIdentityAnchor(norm)) return false;

  const selfFrame = /(?:^|\s)من(?:\s|$)|هستم|بودم|کارم|شغلم|تخصصم|انگیزه\s*م|(?:دوست|رفیق|همکار|شریک)(?:\s+قدیمی)?(?:\s+سالار)?(?:م|شم|\s+هستم)(?:\s|$)|(?:گر|شناس|نویس|کار|یست|یست|پزشک|وکیل|معلم|مهندس)م(?:\s|$)|برای\s+.+(?:اومدم|آمدم)|(?:اومدم|آمدم).*(?:کمک|حقیقت|نجات)|از\s*بچگی/.test(norm);
  if (selfFrame && containsIdentityAnchor(norm)) return true;
  if (containsWorldAction(norm)) return false;
  if (containsIdentityAnchor(norm)) return true;
  return selfFrame;
}

export function detectIdentityCorrection(input: string, state: RunState): PlayerIdentityInterpretation | undefined {
  if (state.canonical.currentNode !== 'NODE_01' || state.scene.turn > 4) return undefined;
  const norm = normalizeConversationalPersian(input);
  const hasIdentityVocabulary = /کاراگاه|کارآگاه|کاراگا|کارآگا|مورخ|هنر|نقاش|مرمت|بوم|قهوه|باریستا|شیمی|سیستم|برنامه|شبکه|تحلیلگر|دوست|رفیق|خاطره|فامیل|همکار|شریک/.test(norm);
  const soundsSelfDescriptive = /(?:^|\s)من(?:\s|$)|هستم|هستم|کارم|شغلم|تخصصم|دوست.*(?:شم|هستم)|رفیق.*(?:شم|هستم)|(?:گا|گاه|گر|شناس|نویس|کار|یست|یست)م(?:\s|$)|اصلا|در\s*واقع|نه[،,\s]/.test(norm);
  if (!hasIdentityVocabulary || !soundsSelfDescriptive || containsWorldAction(norm)) return undefined;
  return inferPlayerIdentity(input);
}

export function roleCandidateId(role: PlayerClassId): string {
  switch (role) {
    case 'art_historian': return 'SELECT_ROLE_ART_HISTORIAN';
    case 'coffee_alchemist': return 'SELECT_ROLE_COFFEE_ALCHEMIST';
    case 'systems_analyst': return 'SELECT_ROLE_SYSTEMS_ANALYST';
    case 'investigator': return 'SELECT_ROLE_INVESTIGATOR';
    default: return 'SELECT_ROLE_OBSERVER';
  }
}

export function inferImplicitDestination(input: string, state: RunState) {
  const norm = normalizeConversationalPersian(input);
  const currentScene = state.canonical.currentScene || state.scene.sceneId;

  if (
    currentScene === 'scene_entrance' &&
    /(?:می\s*)?(?:رم|روم|آم|ام|برم).*?(?:تو|داخل)(?:\s*(?:ی|یِ))?\s*(?:کافه|سالن)|وارد(?:\s*(?:کافه|سالن))?\s*(?:می\s*)?(?:شم|شوم)|در.*باز.*(?:می\s*)?(?:رم|روم|شم|شوم)/.test(norm)
  ) {
    return LOCATION_REGISTRY.scene_table5;
  }

  if (currentScene !== 'scene_entrance' && /(?:می\s*)?(?:رم|روم|برم).*بیرون|خارج\s*(?:می\s*)?(?:شم|شوم)/.test(norm)) {
    return LOCATION_REGISTRY.scene_entrance;
  }

  return undefined;
}

function cleanIdentityForNarrative(input: string): string {
  return input.trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').slice(0, 220);
}

export function renderIdentityArrival(input: string, role: PlayerClassId): string {
  const norm = normalizeConversationalPersian(input);
  let grounding: string;

  if (/دوست|رفیق|خاطره|قدیمی/.test(norm)) {
    grounding = 'سالار امشب سراغ یک غریبه نرفته؛ سراغ تو آمده—دوستی قدیمی که میان‌تان خاطره‌هایی هست که بقیه از آن خبر ندارند. این نزدیکی شاید درهای بسته را باز کند، اما تشخیص حقیقت از وفاداری را سخت‌تر خواهد کرد.';
  } else if (role === 'art_historian') {
    grounding = 'سالار روی شناختت از اصالت اثر، بافت بوم و تاریخ پنهان زیر رنگ حساب کرده است. چیزی که برای دیگران فقط یک تابلوست، برای تو می‌تواند چند دورهٔ دست‌کاری و چند نیت متفاوت باشد.';
  } else if (role === 'coffee_alchemist') {
    grounding = 'سالار می‌داند بو، دما و رد مواد برای تو به اندازهٔ حرف آدم‌ها اطلاعات دارند. تماس نیمه‌شبش یعنی چیزی در کافه با ظاهر عادی ماجرا جور نیست.';
  } else if (role === 'systems_analyst') {
    grounding = 'سالار به ذهنی احتیاج دارد که ساعت‌ها، لاگ‌ها و جای خالی داده‌ها را مثل یک صحنهٔ جرم بخواند. امشب احتمالاً چیزی میان روایت آدم‌ها و ثبت دستگاه‌ها نمی‌خواند.';
  } else if (role === 'investigator') {
    grounding = 'سالار روی توانت در خواندن آدم‌ها، تناقض‌ها و چیزهایی که گفته نمی‌شوند حساب کرده است. تماسش بیشتر از درخواست کمک، نشانهٔ ترس کسی است که همهٔ حقیقت را پشت تلفن نگفته.';
  } else {
    grounding = `سالار دلیل خودش را برای اعتماد به تو دارد: «${cleanIdentityForNarrative(input)}». شاید تخصص کلاسیکی نداشته باشی، اما نگاهت هنوز برای آدم‌های داخل کافه قابل پیش‌بینی نیست.`;
  }

  return `${grounding}\n\nروبروی کافهٔ پنتیمنتو در کوچهٔ حسینی ایستاده‌ای. ساعت ۰۰:۱۷ بامداد است. باران روی سنگ‌فرش می‌نشیند؛ درِ شیشه‌ای هنوز آرام نگرفته و مردی با پالتوی تیره چند قدم دورتر می‌شود.`;
}

export function renderIdentityCorrection(
  previousStatements: string[],
  input: string,
  role: PlayerClassId,
): string {
  const previous = normalizeConversationalPersian(previousStatements.join(' '));
  const current = normalizeConversationalPersian(input);
  if (/دوست|رفیق|خاطره|قدیمی/.test(previous) && role === 'investigator' && /کاراگاه|کارآگاه|کاراگا|کارآگا/.test(current)) {
    return 'دوستی قدیمی‌ات با سالار تنها دلیل تماس نبود؛ او می‌داند کارآگاهی و خواندن آدم‌ها حرفهٔ توست. خاطرهٔ مشترک به تو دسترسی می‌دهد، اما تجربه‌ات هشدار می‌دهد که اعتماد را جای مدرک ننشانی. مرد پالتوپوش هنوز در انتهای کوچه دور نشده است.';
  }

  return `جزئیات بیشتری از نسبت و سابقه‌ات روشن می‌کنی: «${cleanIdentityForNarrative(input)}». از این لحظه سالار و آدم‌های نزدیکش تو را با همین پیشینه می‌شناسند؛ مقابلت همچنان درِ کافه و کوچهٔ خیس قرار دارد.`;
}

export function renderSceneOverview(state: RunState, intent: ConversationalIntent): string {
  const sceneId = state.canonical.currentScene || state.scene.sceneId;
  const isRecap = intent === 'situation_recap';
  const isListening = intent === 'scene_listen';
  const isPeeking = intent === 'scene_peek';

  switch (sceneId) {
    case 'scene_intro':
      return isRecap
        ? 'سالار توضیح کامل نداده؛ فقط گفته پای گذشته و یک تابلو در میان است و باید همین حالا به پلاک ۵۵ برسی. مرد پالتوپوش تا پیچ کوچه فاصلهٔ زیادی ندارد و درِ کافه هنوز از عبورش تکان می‌خورد.'
        : 'بیرون کافه‌ای. از شکاف در صدای کوتاه بخار و برخورد فنجان می‌آید و چند سایه در سالن حرکت می‌کنند؛ کنار آستانه رسیدی نم‌کشیده افتاده و مرد پالتوپوشی با دستکش قرمز در حال دور شدن است.';
    case 'scene_entrance':
      if (isRecap) {
        return 'سالار پشت تلفن همه‌چیز را نگفت. فعلاً فقط این‌ها را می‌دانی: نیمه‌شب تو را به پلاک ۵۵ کشانده، گفته پای گذشته و تابلو در میان است، و درست حالا مردی با پالتوی تیره از کافه دور می‌شود. کنار در، رسیدی نم‌کشیده روی سنگ‌فرش افتاده و داخل کافه از پشت شیشه روشن است.';
      }
      if (isListening) {
        return 'سرت را به شکاف باریک در نزدیک می‌کنی. صدای بخار دستگاه، برخورد آرام یک فنجان با نعلبکی و دو صدای کوتاه از داخل می‌آید—یکی زنانه نزدیک سالن و یکی مردانه از عمق کافه. کلمه‌ها زیر صدای باران واضح نیستند، اما کافه خالی نیست.';
      }
      if (isPeeking) {
        return 'از لای در فقط برشی باریک از سالن دیده می‌شود: زنی کنار نزدیک‌ترین میز خم شده، سایهٔ گربه‌ای زیر صندلی جمع است و پشت پیشخوان بخار سفیدی بالا می‌رود. زاویهٔ دید برای خواندن شمارهٔ میز یا دیدن دست‌های آدم‌های دورتر کافی نیست.';
      }
      return 'زیر نور زرد سردر، سه چیز در دید توست: درِ شیشه‌ای کافه که هنوز تکان می‌خورد، رسید نم‌کشیده‌ای کنار آب باران، و مرد پالتوپوشی که با دست راست پوشیده در حال دور شدن است. از شکاف در صدای کوتاه بخار و برخورد یک فنجان می‌آید و چند سایه در سالن حرکت می‌کنند؛ چهره‌ها و جزئیات میزها از آستانه روشن نیست.';
    case 'scene_table5':
      return isRecap
        ? 'ظاهر سالن آرام است، اما مرکز تنش میز شمارهٔ ۵ است: فنجانی تقریباً پر رها شده، حانیه نزدیک میز ایستاده و پنتی زیر صندلی کز کرده. کمی دورتر، پیشخوان باریستا و دیوار گالری در دو سوی سالن‌اند؛ سالار در اتاق حسابداری است.'
        : 'سالن گرم و کم‌نور است. نزدیکت میز شمارهٔ ۵ قرار دارد: فنجان اسپرسوی تقریباً پر، نعلبکی سفید، پایهٔ منو و یک صندلی سنگین. حانیه کنار میز ایستاده و پنتی زیر صندلی جمع شده. آن‌سوتر پیشخوان باریستا دیده می‌شود، تابلوی اصلی روی دیوار گالری است و راه اتاق حسابداری از کنار سالن می‌گذرد.';
    case 'scene_counter':
      return 'پشت پیشخوان، یاشین نزدیک صندوق و دستگاه پوز ایستاده و مانی کنار اسپرسوساز و نازل بخار کار می‌کند. کشوی دخل بسته است؛ از اینجا هم میز شمارهٔ ۵ و هم مسیر گالری در دید جانبی تو قرار دارند.';
    case 'scene_gallery':
      return 'نور هالوژن روی تابلوی روغنیِ اصلی افتاده است. از فاصلهٔ فعلی قاب، سطح ورنی و دیوار اطرافش را می‌بینی؛ سالن و پیشخوان پشت سرت‌اند و راه انبار و اتاق حسابداری از دو سوی گالری جدا می‌شود.';
    case 'scene_painting_back':
      return 'قاب کمی از دیوار فاصله گرفته است. پشت بوم، بست‌های قاب و برچسب مالکیت نیمه‌کنده در دسترس نگاهت‌اند؛ جلوی تابلو و سالن پشت شانه‌ات قرار گرفته‌اند.';
    case 'scene_office':
      return isRecap
        ? 'سالار پشت میز میان زونکن‌ها نشسته و اضطرابش را با مرتب‌کردن کاغذها پنهان می‌کند. این همان کسی است که تو را نیمه‌شب خواسته، اما هنوز توضیح کاملش را نداده است.'
        : 'اتاق کوچک با میز چوبی و زونکن خاکستری اسناد پر شده است. سالار پشت میز نشسته؛ در به سالن باز می‌شود و مسیر مانیتورینگ دوربین‌ها نزدیک همین اتاق است.';
    case 'scene_storage':
      return 'انبار باریک و کم‌نور است؛ کارتن‌ها و لوازم بسته‌بندی مسیر را تنگ کرده‌اند. راه بازگشت به گالری و پیشخوان پشت سرت قرار دارد و در این لحظه کسی داخل انبار نیست.';
    case 'scene_cctv':
      return 'چند نمایشگر، تصاویر ورودی و سالن را کنار هم نشان می‌دهند و دستگاه ذخیره‌ساز زیر میز روشن است. از این بخش می‌توانی به اتاق سالار یا پیشخوان برگردی.';
    case 'scene_hosseini_alley':
      return 'کوچه تاریک‌تر از جلوی کافه است. بازتاب چراغ‌ها روی آسفالت خیس، دهانهٔ چند کوچه و فاصلهٔ رو به افزایش تا پلاک ۵۵ تنها نشانه‌های مطمئن‌اند؛ کسی در میدان دید نزدیکت نیست.';
    case 'scene_collector_meeting':
      return 'خط امن نمایندهٔ خریدار باز است و سالار کنار میز ملاقات نشسته. عدد پیشنهادی روی صفحه مانده، قاب هنوز روی دیوار است و صدای آن سوی خط برای پاسخ تو صبر می‌کند.';
    case 'scene_archive':
      return 'مدارکی که پیدا کرده‌ای روی میز آرشیو قرار دارند و سالار روبه‌رویت منتظر است. میان ساعت‌ها و نام‌ها هنوز جاهای خالی دیده می‌شود؛ چند برگه در نور چراغ کامل خوانا نیستند.';
    case 'scene_underpainting':
      return 'تابلو و لایهٔ زیرینش مرکز صحنه‌اند؛ سالار، حانیه، مانی و یاشین هرکدام با نگرانی متفاوتی حضور دارند. اکنون تصمیم دربارهٔ حقیقت، مالکیت و امنیت آدم‌ها از خود کشف جداشدنی نیست.';
    default: {
      const location = LOCATION_REGISTRY[sceneId];
      return location?.defaultDescription ?? 'چند لحظه موقعیت فعلی را از نو می‌سنجی؛ آنچه در دسترس توست همان آدم‌ها، اشیا و راه‌های متصل به این بخش‌اند.';
    }
  }
}

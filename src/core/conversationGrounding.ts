import type { PlayerClassId, RunState } from './types.js';
import { INITIAL_WORLD_OBJECTS, LOCATION_REGISTRY } from './worldAffordances.js';

const PERSIAN_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;

export type ConversationalIntent =
  | 'scene_overview'
  | 'scene_peek'
  | 'scene_listen'
  | 'situation_recap'
  | 'inventory_check'
  | 'evidence_check'
  | 'guidance_request'
  | 'map_request';

export interface PlayerIdentityInterpretation {
  role: PlayerClassId;
  rawStatement: string;
  relationshipBased: boolean;
}

export function normalizeConversationalPersian(value: string): string {
  return value
    .normalize('NFKC')
    .replace(PERSIAN_DIACRITICS, '')
    .replace(/[\p{Emoji}\p{Symbol}\uFE00-\uFE0F\u200D\u200E\u200F]/gu, '')
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
    /^(?:چی|چه\s*چیزهایی?)\s*(?:تو|توی|داخل|در)\s*(?:کیف|جیب)|^(?:کیف|جیب)(?:م|مونو|مو)?\s*(?:رو\s*)?(?:ببینم|ببین|نگاه(?:\s*می\s*کنم|\s*کنم|\s*بندازم)?|چک(?:\s*می\s*کنم|\s*کنم)?|باز(?:\s*می\s*کنم|\s*کنم)?|بررسی(?:\s*می\s*کنم|\s*کنم)?|وارسی(?:\s*می\s*کنم|\s*کنم)?)(?:$|[؟?.!])|^(?:وسایل|محتویات\s*(?:کیف|جیب))(?:م|مونو|مو|\s+من|\s+ما)?(?:$|[؟?.!])|^(?:چی|چه\s*چیزایی?)\s*همراهم(?:ه|ست| دارم)|چیزهایی\s*که\s*(?:دارم|همراهمه)|^(?:بررسی|وارسی|چک|دیدن)\s*(?:وسایل\s*(?:داخل|توی|در)?\s*)?(?:کیف|جیب)(?:م)?(?:\s|$|[؟?.!])/.test(norm) &&
    !/بذار|بذارم|می‌?گذارم|می‌?ذارم|انداخت|پنهان|قایم|سُر|بنداز/.test(norm)
  ) {
    return 'inventory_check';
  }

  if (
    /^(?:مدارک\s*و\s*شواهد|شواهد\s*و\s*مدارک)(?:م|مونو|مو)?(?:\s+(?:من|ما))?(?:$|[؟?.!])|^(?:مدارک|شواهد|سرنخ\s*ها|سرنخ‌ها|یافته\s*ها|یافته‌ها)(?:م|مونو|مو)?(?:\s+(?:من|ما))?\s*(?:چیست|چیه|چی\s*(?:دارم|داریم)|چیاست|کدومن|کدومند|رو\s*(?:ببین|چک|بررسی|نشون|مرور)\s*کن)?(?:$|[؟?.!])|^(?:لیست|فهرست|مرور)\s*(?:مدارک|شواهد|سرنخ|یافته)|^(?:چیا|چه\s*چیزهایی?)\s*(?:تا\s*الان\s*)?(?:پیدا\s*کردم|فهمیدم|ثبت\s*کردم)|پرونده\s*(?:رو\s*)?(?:ببین|چک|مرور|نگاه)\s*(?:کن)?$/.test(norm) &&
    !/بلوف|دروغ|پلیس|تحویل|جعل|جعلی|حدس|ندارم|بدون/.test(norm)
  ) {
    return 'evidence_check';
  }

  if (
    /^(?:راهنما|کمک|راهنمایی)(?:$|[!؟?])|^(?:الان\s*)?(?:چی|چه)\s*کار\s*(?:می‌?تونم|کنم|باید\s*بکنم)(?:$|[؟?])|^(?:الان\s*)?چه\s*کاری\s*(?:می‌?شه|می‌?تونم)\s*کرد(?:$|[؟?])|^(?:الان\s*)?چیکار\s*کنم(?:$|[؟?])/.test(norm)
  ) {
    return 'guidance_request';
  }

  if (
    /^(?:نقشه|پلان|کروکی|نقشه\s*کافه|نقشه\s*کجاست|دیدن\s*نقشه|نقشه\s*رو\s*نشون\s*بده)(?:$|[؟?.!])/.test(norm)
  ) {
    return 'map_request';
  }

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
  if (/[؟?]/.test(input) || /^(?:چرا|چطور|چجوری|چی|چه|کی|کجا|کدام|مگه)(?:\s|$)|اسمت|نامت|می\s*شه|می\s*تونی/.test(norm)) return false;
  if (/^(?:سلام|درود|شب\s*بخیر|خسته\s*نباشید)(?:$|[،,!.\s])/.test(norm) && !containsIdentityAnchor(norm)) return false;

  const selfFrame = /(?:^|\s)من(?:\s|$)|هستم|بودم|کارم|شغلم|تخصصم|انگیزه\s*م|^(?:کیمیاگر|کارشناس|مورخ|تحلیلگر|کارآگاه|دوست\s+قدیمی)|(?:دوست|رفیق|همکار|شریک)(?:\s+قدیمی)?(?:\s+سالار)?(?:م|شم|\s+هستم)(?:\s|$)|(?:گر|شناس|نویس|کار|یست|یست|پزشک|وکیل|معلم|مهندس)م(?:\s|$)|برای\s+.+(?:اومدم|آمدم)|(?:اومدم|آمدم).*(?:کمک|حقیقت|نجات)|از\s*بچگی/.test(norm);
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
  const hasPersonalHistory = /دوست|رفیق|خاطره|قدیمی|همکار|شریک/.test(norm);
  const explicitlyInvestigative = /کاراگاه|کارآگاه|کاراگا|کارآگا|بازجو|پلیس|تحقیق|جنایی|خواندن\s*رفتار/.test(norm);

  if (hasPersonalHistory && role === 'investigator' && explicitlyInvestigative) {
    grounding = 'سالار فقط به یک دوست قدیمی زنگ نزده؛ به کارآگاهی زنگ زده که گذشتهٔ مشترک، راه ورودش به آدم‌هاست و حرفه‌اش اجازه نمی‌دهد وفاداری را جای مدرک بنشاند. تو هم لرزش صدای او را می‌شناسی، هم سکوت‌هایی را که باید مثل صحنهٔ جرم خواند.';
  } else if (hasPersonalHistory && role === 'art_historian') {
    grounding = 'سالار به دو بخش از تو هم‌زمان احتیاج دارد: دوستی قدیمی که تاریخ شخصی‌اش را می‌شناسد، و مورخ هنری‌ای که تاریخ پنهان زیر رنگ را. نزدیکی‌تان درها را باز می‌کند، اما اصالت خاطره و اصالت بوم را باید جداگانه سنجید.';
  } else if (hasPersonalHistory && role === 'coffee_alchemist') {
    grounding = 'سالار سراغ دوستی قدیمی رفته که بو، دما و رد مواد را هم مثل شاهد می‌خواند. خاطرهٔ مشترک به تو دسترسی می‌دهد؛ شامه‌ات هشدار می‌دهد که ظاهر آشنای کافه لزوماً ترکیب آشنایی ندارد.';
  } else if (hasPersonalHistory && role === 'systems_analyst') {
    grounding = 'سالار سراغ دوستی قدیمی رفته که می‌تواند فاصلهٔ میان خاطرهٔ آدم‌ها و زمان‌مهر دستگاه‌ها را ببیند. اعتماد قدیمی تو را داخل می‌برد؛ لاگ‌ها تعیین می‌کنند کدام بخش آن اعتماد دوام می‌آورد.';
  } else if (hasPersonalHistory) {
    grounding = 'سالار امشب سراغ یک غریبه نرفته؛ سراغ دوست قدیمی‌اش آمده—کسی با گذشته‌ای مشترک که لرزش صدایش را از اضطراب معمولی تشخیص می‌دهد. این نزدیکی شاید درهای بسته را باز کند، اما تشخیص حقیقت از وفاداری را سخت‌تر خواهد کرد.';
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

  if (intent === 'inventory_check') {
    const inv = state.canonical.inventoryIds
      .map(id => {
        const cleanId = id.replace(/^item_/, '');
        return state.worldObjects?.[id]?.nameFa ??
          state.worldObjects?.[cleanId]?.nameFa ??
          INITIAL_WORLD_OBJECTS[id]?.nameFa ??
          INITIAL_WORLD_OBJECTS[cleanId]?.nameFa ??
          id;
      });
    if (inv.length > 0) {
      return `کیف و وسایلت را بازبینی می‌کنی. این‌ها همراه توست:\n• ${inv.join('\n• ')}\n\nمی‌توانی هر کدام را که می‌خواهی از نزدیک بررسی کنی یا در تعامل با محیط به کار ببری.`;
    }
    return 'کیف و جیب‌هایت را بررسی می‌کنی؛ هنوز شیء یا مدرک فیزیکی قابل‌حملی همراهت نیست. اشیایی را که در کافه پیدا می‌کنی می‌توانی برداری و با خودت نگه‌داری.';
  }

  if (intent === 'evidence_check') {
    const evidenceLabels: Record<string, string> = {
      fact_wet_receipt: 'رسید نم‌کشیدهٔ میز پنج با مهر کارگاهی',
      fact_time_0017: 'زمان چاپ ۰۰:۱۷ روی فیش رسید',
      fact_red_glove_man: 'دستکش قرمز مرد پالتوپوش در حال دور شدن',
      fact_solvent_smell_cup: 'بوی حلال شیمیایی و نفتی جدا از قهوه در فنجان ۵',
      fact_red_stain_saucer: 'رد قرمز لایه‌مانند و مشکوک روی نعلبکی ۵',
      fact_penti_agitation: 'واکنش و بی‌قراری غیرعادی گربه (پنتی) نسبت به میز ۵',
      fact_pos_order_timestamp: 'ثبت سفارش میز پنج در ساعت ۰۰:۱۱ روی پوز',
      fact_pos_receipt_time_gap: 'اختلاف زمان ۶ دقیقه‌ای بین سفارش و صدور فیش',
      fact_painting_surface_anomaly: 'ناهم‌جهتی ترک‌های ورنی و تصویر رویی تابلوی پنتیمنتو',
      fact_underpainting_hidden_layer: 'وجود ترکیب‌بندی و خطوط قدیمی‌تر زیر لایهٔ رنگ',
      fact_painting_window_reflection: 'انعکاس قاب پنجرهٔ مدفون در لایهٔ زیرین تابلو',
      fact_label_numbers_14_3_7_55: 'توالی اعداد ۱۴ / ۳ / ۷ / ۵۵ پشت بوم',
      fact_label_transfer_trace: 'چندنوبتی‌بودن ثبت و لایه‌نشانی اعداد مالکیت',
      fact_invoice_is_forged: 'ناهم‌خوانی فاکتور پلاک ۵۵ با قالب اسناد رسمی',
      fact_invoice_text_rg_lot55_returned: 'متن R.G. / Lot 55 / Returned در فاکتور روی میز سالار',
      fact_invoice_font_differs_from_others: 'تفاوت فونت و شماره‌گذاری فاکتور با سایر اسناد',
      fact_invoice_lot55_seal: 'اثر مهر پلاک ۵۵ روی سند مالی',
      fact_camera_time_gap: 'شکاف زمانی میان ۰۰:۱۱ و ۰۰:۱۷ در تصاویر دوربین مداربسته',
      fact_footage_was_never_written: 'ثبت‌نشدن رویداد نوشتن روی دیسک ذخیره‌ساز دوربین',
      fact_parked_car_sighting: 'خودروی خاموش و بدون چراغ در ابتدای کوچه',
      fact_final_timeline_synthesis: 'جمع‌بندی متصل و اثبات‌شدهٔ خط زمانی وقایع',
      fact_florence_historical_breach: 'سند تاریخی پنهان در لایهٔ زیرین تابلوی پنتیمنتو',
    };
    const ev = state.canonical.evidenceIds
      .map(id => evidenceLabels[id] ?? id)
      .slice(-8);
    if (ev.length > 0) {
      return `شواهد و مدارکی که تا این لحظه کشف و ثبت کرده‌ای:\n• ${ev.join('\n• ')}\n\nاین دانسته‌ها اهرم تو در گفت‌وگو با آدم‌ها و بازکردن گره‌های پایانی پرونده هستند.`;
    }
    return 'هنوز مدرک یا نکتهٔ اثبات‌شده‌ای در پرونده ثبت نکرده‌ای. محیط اطراف، اسناد، گفته‌های آدم‌ها و تناقض‌های زمانی را بررسی کن.';
  }

  if (intent === 'guidance_request') {
    switch (sceneId) {
      case 'scene_entrance':
        return 'در آستانهٔ ورودی کافه‌ای. می‌توانی:\n• رسید نم‌کشیدهٔ روی زمین را بررسی کنی یا برداری.\n• به مرد پالتوپوشی که دارد دور می‌شود چیزی بگویی.\n• درِ شیشه‌ای را باز کنی و وارد سالن اصلی کافه شوی.';
      case 'scene_table5':
        return 'در سالن اصلی کنار میز ۵ هستی. می‌توانی:\n• فنجان و نعلبکی رهاشده را بو بکشی یا بررسی کنی.\n• پنتی (گربه) را زیر صندلی نوازش کنی یا با حانیه صحبت کنی.\n• به سمت پیشخوان بروی و با یاشین و مانی حرف بزنی.\n• به دیوار گالری یا اتاق حسابداری سالار سر بزنی.';
      case 'scene_counter':
        return 'کنار پیشخوان و بار باریستا هستی. می‌توانی:\n• با یاشین درباره زمان سفارش میز ۵ یا فوتبال و قهوه صحبت کنی.\n• با مانی درباره آماده‌سازی قهوه حرف بزنی.\n• مانیتور پوز و لاگ سفارش‌ها را وارسی کنی.\n• یک قهوه تازه سفارش بدهی یا به سالن و دفتر برگردی.';
      case 'scene_office':
        return 'در اتاق حسابداری پیش سالار هستی. می‌توانی:\n• از سالار درباره پیام نگران‌کننده‌اش و تهدید خریدار بپرسی.\n• زونکن و فاکتورهای روی میز را ورق بزنی و بخوانی.\n• به بخش مانیتورینگ دوربین‌های مداربسته بروی.';
      case 'scene_cctv':
        return 'پای مانیتورهای دوربین مداربسته هستی. می‌توانی:\n• خط زمانی ضبط تصاویر را بین ساعت ۱۲ تا ۱ بامداد بازبینی کنی.\n• رخدادهای نوشتن روی دیسک را بررسی کنی.\n• به اتاق سالار یا پیشخوان برگردی.';
      case 'scene_gallery':
        return 'روبروی تابلوی پنتیمنتو در گالری هستی. می‌توانی:\n• سطح بوم و ترک‌های ورنی را با نور مایل بررسی کنی.\n• قاب تابلو را فاصله بدهی و برچسب پشت آن را بخوانی.\n• به انبار کارتن‌ها یا سالن برگردی.';
      case 'scene_storage':
        return 'در انبار کارتن‌ها هستی. می‌توانی:\n• جعبه‌ها و بسته‌بندی‌های داخل قفسه را بررسی کنی.\n• به گالری یا پیشخوان برگردی.';
      case 'scene_collector_meeting':
        return 'پای مذاکره با نمایندهٔ خریدار هستی. می‌توانی:\n• با شواهد و فاکتور جعلی پلاک ۵۵ بلوف بزنی.\n• مذاکره را متوقف کنی و به سمت میز آرشیو بروی.';
      case 'scene_archive':
        return 'پشت میز آرشیو هستی. می‌توانی:\n• مدارک و خط زمانی را کنار هم تحلیل کنی تا فرضیه بسازی.\n• سراغ بررسی لایه‌های زیرین تابلو بروی.';
      case 'scene_underpainting':
        return 'پای لایه‌های زیرین تابلوی پنتیمنتو هستی. می‌توانی:\n• نشانه‌های تاریخی زیر رنگ را بسنجی.\n• تصمیم نهایی‌ات را درباره سرنوشت تابلو، سالار و کافه ثبت کنی.';
      default:
        return 'می‌توانی اشیای پیرامونت را دقیق‌تر وارسی کنی، با افراد حاضر در صحنه وارد گفت‌وگو شوی، یا به بخش‌های دیگر کافه حرکت کنی.';
    }
  }

  if (intent === 'map_request') {
    const loc = LOCATION_REGISTRY[sceneId]?.nameFa ?? 'موقعیت فعلی';
    const isStorage = sceneId === 'scene_storage';
    const isGallery = sceneId === 'scene_gallery' || sceneId === 'scene_painting_back';
    const isArchive = sceneId === 'scene_archive_collector' || sceneId === 'scene_collector_meeting' || sceneId === 'scene_archive' || sceneId === 'scene_underpainting';
    const isCounter = sceneId === 'scene_counter';
    const isTable5 = sceneId === 'scene_table5' || sceneId === 'scene_table_5';
    const isOffice = sceneId === 'scene_office';
    const isEntrance = sceneId === 'scene_entrance' || sceneId === 'scene_hosseini_alley';
    const isCctv = sceneId === 'scene_cctv';

    const bStorage = isStorage ? ' 📍 [انبار کارتن] ' : '   انبار کارتن   ';
    const bGallery = isGallery ? ' 📍 [دیوار گالری] ' : ' دیوار گالری (تابلو) ';
    const bArchive = isArchive ? ' 📍 [میز آرشیو]  ' : '   آرشیو و خریدار ';
    const bCounter = isCounter ? ' 📍 [پیشخوان]   ' : '   پیشخوان / بار  ';
    const bTable5 = isTable5 ? ' 📍 [سالن / میز ۵] ' : '   سالن اصلی (میز ۵)   ';
    const bOffice = isOffice ? ' 📍 [اتاق سالار] ' : '   اتاق سالار     ';
    const bEntrance = isEntrance ? '📍 [ورودی / کوچه حسینی]' : '[ورودی / کوچه حسینی]';
    const bCctv = isCctv ? '📍 [دوربین‌ها / CCTV]' : '[دوربین‌ها / CCTV]';

    return [
      '🗺️ نقشهٔ راهنمای کافه پنتیمنتو (پلاک ۵۵):',
      '',
      `📍 موقعیت کنونی شما: ${loc}`,
      '',
      '┌─────────────────┬──────────────────────┬─────────────────┐',
      `│${bStorage}│${bGallery}│${bArchive}│`,
      '├─────────────────┼──────────────────────┼─────────────────┤',
      `│${bCounter}│${bTable5}│${bOffice}│`,
      '└─────────────────┴──────────┬───────────┴────────┬────────┘',
      '                             │                    │',
      `                  ${bEntrance}     ${bCctv}`,
      '',
      '💡 برای دیدن نقشهٔ تصویری رنگی با موقعیت دقیق، دکمهٔ «🗺️ نقشه کافه» یا دستور /map را بزن.',
      '🚶‍♂️ برای رفتن به هر بخش بنویس: «میرم [نام بخش]» (مثلاً: «میرم پیشخوان» یا «میرم پیش سالار»)',
    ].join('\n');
  }

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

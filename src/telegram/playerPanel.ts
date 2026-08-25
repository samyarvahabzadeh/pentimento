import type { RunState } from '../core/types.js';
import { renderSceneOverview } from '../core/conversationGrounding.js';
import { INITIAL_WORLD_OBJECTS, LOCATION_REGISTRY } from '../core/worldAffordances.js';

const NPC_NAMES: Record<string, string> = {
  salar: 'سالار',
  haniyeh: 'حانیه',
  mani: 'مانی',
  yashin: 'یاشین',
  collector: 'نمایندهٔ خریدار',
  exiting_man: 'مرد پالتوپوش',
  cat_penti: 'پنتی',
};

const ENDING_NAMES: Record<string, string> = {
  TRUE_ENDING: 'پنتیمنتو',
  THE_PRICE: 'بهای سکوت',
  BROTHERS: 'برادران',
  ESPRESSO: 'اسپرسو',
  EXPOSURE: 'افشا',
  WRONG_MAN: 'آدم اشتباه',
  BAD_ENDING_ABANDONMENT_ARSON: 'خاکسترِ رهاکردن',
  BAD_ENDING_TOXIC_SHOCK: 'شوک سمی',
  BAD_ENDING_PSYCH_HOLD: 'فروپاشی',
  BAD_ENDING_SYNDICATE_ABDUCTION: 'ون سیاه',
  BAD_ENDING_INTERNAL_BETRAYAL: 'خیانت از درون',
  BAD_ENDING_COLD_EXPULSION: 'اخراج در سرما',
  BAD_ENDING_POLICE_SHUTDOWN: 'پلمب',
};

const EVIDENCE_LABELS: Record<string, string> = {
  fact_wet_receipt: 'رسید نم‌کشیدهٔ میز پنج',
  fact_time_0017: 'زمان چاپ ۰۰:۱۷ روی رسید',
  fact_red_glove_man: 'دستکش قرمز مرد پالتوپوش',
  fact_solvent_smell_cup: 'بوی حلال جدا از قهوه',
  fact_red_stain_saucer: 'رد قرمز لایه‌مانند روی نعلبکی',
  fact_penti_agitation: 'فاصله‌گرفتن غیرعادی پنتی از میز پنج',
  fact_pos_order_timestamp: 'ثبت سفارش میز پنج در ساعت ۰۰:۱۱',
  fact_pos_receipt_time_gap: 'اختلاف زمان سفارش و چاپ رسید',
  fact_painting_surface_anomaly: 'ناهم‌جهتی ترک‌های ورنی و تصویر رویی',
  fact_underpainting_hidden_layer: 'وجود ترکیب‌بندی قدیمی‌تر زیر رنگ',
  fact_painting_window_reflection: 'قاب پنجرهٔ مدفون در لایهٔ زیرین',
  fact_label_numbers_14_3_7_55: 'توالی ۱۴ / ۳ / ۷ / ۵۵ پشت بوم',
  fact_label_transfer_trace: 'چندنوبتی‌بودن ثبت اعداد مالکیت',
  fact_invoice_is_forged: 'ناهم‌خوانی فاکتور پلاک ۵۵ با قالب رسمی',
  fact_invoice_text_rg_lot55_returned: 'متن R.G. / Lot 55 / Returned در فاکتور',
  fact_invoice_font_differs_from_others: 'تفاوت فونت و شماره‌گذاری فاکتور با اسناد رسمی',
  fact_invoice_lot55_seal: 'اثر مهر پلاک ۵۵ روی سند مالی',
  fact_camera_time_gap: 'شکاف زمانی در تصاویر دوربین',
  fact_footage_was_never_written: 'ثبت‌نشدن بخشی از تصویر روی دیسک',
  fact_parked_car_sighting: 'خودروی خاموش و مشکوک در کوچه',
  fact_final_timeline_synthesis: 'جمع‌بندی پشتیبانی‌شدهٔ خط زمانی',
  fact_florence_historical_breach: 'سند تاریخی پنهان در لایهٔ زیرین',
};

function sceneIdOf(state: RunState): string {
  const raw = state.canonical.currentScene || state.scene.sceneId;
  return raw === 'scene_table_5' ? 'scene_table5' : raw;
}

function friendlyInventory(state: RunState): string[] {
  return state.canonical.inventoryIds.map(id => INITIAL_WORLD_OBJECTS[id]?.nameFa ?? id);
}

function friendlyEvidence(state: RunState): string[] {
  return state.canonical.evidenceIds
    .map(id => EVIDENCE_LABELS[id])
    .filter((value): value is string => Boolean(value))
    .slice(-6);
}

export function buildPlayerHelp(): string {
  return [
    '🎭 پنتیمنتو با گزینه‌های ازپیش‌نوشته‌شده بازی نمی‌شود.',
    '',
    'هر کاری می‌خواهی به زبان خودت بگو: حرکت کن، چیزی را از زاویه‌ای مشخص بررسی کن، با آدم‌ها حرف بزن، دروغ بگو، معامله کن، اعتماد بساز یا خطر را بپذیر. جهان بر اساس موقعیت، دانسته‌ها و پیامد انتخابت جواب می‌دهد.',
    '',
    'فرمان‌های بیرون از داستان:',
    '/continue — ادامهٔ اجرای ذخیره‌شده',
    '/where — دید فعلی، بدون گذشت زمان',
    '/recap — یادآوری وضعیت و یافته‌ها، بدون گذشت زمان',
    '/restart — شروع کامل از ابتدا',
    '/logout — بستن دسترسی روی این حساب، بدون پاک شدن بازی',
    '',
    'لازم نیست اسم اکشن یا نود بدانی. دقیق گفتن «چه می‌کنی، با چه چیزی و چرا» نتیجه‌های غنی‌تری می‌سازد.',
  ].join('\n');
}

export function buildWherePanel(state: RunState): string {
  const sceneId = sceneIdOf(state);
  const locationName = LOCATION_REGISTRY[sceneId]?.nameFa ?? 'موقعیت فعلی';
  const people = state.scene.activeEntityIds
    .map(id => NPC_NAMES[id])
    .filter((value): value is string => Boolean(value));
  const peopleLine = people.length > 0 ? `آدم‌های حاضر: ${people.join('، ')}` : 'کسی در فاصلهٔ گفت‌وگوی مستقیم نیست.';

  return [
    `📍 ${locationName}`,
    renderSceneOverview(state, 'scene_overview'),
    peopleLine,
    '',
    'این نگاه زمان داستان را جلو نمی‌برد.',
  ].join('\n');
}

export function buildRecapPanel(state: RunState): string {
  if (state.canonical.endingId) {
    const endingName = ENDING_NAMES[state.canonical.endingId] ?? 'ثبت‌شدهٔ این مسیر';
    return `این اجرای پنتیمنتو به پایان «${endingName}» رسیده است. برای تجربهٔ مسیری تازه /restart را بزن.`;
  }

  const evidence = friendlyEvidence(state);
  const inventory = friendlyInventory(state);
  const identity = state.canonical.playerIdentity
    ? `هویت تو در این روایت: ${state.canonical.playerIdentity}`
    : 'هویت و انگیزهٔ ورودت هنوز باید با زبان خودت روشن شود.';

  return [
    '🧭 یادآوری ماجرا',
    identity,
    renderSceneOverview(state, 'situation_recap'),
    '',
    evidence.length > 0
      ? `یافته‌های ثبت‌شده:\n• ${evidence.join('\n• ')}`
      : 'هنوز یافتهٔ قابل اتکایی ثبت نکرده‌ای.',
    inventory.length > 0
      ? `چیزهایی که همراهت است: ${inventory.join('، ')}`
      : 'چیز قابل‌حملی همراهت نیست.',
    '',
    'این یادآوری زمان داستان را جلو نمی‌برد؛ مسیر بعدی را خودت انتخاب کن.',
  ].join('\n');
}

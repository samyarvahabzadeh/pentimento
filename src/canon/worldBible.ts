import type { HistoricalLoreCard } from '../core/types.js';

export interface SymbolGrammarItem {
  id: 'hand' | 'window' | 'cup' | 'shadow';
  nameFa: string;
  localMeaning: string;
  metaHistoricalMeaning: string;
}

export const SYMBOL_GRAMMAR: Record<'hand' | 'window' | 'cup' | 'shadow', SymbolGrammarItem> = {
  hand: {
    id: 'hand',
    nameFa: 'دست (دستکش)',
    localMeaning: 'مرد پالتوپوش با دستکش چرمی قرمز که ساعت ۰۰:۱۷ از کافه خارج شد.',
    metaHistoricalMeaning: 'نشان کارگاه‌ها و رابط‌های شبکهٔ محافظان برای تایید اصالت انتقال فیزیکی اثر.',
  },
  window: {
    id: 'window',
    nameFa: 'پنجره',
    localMeaning: 'بازهٔ زمانی تاریک‌شده در لاگ سیستم دوربین‌ها (فاصلهٔ ۰۰:۱۵ تا ۰۰:۲۲).',
    metaHistoricalMeaning: 'روشی در بایگانی تاریخی که در آن رخدادی با سانسور سنجیده از حافظهٔ رسمی حذف می‌شود.',
  },
  cup: {
    id: 'cup',
    nameFa: 'فنجان',
    localMeaning: 'فنجان قهوهٔ دست‌نخورده روی میز شماره ۵ با بوی حلال شیمیایی.',
    metaHistoricalMeaning: 'نماد آزمون حقیقت یا مایعی که برای شستن و حل کردن لایهٔ رویی حقیقت به کار می‌رود.',
  },
  shadow: {
    id: 'shadow',
    nameFa: 'سایه',
    localMeaning: 'رد پنهان فاکتور دستکاری‌شده و هویت خریدار پلاک ۵۵.',
    metaHistoricalMeaning: 'لایه‌های زیرین نقاشی (Pentimento) که زیر لایهٔ رسمی قرن‌ها پنهان مانده‌اند.',
  },
};

export const RED_GLOVE_FACTIONS = {
  preservers: {
    id: 'preservers',
    nameFa: 'پاسداران (Preservers)',
    philosophy: 'حقیقت خطرناک را نابود نکن؛ آن را زیر لایه‌ای آرام پنهان کن تا روز موعود زنده بماند.',
  },
  custodians: {
    id: 'custodians',
    nameFa: 'متولیان (Custodians)',
    philosophy: 'دانش پنهان نباید به دست عامه برسد؛ کنترل آثار و جریان اطلاعات باید در انحصار نخبگان بماند.',
  },
  redactors: {
    id: 'redactors',
    nameFa: 'ویراستاران (Redactors)',
    philosophy: 'تاریخ باید بر اساس مصلحت بازنویسی شود و لایه‌های مزاحم برای همیشه محو گردند.',
  },
};

export const WORLD_LORE_CARDS: HistoricalLoreCard[] = [
  {
    id: 'rg_card_stage0_glove_object',
    classification: 'fictional_overlay',
    title: 'دستکش چرمی سرخ',
    safeText: 'یک دستکش چرمی قرمز رنگ با دوخت ظریف روی میز شماره ۵ مشاهده شده است.',
    revealed: false,
    stage: 0,
    forbiddenInferences: ['عضویت قطعی فرقه', 'داستان‌های باستانی قرون وسطایی'],
  },
  {
    id: 'rg_card_stage1_repeated_seal',
    classification: 'fictional_overlay',
    title: 'مهر چهار نشانه',
    safeText: 'مهر چهار نشانه (دست، پنجره، فنجان، سایه) به صورت مشترک در رسید خیس و حاشیه فاکتور پلاک ۵۵ ثبت شده است.',
    revealed: false,
    stage: 1,
    forbiddenInferences: ['داوینچی عضو شبکه بود', 'سازمان تروریستی بین‌المللی'],
  },
  {
    id: 'rg_card_stage2_provenance_anomaly',
    classification: 'fictional_overlay',
    title: 'شکاف تاریخی شجره‌نامه تابلو',
    safeText: 'بررسی اسناد نشان می‌دهد زنجیرهٔ انتقال تابلو صرفاً به یک خریدار امروزی ختم نمی‌شود، بلکه ردی از یک نشانهٔ کارگاهی قدیمی‌تر در آن وجود دارد.',
    revealed: false,
    stage: 2,
    forbiddenInferences: ['میکل‌آنژ بنیان‌گذار بود', 'شبکه منقرض شده است'],
  },
  {
    id: 'rg_card_stage3_florence_breach',
    classification: 'fictional_overlay',
    title: 'سند کارگاه فلورانس',
    safeText: 'در لایهٔ زیرین، چهار نشانه کنار نام شاهدان یک انتقال کارگاهی ثبت شده و جای نام پنجمی عمداً تراشیده شده است. تابلو نه نقشهٔ گنج، بلکه دفتر شاهدی بوده که سه جناح شبکه برای پنهان‌کردن، کنترل‌کردن یا پاک‌کردنش رقابت کرده‌اند.',
    revealed: false,
    stage: 3,
    forbiddenInferences: ['افشای نهایی هویت بنیان‌گذار در اپیزود اول'],
  },
];

export function getRevealedLoreCards(stage: 0 | 1 | 2 | 3): HistoricalLoreCard[] {
  return WORLD_LORE_CARDS.filter(c => c.stage <= stage);
}

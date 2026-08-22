import type { CanonicalActionId } from '../core/types.js';

export const NODE_03_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'TALK_TO_YASHIN',
  'TALK_TO_MANI',
  'CHECK_POS_ORDERS',
  'EXAMINE_ESPRESSO_MACHINE',
  'APPROACH_GALLERY',
  'RETURN_TO_TABLE_5',
];

export const NODE_03_FACTS = [
  {
    id: 'fact_counter_setup',
    text: 'کانتر چوبی تیره پنتیمنتو. دستگاه اسپرسوی صنعتی استیل، دو آسیاب قهوه مدرج، مانیتور کوچک سیستم ثبت سفارش (POS) و یک چاپگر فیش روی کانتر قرار دارند.',
  },
  {
    id: 'fact_pos_order_table_5',
    text: 'در گزارش سیستم POS، سفارشی برای «یک شات سینگل اسپرسو» برای میز ۵ در ساعت ۰۰:۱۱ بامداد ثبت شده که به صورت نقدی تسویه شده است.',
  },
  {
    id: 'fact_yashin_testimony',
    text: 'یاشین شجاعی (۲۰ ساله، باریستای ارشد، موقر و متخصص قهوه) به یاد دارد که سفارش میز ۵ یک اسپرسوی معمولی بود، اما مشتری به طرز عجیبی به سمت تابلوی گالری انتهای کافه نگاه می‌کرد.',
  },
  {
    id: 'fact_mani_testimony',
    text: 'مانی شجاعی (۱۹ ساله، باریستا، درشت‌هیکل و والیبالیست) به یاد دارد که مشتری یک مرد قدبلند با پوشش تیره بود و وقتی مانی شوخی کوتاهی درباره قهوه آخر شب کرد، هیچ واکنشی نشان نداد و سرش را بالا نیاورد.',
  },
  {
    id: 'fact_espresso_machine_status',
    text: 'دستگاه اسپرسو با فشار بخار ۹ بار آماده کار است؛ فنجان‌های سرامیکی سفید روی سینی گرم‌کننده بالای دستگاه چیده شده‌اند.',
  },
];

export const NODE_03_INITIAL_STATE = {
  description: `پشت کانتر کافه پنتیمنتو. ساعت ۰۰:۲۵ بامداد.
بوی قهوهٔ تازه آسیاب‌شده و صدای ریز چکیدن آب و بخار فضا را پر کرده است.
یاشین و مانی پشت بار ایستاده‌اند؛ یاشین دستمال‌پارچه‌ای به دست دارد و مانی به پیشخوان تکیه داده است.
مانیتور POS و چاپگر فیش با نور ضعیف سبز روشن هستند.`,

  activeEntityIds: ['yashin', 'mani'] as string[],
  visibleObjectIds: ['counter_area', 'pos_terminal', 'espresso_machine', 'coffee_grinders', 'receipt_printer'] as string[],
  canonFacts: NODE_03_FACTS,
};

import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_09_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  table_7_ticket: 'NORMAL_OBJECT',
  fryer: 'NORMAL_OBJECT',
  kitchen_counter: 'NORMAL_OBJECT',
};

export const NODE_09_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_MEHRI_ABOUT_CASE',
  'ENTER_KITCHEN',
  'EXAMINE_KITCHEN_ORDER',
  'EXIT_CAFE_TO_ALLEY',
  'OBSERVE_KITCHEN_ACTIVITY',
  'RETURN_TO_TABLE_5',
  'TALK_TO_ARIAN_MEHRI',
];

export const NODE_09_FACTS = [
  {
    id: 'fact_kitchen_contrast_domain',
    text: 'آشپزخانهٔ کافه پنتیمنتو؛ قلمرو کاری آرین مهری با صدای جلزولز روغن سرخ‌کن، ردیف تخته‌های کار و حرارت اجاق.',
  },
  {
    id: 'fact_table_7_ordinary_order',
    text: 'فیش سفارش آویزان برای میز ۷ یک سفارش غذای معمولی همراه با سیب‌زمینی اضافه است، بدون هیچ نکته یا پیام رمزآلود.',
  },
  {
    id: 'fact_mehri_kitchen_routine',
    text: 'آرین مهری با پیش‌بند مشکی و تسلط خونسردانه به کارهای آشپزخانه می‌رسد و همزمان حواسش به پیام‌های موبایل و کارهای فنی بیرون از کافه است.',
  },
  {
    id: 'fact_mehri_commitment_subtext',
    text: 'آرین مهری در حین پیچاندن دو چت همزمان با خنده می‌گوید: «آدم‌ها وقتی می‌خوان مسئولیت قبول نکنن، شروع می‌کنن به پاک کردن ردپاهاشون... درست مثل کاری که من با نوتیفیکیشن‌هام می‌کنم! ولی نیم ساعت پیش یه دستگاه غریبه به مودم کافه وصل شده بود که هیچ پیامی نفرستاد، فقط لاگ رو خاموش کرد و رفت. اونم مثل من از تعهد فراری بود داداش، ولی خیلی تمیزتر کار می‌کرد.»',
  },
];

export const NODE_09_INITIAL_STATE = {
  description: `فضای پرحرارت و شلوغ آشپزخانه در انتهای سالن.
صدای یکنواخت هود، صدای جلزولز ملایم روغن سرخ‌کن و نور مهتابی روشن.
آرین مهری پشت پیشخوان استیل ایستاده و تیکت سفارش‌ها را مرتب می‌کند.`,

  activeEntityIds: ['arian_mehri'] as string[],
  visibleObjectIds: ['kitchen_counter', 'fryer', 'table_7_ticket', 'order_printer'] as string[],
  canonFacts: NODE_09_FACTS,
};

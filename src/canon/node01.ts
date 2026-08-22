import type { CanonicalActionId } from '../core/types.js';

export const NODE_01_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'ENTER_CAFE',
  'OBSERVE_EXITING_MAN',
  'OBSERVE_ENTRANCE',
  'FOLLOW_EXITING_MAN',
  'IGNORE_AND_WAIT',
];

/**
 * Canon facts of NODE 01 — Pentimento Entrance.
 * Source: PENTIMENTO.md § NODE 01
 * Timestamp: 00:17 بامداد (Night / Late Midnight)
 */
export const NODE_01_FACTS = [
  {
    id: 'fact_entrance_location',
    text: 'کافه پنتیمنتو در عظیمیه کرج، کوچه حسینی پلاک ۵۵. ساعت ۰۰:۱۷ بامداد است و نور زرد ملایمی از شیشه‌های کافه به پیاده‌رو سرد شب می‌تابد.',
  },
  {
    id: 'fact_exiting_man_presence',
    text: 'مردی با پوشش تیره در حال خروج از کافه است و لنگه در را با دستش باز نگه داشته است. او داوطلبانه و بدون پرسش گفته: «هنوز بازه.»',
  },
  {
    id: 'fact_exiting_man_posture',
    text: 'مرد ظاهری آرام و موقر دارد و دستش لبه در را گرفته است.',
  },
  {
    // HAND SEED — True Ending prerequisite. Neutral sensory only; no canon interpretation.
    id: 'fact_exiting_man_hands_notable',
    text: 'در لحظه‌ای که مرد در را نگه می‌دارد، دستانش به شکلی آرام و کنترل‌شده روی چارچوب در قرار می‌گیرند — انگار با آن آشناست.',
  },
  {
    id: 'fact_wet_cup_receipt',
    text: 'یک رسید نم‌کشیده از سفارش قهوه روی زمین نزدیک ورودی افتاده است که فقط با بررسی مستقیم زمین قابل مشاهده است.',
  },
  {
    // Canon Augmentation: Background observation to statefully ground the 2nd sighting in NODE 13.
    id: 'fact_parked_car_seen_once',
    text: 'خودرویی در حاشیهٔ خیابان در پس‌زمینهٔ ورودی کافه متوقف است.',
  },
];

export const NODE_01_INITIAL_STATE = {
  openingNarrative: `پنتیمنتو.
عظیمیه، کرج — کوچهٔ حسینی، پلاک ۵۵.
ساعت ۰۰:۱۷ بامداد.

صدای شهر پشت سرت است.
نور کافه مقابلت.

مردی از کافه خارج می‌شود.
در را برایت نگه می‌دارد.

می‌گوید:
«هنوز بازه.»

تو هیچ سؤالی نکرده بودی.`,

  activeEntityIds: ['exiting_man'] as string[],
  visibleObjectIds: ['cafe_door', 'cafe_entrance', 'street'] as string[],
  canonFacts: NODE_01_FACTS,
};

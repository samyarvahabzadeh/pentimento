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
    text: 'کافه پنتیمنتو در عظیمیه کرج، کوچه حسینی پلاک ۵۵. ساعت ۰۰:۱۷ بامداد است و باد گزنده کوهپایه در تاریکی کوچه می‌پیچد.',
  },
  {
    id: 'fact_exiting_man_presence',
    text: 'مردی با پالتوی تیره و دستکش‌های چرمی قرمز در آستانه در ایستاده و لنگه در را با خونسردی باز نگه داشته است. نگاهی سرد و نفوذکننده به چشمانت می‌دوزد و با لحنی شمرده می‌گوید: «هنوز بازه.»',
  },
  {
    id: 'fact_exiting_man_posture',
    text: 'مرد قامتی کشیده، نگاهی نفوذکننده و آرامشی کنترل‌شده و تحقیرآمیز دارد؛ دستکش چرمی قرمزش روی چارچوب در تکیه زده است.',
  },
  {
    // HAND SEED — True Ending prerequisite. Neutral sensory only.
    id: 'fact_exiting_man_hands_notable',
    text: 'دستکش‌های چرمی قرمز مرد بدون کوچک‌ترین چروک روی دستش نشسته‌اند و انگشتانش با تسلطی غریب روی چارچوب چوبی در تکیه زده‌اند — انگار این فضا را از سال‌ها قبل می‌شناسد.',
  },
  {
    id: 'fact_wet_cup_receipt',
    text: 'یک رسید کاغذی نم‌کشیده از سفارش قهوه کف پیاده‌رو، درست پیش پای مرد پالتوپوش افتاده است.',
  },
  {
    id: 'fact_parked_car_seen_once',
    text: 'خودرویی با شیشه‌های دودی در تاریکی حاشیه کوچه حسینی متوقف است.',
  },
];

export const NODE_01_INITIAL_STATE = {
  openingNarrative: `عظیمیه کرج — کوچهٔ حسینی، پلاک ۵۵.
ساعت ۰۰:۱۷ بامداد.

سرمای گزنده کوهپایه در کوچه می‌پیچد. نور زرد و کهربایی کافه پنتیمنتو از پشت شیشه‌های مات به سنگ‌فرش خیس می‌تابد.

درست در آستانهٔ ورود، لنگهٔ سنگین در چوبی باز می‌شود.
مردی با پالتوی بلند تیره و دستکش‌های چرمی قرمز لنگهٔ در را باز نگه می‌دارد.

چند ثانیه سکوت سنگین میان شما می‌گذرد.
نگاهش تیز، بی‌روح و مسلط است. بدون اینکه سؤالی کرده باشی، با صدایی بم و لحنی که رگه‌ای از تهدید روانی در آن موج می‌زند، زمزمه می‌کند:
«هنوز بازه.»

کنار پایش، یک رسید کاغذی نم‌کشیده روی زمین افتاده است.`,

  activeEntityIds: ['exiting_man'] as string[],
  visibleObjectIds: ['cafe_door', 'cafe_entrance', 'street', 'wet_receipt', 'red_gloves'] as string[],
  canonFacts: NODE_01_FACTS,
};

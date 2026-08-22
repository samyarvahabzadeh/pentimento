import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_07_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  back_of_painting: 'CORE_MYSTERY_OBJECT',
  back_label: 'CORE_MYSTERY_OBJECT',
  label_numbers: 'CORE_MYSTERY_OBJECT',
};

export const NODE_07_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'INSPECT_BEHIND_PAINTING',
  'LIFT_PAINTING_CAREFULLY',
  'EXAMINE_BACK_LABEL',
  'PROPOSE_THEORY',
  'PEEL_REMAINING_LABEL',
  'ASK_NPC_ABOUT_LABEL',
];

export const NODE_07_FACTS = [
  {
    id: 'fact_painting_back_accessible',
    text: 'با بررسی قاب از کنار و فاصله دادن آرام آن از دیوار، سطح پشتی بوم در دید قرار می‌گیرد.',
  },
  {
    id: 'fact_old_ownership_label',
    text: 'یک برچسب مالکیت قدیمی در گوشهٔ پشتی بوم چسبانده شده است.',
  },
  {
    id: 'fact_partially_torn_label',
    text: 'بخشی از برچسب قدیمی کنده و مخدوش شده است و متن کامل آن از بین رفته است.',
  },
  {
    id: 'fact_label_numbers_14_3_7_55',
    text: 'روی بخش باقی‌ماندهٔ برچسب، تنها این اعداد سالم مانده‌اند: «14 / 3 / 7 / 55».',
  },
  {
    id: 'fact_mani_volleyball_subtext',
    text: 'مانی در حالی که زانوی آسیب‌دیده‌اش را ماساژ می‌دهد، از بازی والیبال دیروز می‌گوید اما نگاهش نگران به ساعت مچی‌اش می‌افتد: «استادم می‌گفت وقتی زانوت تیر می‌کشه یعنی دیر رسیدی... امشبم فکر می‌کردم ساعت هنوز یازده و ربع نشده و وقت دارم در پشتی رو ببندم، ولی این ساعت همیشه وقتی مهمه بازی درمیاره.»',
  },
];

export const NODE_07_INITIAL_STATE = {
  description: `پشت تابلوی نقاشی در انتهای سالن.
قاب تابلو کمی از دیوار فاصله گرفته است.
یک برچسب کاغذی قدیمی و کنده شده در پشت بوم به چشم می‌خورد.`,

  activeEntityIds: ['mani'] as string[],
  visibleObjectIds: ['back_of_canvas', 'frame_edge', 'torn_label', 'label_numbers'] as string[],
  canonFacts: NODE_07_FACTS,
};

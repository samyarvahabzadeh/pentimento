import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_07_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  back_of_painting: 'CORE_MYSTERY_OBJECT',
  back_label: 'CORE_MYSTERY_OBJECT',
  label_numbers: 'CORE_MYSTERY_OBJECT',
};

export const NODE_07_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_NPC_ABOUT_LABEL',
  'EXAMINE_BACK_LABEL',
  'EXIT_CAFE_TO_ALLEY',
  'INSPECT_BEHIND_PAINTING',
  'LIFT_PAINTING_CAREFULLY',
  'PEEL_REMAINING_LABEL',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
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
    id: 'fact_label_transfer_trace',
    text: 'اعداد روی برچسب (14 / 3 / 7 / 55) با جوهر کهنه ثبت شده‌اند و توالی یک زنجیره انتقال مالکیتی را نشان می‌دهند.',
  },
];

export const NODE_07_INITIAL_STATE = {
  description: `پشت تابلوی نقاشی در انتهای سالن.
قاب تابلو کمی از دیوار فاصله گرفته است.
یک برچسب کاغذی قدیمی و کنده شده در پشت بوم به چشم می‌خورد.`,

  activeEntityIds: [] as string[],
  visibleObjectIds: ['back_of_canvas', 'frame_edge', 'torn_label', 'label_numbers'] as string[],
  canonFacts: NODE_07_FACTS,
};

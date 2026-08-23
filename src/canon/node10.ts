import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_10_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  penti: 'CHARACTER_OBJECT',
  penti_new_object: 'INVESTIGATIVE_OBJECT',
  penti_blanket: 'NORMAL_OBJECT',
  penti_bowl: 'NORMAL_OBJECT',
  penti_toys: 'NORMAL_OBJECT',
};

export const NODE_10_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_HANIYEH_ABOUT_PENTI',
  'ASK_YASHIN_TO_SMELL_OBJECT',
  'BRING_OBJECT_TO_PENTI',
  'EXAMINE_PENTI_NEW_OBJECT',
  'EXIT_CAFE_TO_ALLEY',
  'OBSERVE_PENTI',
  'OBSERVE_PENTI_BEHAVIOR',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
  'SHOW_UNRELATED_CLUE_TO_PENTI',
  'SMELL_PENTI_NEW_OBJECT',
];

export const NODE_10_FACTS = [
  {
    id: 'fact_penti_area_environment',
    text: 'گوشهٔ دنج اختصاصی پنتی؛ پتوی نرم، ظرف غذا و چند اسباب‌بازی کوچک گربه در کنار دیوار سالن.',
  },
  {
    id: 'fact_penti_avoids_new_object',
    text: 'پنتی به وضوح از یکی از اشیای جدید دوری می‌کند و مسیر حرکت خود را برای حفظ فاصله از آن کج می‌کند.',
  },
  {
    id: 'fact_object_has_different_cleaner_smell',
    text: 'بوی مادهٔ تمیزکنندهٔ این شیء جدید با بوی معمول و همیشگی شوینده‌های محیط کافه تفاوت دارد.',
  },
];

export const NODE_10_INITIAL_STATE = {
  description: `گوشهٔ دنج اختصاصی پنتی در کنار سالن کافه پنتیمنتو.
پنتی روی پتو لم داده و گهگاه گوش‌هایش را تکان می‌دهد.
ظرف غذا، اسباب‌بازی‌ها و یک شیء تازه در این محدوده قرار دارند.`,

  activeEntityIds: ['haniyeh', 'yashin'] as string[],
  visibleObjectIds: ['penti', 'penti_blanket', 'penti_bowl', 'penti_toys', 'penti_new_object'] as string[],
  canonFacts: NODE_10_FACTS,
};

import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_08_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  storage_box_clean: 'INVESTIGATIVE_OBJECT',
  cardboard_boxes: 'NORMAL_OBJECT',
  coffee_packages: 'NORMAL_OBJECT',
  storage_shelves: 'NORMAL_OBJECT',
};

export const NODE_08_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'EXAMINE_STORAGE_GENERAL',
  'COMPARE_STORAGE_BOXES',
  'EXAMINE_CLEAN_BOX',
  'MOVE_OR_OPEN_CLEAN_BOX',
  'PROPOSE_THEORY',
  'ASK_NPC_ABOUT_STORAGE',
  'APPROACH_KITCHEN',
  'APPROACH_COUNTER',
];

export const NODE_08_FACTS = [
  {
    id: 'fact_storage_environment',
    text: 'فضای انبار کافه پنتیمنتو؛ چیدمان کارتن‌های مواد اولیه، بسته‌بندی‌ها و قفسه‌های نگهداری وسایل.',
  },
  {
    id: 'fact_coffee_aroma_present',
    text: 'در فضای انبار عطر طبیعی دانه‌های قهوه و محیط بسته به مشام می‌رسد.',
  },
  {
    id: 'fact_unusually_clean_box',
    text: 'در میان کارتن‌های خاک‌گرفته روی قفسه، یک جعبه قرار دارد که به شکل غیرعادی تمیز و عاری از لایهٔ غبار محیط است.',
  },
];

export const NODE_08_INITIAL_STATE = {
  description: `انبار کافه در بخش پشتی.
ردیف قفسه‌های فلزی و کارتن‌های روی هم چیده‌شده در نور مهتابی ضعیف قرار دارند.
بوی قهوه و مقوای بسته‌بندی در هوا پیچیده است.`,

  activeEntityIds: ['mani'] as string[],
  visibleObjectIds: ['cardboard_boxes', 'coffee_packages', 'storage_shelves', 'storage_box_clean'] as string[],
  canonFacts: NODE_08_FACTS,
};

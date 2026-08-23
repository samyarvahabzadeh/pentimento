import type { CanonicalActionId } from '../core/types.js';

export const NODE_04_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'EXAMINE_STEAM_WAND',
  'EXIT_CAFE_TO_ALLEY',
  'INSPECT_COFFEE_BEANS_TRAY',
  'LISTEN_THROUGH_STEAM',
  'RETURN_TO_TABLE_5',
];

export const NODE_04_FACTS = [
  {
    id: 'fact_espresso_steam_wand_setup',
    text: 'دستگاه اسپرسوی صنعتی با نازل بخار پرفشار (Steam Wand). صدای شدید خروج بخار در فواصل کوتاه، اصوات و گفتگوهای همزمان را می‌پوشاند و سبب افت وضوح صوتی می‌شود.',
  },
  {
    id: 'fact_adjacent_cupping_tray',
    text: 'کنار دستگاه اسپرسو، سینی نمونه‌های قهوه با چند ظرف کوچک نمونه‌برداری قرار دارد.',
  },
];

export const NODE_04_INITIAL_STATE = {
  description: `دستگاه اسپرسو و نازل بخار (Steam Wand) در انتهای کانتر.
صدای بخار و فعالیت باریستاها در جریان است.`,

  activeEntityIds: ['yashin', 'mani'] as string[],
  visibleObjectIds: ['espresso_machine', 'steam_wand', 'cupping_tray', 'milk_pitcher'] as string[],
  canonFacts: NODE_04_FACTS,
};

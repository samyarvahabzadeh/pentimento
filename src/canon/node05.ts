import type { CanonicalActionId } from '../core/types.js';

export const NODE_05_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_YASHIN_ABOUT_ROAST',
  'EXAMINE_UNKNOWN_SAMPLE',
  'EXIT_CAFE_TO_ALLEY',
  'RETURN_TO_TABLE_5',
];

export const NODE_05_FACTS = [
  {
    id: 'fact_unknown_coffee_sample',
    text: 'یک نمونه ناشناس از دانه‌های قهوه روی سینی کاپینگ کنار کانتر قرار دارد.',
  },
  {
    id: 'fact_yashin_lineage_observation',
    text: 'یاشین نمونه را بررسی و بو می‌کند و با تخصص حسی می‌گوید: «این قدیمیه. نه یعنی مونده نیست. می‌گم روش قدیمیه.» این نخستین اشاره به تبار (Lineage) و شیوه کهن فرآوری است.',
  },
];

export const NODE_05_INITIAL_STATE = {
  description: `بخش تست و کاپینگ قهوه در گوشه کانتر پنتیمنتو.
چند نمونه دانه قهوه برای ارزیابی روی میز است.
یاشین نمونه ناشناس را با دقت بررسی می‌کند.`,

  activeEntityIds: ['yashin', 'mani'] as string[],
  visibleObjectIds: ['cupping_tray', 'unknown_beans_sample', 'sensory_spoons', 'counter_area'] as string[],
  canonFacts: NODE_05_FACTS,
};

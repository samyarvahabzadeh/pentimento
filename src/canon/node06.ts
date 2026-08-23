import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_06_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  central_painting: 'CORE_MYSTERY_OBJECT',
  gallery_wall: 'NORMAL_OBJECT',
};

export const NODE_06_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'ANALYZE_PAINTING_ART_HISTORIAN',
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_NPC_ABOUT_PAINTING',
  'EXAMINE_PAINTING_ANGLED_LIGHT',
  'EXAMINE_PAINTING_CLOSE_SURFACE',
  'EXAMINE_PAINTING_GENERAL',
  'EXIT_CAFE_TO_ALLEY',
  'INSPECT_BEHIND_PAINTING',
  'RETURN_TO_TABLE_5',
  'TOUCH_OR_SCRAPE_PAINTING',
];

export const NODE_06_FACTS = [
  {
    id: 'fact_gallery_central_painting',
    text: 'تابلوی نقاشی نصب‌شده روی دیوار گالری در انتهای سالن؛ مرکز فیزیکی فضای کافه پنتیمنتو.',
  },
  {
    id: 'fact_painting_first_impression',
    text: 'در نگاه اول و با نور مستقیم سالن، هیچ ویژگی غیرعادی در سطح نقاشی به چشم نمی‌آید.',
  },
  {
    id: 'fact_underpaint_line_visible',
    text: 'در تابش نور زاویه‌دار، یک خط زیر لایهٔ فعلی رنگ دیده می‌شود.',
  },
  {
    // WINDOW SEED — True Ending prerequisite. Neutral visual observation only.
    // Unlocks only after EXAMINE_PAINTING_ANGLED_LIGHT or ART_HISTORIAN analysis.
    id: 'fact_painting_window_reflection',
    text: 'در همان زاویهٔ نور کج، انعکاسی روی سطح تابلو پدیدار می‌شود که شکل آن به قاب یک پنجره شبیه است — اما می‌تواند انعکاس قاب در یا قاب خود تابلو باشد.',
  },
];

export const NODE_06_INITIAL_STATE = {
  description: `بخش گالری در انتهای سالن کافه پنتیمنتو.
تابلوی نقاشی روی دیوار انتهای سالن نصب است.
نور سالن روی سطح تابلو می‌تابد.`,

  activeEntityIds: [] as string[],
  visibleObjectIds: ['gallery_wall', 'central_painting', 'frame'] as string[],
  canonFacts: NODE_06_FACTS,
};

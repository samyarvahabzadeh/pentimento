import type {
  CanonicalActionId,
  ObjectGroundingStrictness,
  RunState,
} from '../core/types.js';

export const NODE_18_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  underpainting_layers: 'CORE_MYSTERY_OBJECT',
  provenance_chain_board: 'INVESTIGATIVE_OBJECT',
};

export const NODE_18_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'EXAMINE_UNDERPAINTING_LAYERS',
  'SUPERIMPOSE_PAINTING_VERSIONS',
  'REVEAL_PROVENANCE_CHAIN_55',
  'CONFRONT_FINAL_INTERPRETATION',
  'MAKE_FINAL_DECISION_PRESERVE_TRUTH',
  'MAKE_FINAL_DECISION_PRESERVE_PEOPLE',
  'MAKE_FINAL_DECISION_TAKE_PRICE',
  'COMPLETE_RUN_AND_RESOLVE_ENDING',
];

export const NODE_18_FACTS = [
  {
    id: 'fact_underpainting_four_stages',
    text: 'روی هم قرار دادن لایه‌های زیرین نقاشی (Underpainting) چهار مرحلهٔ تغییر را آشکار می‌کند: یک دست، یک پنجره، یک فنجان و یک سایه.',
  },
  {
    id: 'fact_provenance_not_geographic_map',
    text: 'چهار مرحلهٔ نقاشی مختصات جغرافیایی یک گنجینه مخفی نیستند؛ بلکه چهار حلقه از یک زنجیرهٔ مالکیت و انتقال انسانی هستند.',
  },
  {
    id: 'fact_provenance_terminus_55',
    text: 'آخرین حلقهٔ زنجیرهٔ مالکیت به پلاک ۵۵ (کافه پنتیمنتو) ختم می‌شود؛ جایی که اصلاح نهایی روی بوم ثبت شده است.',
  },
];

export const NODE_18_INITIAL_STATE = {
  description: `سالن کافه پنتیمنتو در آستانهٔ طلوع آفتاب.
نور ملایم صبح از پنجره‌های قدی به سالن می‌تابد و بخار محو دستگاه اسپرسو در هوا معلق است.
لایه‌های زیرین تابلو در کنار هم قرار گرفته‌اند.
سالار، حانیه، مانی، یاشین و آرین گرشاسبی پشت میز ۵ جمع شده‌اند و در سکوت منتظر نتیجه‌گیری نهایی تو هستند.`,

  activeEntityIds: ['salar', 'haniyeh', 'mani', 'yashin', 'arian_g'] as string[],
  visibleObjectIds: ['underpainting_layers', 'provenance_chain_board', 'table_5', 'central_painting'] as string[],
  canonFacts: NODE_18_FACTS,
};

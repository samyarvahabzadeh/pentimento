import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_15_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  rear_exit_door: 'NORMAL_OBJECT',
  main_entrance_door: 'NORMAL_OBJECT',
  cafe_wall_clock: 'NORMAL_OBJECT',
};

export const NODE_15_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'ASK_WITNESS_ABOUT_REAR_ROUTE',
  'ASK_WITNESS_ABOUT_MAIN_ROUTE',
  'COMPARE_WITNESS_STATEMENTS',
  'INTERROGATE_WITNESS_TIME_REFERENCE',
  'ANCHOR_WITNESS_MEMORY',
  'ACCUSE_WITNESS_OF_LYING',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
  'APPROACH_COUNTER',
  'APPROACH_STORAGE',
];

export const NODE_15_FACTS = [
  {
    id: 'fact_route_testimony_rear',
    text: 'یکی از شاهدها شهادت می‌دهد که مرد ناشناس از مسیر پشتی و درب حیاط خلوت خارج شد.',
  },
  {
    id: 'fact_route_testimony_main',
    text: 'شاهد دیگری تأکید می‌کند که مرد از درب اصلی کافه به سمت خیابان رفت.',
  },
  {
    id: 'fact_route_testimony_conflict',
    text: 'تناقض آشکاری در روایت دو شاهد دربارهٔ مسیر خروج مرد ناشناس وجود دارد.',
  },
  {
    id: 'fact_witness_clock_discrepancy',
    text: 'مراجع زمانی و ساعت‌های مورد استناد دو شاهد با یکدیگر همخوانی ندارند و تفاوت مبنای زمانی را نشان می‌دهند.',
  },
];

export const NODE_15_INITIAL_STATE = {
  description: `سالن کافه پنتیمنتو؛ میان میزها و راهروی منتهی به خروجی‌ها.
روایت‌ها دربارهٔ نحوه و مسیر خروج مرد ناشناس دچار تناقض است و هر یک از حاضرین بر پایهٔ مشاهدهٔ خود صحبت می‌کند.`,

  activeEntityIds: ['mani_shojaee', 'haniyeh_mohammadi'] as string[],
  visibleObjectIds: ['rear_exit_door', 'main_entrance_door', 'cafe_wall_clock'] as string[],
  canonFacts: NODE_15_FACTS,
};

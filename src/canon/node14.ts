import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_14_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  parked_car: 'INVESTIGATIVE_OBJECT',
  car_windows: 'NORMAL_OBJECT',
  car_interior: 'NORMAL_OBJECT',
  curb: 'NORMAL_OBJECT',
};

export const NODE_14_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_PARKED_CAR',
  'EXAMINE_PARKED_CAR',
  'CHECK_CAR_WINDOWS_OR_INTERIOR',
  'CHECK_CAR_LICENSE_PLATE',
  'WAIT_AND_WATCH_CAR',
  'ATTEMPT_BREAK_IN_CAR',
  'ASK_NPC_ABOUT_CAR',
  'PROPOSE_THEORY',
  'OBSERVE_HOSSEINI_ALLEY',
  'RETURN_TO_TABLE_5',
  'ENTER_CAFE',
];

export const NODE_14_FACTS = [
  {
    id: 'fact_parked_car_appearance',
    text: 'خودرویی خاموش که در امتداد جدول کنار کوچه پارک شده است؛ بدنهٔ خودرو سرد و ساکت است.',
  },
  {
    id: 'fact_no_new_reliable_car_details',
    text: 'جزئیات قابل اتکای تازه‌ای در بررسی خودرو به دست نمی‌آید.',
  },
  {
    id: 'fact_car_is_potential_red_herring',
    text: 'خودرو الزاماً متعلق به دشمن یا تیم مراقبت نیست؛ هیچ مدرک معنادار یا قطعی از ارتباط آن با پرونده یافت نمی‌شود.',
  },
];

export const NODE_14_INITIAL_STATE = {
  description: `کنار خودروی پارک‌شده در حاشیهٔ کوچه حسینی.
موتور خودرو کاملاً خاموش است و شیشه‌ها تاریکی داخل کابین را منعکس می‌کنند.
سکوت کوچه بدون هیچ حرکتی از سوی خودرو ادامه دارد.`,

  activeEntityIds: ['arian_garshasbi'] as string[],
  visibleObjectIds: ['parked_car', 'car_windows', 'car_interior', 'curb'] as string[],
  canonFacts: NODE_14_FACTS,
};

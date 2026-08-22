import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_13_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  hosseini_alley_street: 'NORMAL_OBJECT',
  distant_motorcycle_sound: 'NORMAL_OBJECT',
  parked_car_exterior: 'INVESTIGATIVE_OBJECT',
};

export const NODE_13_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'EXIT_CAFE_TO_ALLEY',
  'OBSERVE_HOSSEINI_ALLEY',
  'LISTEN_DISTANT_MOTORCYCLE',
  'OBSERVE_SECOND_CAR_SIGHTING',
  'PROCEED_DOWN_ALLEY',
  'APPROACH_PARKED_CAR',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
  'ENTER_CAFE',
];

export const NODE_13_FACTS = [
  {
    id: 'fact_hosseini_alley_outdoor',
    text: 'اولین خروج از فضای امن کافه پنتیمنتو به کوچهٔ حسینی؛ صدای ملایم کافه محو می‌شود و هوای خنک شب و تاریکی کوچه نمایان است.',
  },
  {
    id: 'fact_distant_motorcycle_heard',
    text: 'صدای گنگ و گذرای یک موتورسیکلت در خیابان‌های دوردست به گوش می‌رسد.',
  },
  {
    id: 'fact_parked_car_second_sighting',
    text: 'همان خودرویی که پیش‌تر در اطراف کافه دیده شده بود، دوباره در کنارهٔ کوچه حسینی پارک شده است.',
  },
  {
    id: 'fact_threat_level_active',
    text: 'خروج به فضای باز شهری و تاریکی کوچه، سطح آسیب‌پذیری و تهدید محیطی را فعال کرده است.',
  },
];

export const NODE_13_INITIAL_STATE = {
  description: `کوچهٔ حسینی در امتداد ورودی کافه پنتیمنتو.
سکوت شبانهٔ کوچه با فاصله گرفتن از درب کافه عمیق‌تر می‌شود.
نور زرد چراغ‌های خیابان روی آسفالت سایه انداخته و در انتهای کوچه، خودرویی در حاشیه پارک شده است.`,

  activeEntityIds: ['arian_garshasbi'] as string[],
  visibleObjectIds: ['hosseini_alley_street', 'distant_motorcycle_sound', 'parked_car_exterior'] as string[],
  canonFacts: NODE_13_FACTS,
};

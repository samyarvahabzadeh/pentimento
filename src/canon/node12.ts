import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_12_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  camera_monitor: 'NORMAL_OBJECT',
  nvr_system: 'INVESTIGATIVE_OBJECT',
  camera_storage_logs: 'INVESTIGATIVE_OBJECT',
};

export const NODE_12_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'ANALYZE_WRITE_EVENTS',
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_MEHRI_ABOUT_CAMERAS',
  'EXAMINE_CAMERA_SYSTEM',
  'EXIT_CAFE_TO_ALLEY',
  'INSPECT_CAMERA_LOGS',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
];

export const NODE_12_FACTS = [
  {
    id: 'fact_camera_system_environment',
    text: 'میز مانیتورینگ و سیستم ضبط تصاویر دوربین‌های مداربسته کافه پنتیمنتو با نمایشگر و تجهیزات ذخیره‌سازی محلی.',
  },
  {
    id: 'fact_seven_minute_camera_gap',
    text: 'یک شکاف زمانی ۷ دقیقه‌ای در تایم‌لاین ویدیوهای ضبط‌شدهٔ دوربین‌های مداربسته وجود دارد.',
  },
  {
    id: 'fact_footage_was_never_written',
    text: 'این هفت دقیقه ویدیو پاک نشده، بلکه اساساً از ابتدا در سیستم ثبت و نوشته نشده است.',
  },
];

export const NODE_12_INITIAL_STATE = {
  description: `بخش مانیتورینگ دوربین‌های مداربسته کافه پنتیمنتو.
چند نمایشگر کوچک با تقسیم‌بندی زاویه‌های مختلف سالن و سیستم ثبت تصاویر روشن هستند.
آرین مهری در حال بررسی وضعیت ورودی سیستم روی مانیتور است.`,

  activeEntityIds: ['arian_mehri'] as string[],
  visibleObjectIds: ['camera_monitor', 'nvr_system', 'camera_storage_logs'] as string[],
  canonFacts: NODE_12_FACTS,
};

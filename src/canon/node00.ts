import type { CanonicalActionId } from '../core/types.js';

/**
 * NODE 00 — Opening / Role Selection
 *
 * This is a mandatory pre-game virtual node.
 * It plays the anonymous message intro and presents Role Selection.
 * No investigation occurs here; it transitions to NODE_01 on role pick.
 *
 * Canon rule: Role determines Investigation advantage ONLY.
 * It does NOT branch the story or create separate paths.
 */

export const NODE_00_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'SELECT_ROLE_ART_HISTORIAN',
  'SELECT_ROLE_COFFEE_ALCHEMIST',
  'SELECT_ROLE_SYSTEMS_ANALYST',
  'SELECT_ROLE_INVESTIGATOR',
];

/**
 * The canonical anonymous opening exchange.
 * Source: PENTIMENTO.md (story catalyst).
 */
export const INTRO_DIALOGUE = [
  { speaker: 'Unknown', text: 'این تابلو برای فروش نیست.' },
  { speaker: 'Player', text: 'کدوم تابلو؟' },
  { speaker: 'Unknown', text: 'دقیقاً.' },
] as const;

/**
 * Role descriptions shown to player during selection.
 * Each role provides an Investigation advantage only — no story separation.
 */
export const ROLE_DESCRIPTIONS: Record<string, { fa: string; advantage: string }> = {
  art_historian: {
    fa: 'مورخ هنری',
    advantage: 'بررسی تابلو و آثار تصویری دقیق‌تر است و لایه‌های پنهان بصری و انعکاس پنجره زودتر تحلیل می‌شوند.',
  },
  coffee_alchemist: {
    fa: 'کیمیاگر قهوه',
    advantage: 'حس بویایی و تحلیل ناهنجاری‌های محیطی قوی‌تر است؛ بوهای شویندهٔ نامتعارف، دانه‌های قهوه و رفتار پنتی سریع‌تر کشف می‌شوند.',
  },
  systems_analyst: {
    fa: 'تحلیلگر سیستم',
    advantage: 'تحلیل لاگ‌های دوربین، تایم‌استمپ‌ها و یکپارچگی داده‌های دیجیتال دقیق‌تر صورت می‌گیرد.',
  },
  investigator: {
    fa: 'کارآگاه',
    advantage: 'تحلیل تناقض شهادت شاهدان، جعل اسناد و اتصال منطقی شواهد قوی‌تر است.',
  },
};

/**
 * Role Selection Menu text (displayed to player in Telegram / CLI).
 */
export const ROLE_SELECTION_PROMPT = `سه جملهٔ کوتاه روی صفحه بود.
ناشناس، بدون پروفایل.
بدون ساعت ارسال.

یک پیام.
یک کافه.
یک تابلو.

قبل از اینکه وارد شوی — کی هستی؟

۱. مورخ هنری (Art Historian)
   ← تحلیل عمیق تابلو، لایه‌های پنهان رنگ و انعکاس‌های بصری

۲. کیمیاگر قهوه (Coffee Alchemist)
   ← درک ناهنجاری‌های حسی و محیطی، بوهای شیمیایی و رفتار پنتی

۳. تحلیلگر سیستم (Systems Analyst)
   ← خواندن لاگ‌های دوربین، رویدادهای نوشتن دیسک و داده‌های سیستمی

۴. کارآگاه (Investigator)
   ← تحلیل تناقض در شهادت شاهدان، اسناد جعلی و پیوند شواهد

برای انتخاب عدد یا نام نقش را بنویس.`;

/**
 * Returns true if the node is complete (player has selected a role).
 */
export function isNode00Complete(playerClass: string | undefined): boolean {
  return playerClass !== undefined && playerClass !== 'observer';
}

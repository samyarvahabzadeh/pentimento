import type { CanonicalActionId } from '../core/types.js';

export const NODE_00_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'SELECT_ROLE_ART_HISTORIAN',
  'SELECT_ROLE_COFFEE_ALCHEMIST',
  'SELECT_ROLE_SYSTEMS_ANALYST',
  'SELECT_ROLE_INVESTIGATOR',
];

export const INTRO_DIALOGUE = [
  { speaker: 'Unknown', text: 'این تابلو برای فروش نیست.' },
  { speaker: 'Salar', text: 'کدوم تابلو؟' },
  { speaker: 'Unknown', text: 'دقیقاً.' },
] as const;

export const ROLE_DESCRIPTIONS: Record<string, { fa: string; advantage: string }> = {
  art_historian: {
    fa: 'مورخ هنری',
    advantage: 'تحلیل دقیق جزئیات بصری، فرم‌ها و بافت آثار.',
  },
  coffee_alchemist: {
    fa: 'کیمیاگر قهوه',
    advantage: 'شامهٔ تیز، درک اتمسفر و هشدارهای حسی محیط کافه.',
  },
  systems_analyst: {
    fa: 'تحلیلگر سیستم',
    advantage: 'ذهن ساختاریافته، ردپای داده‌ها و سنجش زمان‌بندی وقایع.',
  },
  investigator: {
    fa: 'کارآگاه',
    advantage: 'تحلیل رفتار آدم‌ها، تناقض در گفتار و چیدن پازل شواهد.',
  },
};

export const ROLE_SELECTION_PROMPT = `🎙️ *ناشناس:*
«این تابلو برای فروش نیست.»

👤 *سالار صالحی:*
«کدوم تابلو؟»

🎙️ *ناشناس:*
«دقیقاً.»

━━━━━━━━━━━━━━━━━━━━

سه جملهٔ کوتاه، روی صفحهٔ گوشی سالار صالحی.
بدون شماره. بدون پروفایل. بدون ساعت ارسال.

سالار با صدایی گرفته پشت تلفن فقط یک چیز گفت:
«باید همین الان بیای پنتیمنتو... پای گذشته و این کافه در میونه.»

حالا ساعت ۰۰:۱۷ بامداد است.
کوچهٔ حسینی، پلاک ۵۵، در سرمای عظیمیه کرج.

قبل از اینکه بری تو — بگو با چه دیدی می‌خوای وارد این ماجرا بشی؟

۱. 📜 *مورخ هنری (Art Historian)*
   ← درک زیبایی‌شناسی، جزئیات بصری و دقت روی فرم و بافت اشیاء

۲. ☕ *کیمیاگر قهوه (Coffee Alchemist)*
   ← شامهٔ تیز، درک اتمسفر و حواس پنج‌گانه در محیط کافه

۳. 💻 *تحلیلگر سیستم (Systems Analyst)*
   ← ذهن ساختاریافته، تحلیل داده‌ها و ارزیابی زمان‌بندی اتفاقات

۴. 🔍 *کارآگاه (Investigator)*
   ← روان‌شناسی رفتار آدم‌ها، کشف تناقض در حرف‌ها و چیدن شواهد

━━━━━━━━━━━━━━━━━━━━
عدد یا اسم نقشت رو بنویس.`;

export function isNode00Complete(playerClass: string | undefined): boolean {
  return playerClass !== undefined && playerClass !== 'observer';
}

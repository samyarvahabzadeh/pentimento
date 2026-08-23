import type { CanonicalActionId, ObjectGroundingStrictness } from '../core/types.js';

export const NODE_11_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  invoice_rg_lot55: 'INVESTIGATIVE_OBJECT',
  office_ledgers: 'NORMAL_OBJECT',
  office_desk: 'NORMAL_OBJECT',
};

export const NODE_11_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'ANALYZE_INVOICE_FORGERY',
  'APPROACH_COUNTER',
  'APPROACH_GALLERY',
  'APPROACH_OFFICE',
  'APPROACH_PENTI_AREA',
  'APPROACH_SECURITY_DESK',
  'APPROACH_STORAGE',
  'ASK_SALAR_ABOUT_INVOICE',
  'COMPARE_OFFICE_INVOICES',
  'EXAMINE_INVOICE_RG_LOT55',
  'EXAMINE_OFFICE_LEDGER',
  'EXIT_CAFE_TO_ALLEY',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
];

export const NODE_11_FACTS = [
  {
    id: 'fact_office_environment',
    text: 'دفتر حسابداری آقای صالحی؛ ردیف زونکن‌های مالی منظم، فاکتورهای بایگانی‌شده و نظم دقیق اداری.',
  },
  {
    id: 'fact_invoice_text_rg_lot55_returned',
    text: 'فاکتوری در میان اسناد با متن صریح: «R.G. / Lot 55 / Returned».',
  },
  {
    id: 'fact_invoice_font_differs_from_others',
    text: 'فونت و چیدمان چاپی این فاکتور با تمام فاکتورها و سربرگ‌های رسمی و استاندارد کافه تفاوت آشکار دارد.',
  },
  {
    id: 'fact_invoice_is_forged',
    text: 'سند مالی کشف‌شده ساختگی و جعل‌شده است.',
  },
];

export const NODE_11_INITIAL_STATE = {
  description: `دفتر حسابداری کافه پنتیمنتو؛ فضایی آرام و منظم با قفسه‌های زونکن، پرونده‌های مالی و میز کار آقای صالحی.
آقای صالحی با نگاهی نافذ و آرام پشت میز نشسته و به دفتر کل نگاه می‌کند.`,

  activeEntityIds: ['salar_salehi'] as string[],
  visibleObjectIds: ['invoice_rg_lot55', 'office_ledgers', 'office_desk'] as string[],
  canonFacts: NODE_11_FACTS,
};

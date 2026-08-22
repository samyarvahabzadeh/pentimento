import type {
  CanonicalActionId,
  ObjectGroundingStrictness,
  RunState,
  ArchiveItem,
  TemporalRelation,
} from '../core/types.js';

export const NODE_17_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  archive_workspace: 'INVESTIGATIVE_OBJECT',
  timeline_board: 'NORMAL_OBJECT',
};

export const NODE_17_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'OPEN_ARCHIVE_WORKSPACE',
  'EXAMINE_ARCHIVE_ITEM',
  'CONNECT_ARCHIVE_EVIDENCE',
  'PROPOSE_TIMELINE_RELATION',
  'REVISE_TIMELINE_RELATION',
  'REMOVE_TIMELINE_RELATION',
  'RETRACT_THEORY',
  'ASK_NPC_FOR_SYNTHESIS_HINT',
  'SUBMIT_FINAL_TIMELINE',
  'CLOSE_ARCHIVE_WORKSPACE',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
];

export const NODE_17_FACTS = [
  {
    id: 'fact_archive_virtual_workspace_open',
    text: 'میز کار بررسی و تلفیق شواهد (Archive Workspace) باز شده و شواهد کشف‌شده در کنار هم قابل بازبینی و زمان‌بندی هستند.',
  },
  {
    id: 'fact_timeline_partial_order_active',
    text: 'چینش زمانی شواهد بر اساس تقدم و تأخر منطقی (Partial Order) تنظیم می‌شود.',
  },
];

/**
 * Dynamically builds ArchiveItem views over ALREADY-DISCOVERED evidence in the RunState.
 * ZERO items are invented if the underlying canonical evidence has not been discovered.
 */
export function buildArchiveItemsFromState(state: RunState): ArchiveItem[] {
  const ev = state.canonical.evidenceIds;
  const sceneFacts = state.scene.establishedFactIds;
  const items: ArchiveItem[] = [];

  // 1. Forged Invoice (RECEIPT)
  if (ev.includes('invoice_is_forged') || sceneFacts.includes('invoice_is_forged')) {
    items.push({
      id: 'archive_invoice_rg_lot55',
      sourceEvidenceIds: ['invoice_is_forged'],
      kind: 'RECEIPT',
      playerVisibleText: 'فاکتور جعلی R.G. با شماره Lot 55؛ سندی ساختگی برای مصادره کافه در ازای بدهی‌ها، که سالار آن را برای حفظ سقف خانواده از طلبکاران پنهان کرده بود.',
      knownTemporalFacts: ['پیش از بررسی آقای صالحی در دفتر بایگانی قرار گرفته است.'],
      knownRelations: ['انگیزه انسانی: فشار مالی طلبکاران بر سالار صالحی'],
      reliability: 95,
    });
  }

  // 2. Camera Gap (TIMESTAMP)
  if (ev.includes('seven_minute_camera_gap') || ev.includes('footage_was_never_written') || sceneFacts.includes('footage_was_never_written')) {
    items.push({
      id: 'archive_camera_gap_7min',
      sourceEvidenceIds: ev.includes('footage_was_never_written') ? ['footage_was_never_written', 'seven_minute_camera_gap'] : ['seven_minute_camera_gap'],
      kind: 'TIMESTAMP',
      playerVisibleText: 'شکاف ۷ دقیقه‌ای در مانیتورینگ؛ توقف ضبط از طریق وای‌فای توسط فردی که مثل مهری از به‌جا گذاشتن ردپا فرار می‌کرد.',
      knownTemporalFacts: ['پیش از بررسی لاگ‌ها توسط آرین مهری رخ داده است.'],
      knownRelations: ['انگیزه فنی: گریز از ثبت در دیسک'],
      reliability: 90,
    });
  }

  // 3. Painting Back Label (PROVENANCE)
  if (ev.includes('label_numbers_14_3_7_55') || sceneFacts.includes('label_numbers_14_3_7_55')) {
    items.push({
      id: 'archive_painting_label_numbers',
      sourceEvidenceIds: ['label_numbers_14_3_7_55'],
      kind: 'PROVENANCE',
      playerVisibleText: 'برچسب اصالت ۱۴/۳/۷/۵۵؛ زنجیره انتقال امانت که مقصد نهایی آن نه گنج، بلکه پلاک کوچه و خانه همین کافه است.',
      knownTemporalFacts: ['پیش از نصب تابلو روی دیوار گالری الصاق شده است.'],
      knownRelations: ['انگیزه تاریخی: تعلق هویت بوم به پلاک ۵۵'],
      reliability: 95,
    });
  }

  // 4. Witness Clock Discrepancy (NOTE)
  if (ev.includes('fact_witness_clock_discrepancy') || sceneFacts.includes('fact_witness_clock_discrepancy')) {
    items.push({
      id: 'archive_witness_clock_discrepancy',
      sourceEvidenceIds: ['fact_witness_clock_discrepancy'],
      kind: 'NOTE',
      playerVisibleText: 'اختلاف ساعت شهود؛ ناشی از باتری ضعیف ساعت مچی مانی و تعصب او در حفاظت از در پشتی، نه خیانت داخلی.',
      knownTemporalFacts: ['مربوط به لحظهٔ خروج مرد ناشناس در ساعات پایانی شب.'],
      knownRelations: ['انگیزه انسانی: خطای معصومانه در وفاداری به گروه'],
      reliability: 80,
    });
  }

  // 5. Clean Storage Box (NOTE)
  if (ev.includes('unusually_clean_box') || sceneFacts.includes('unusually_clean_box')) {
    items.push({
      id: 'archive_clean_storage_box',
      sourceEvidenceIds: ['unusually_clean_box'],
      kind: 'NOTE',
      playerVisibleText: 'جعبهٔ عاری از غبار در انبار کافه که نسبت به سایر کارتن‌ها غیرعادی و تازه‌جایگزین به نظر می‌رسد.',
      knownTemporalFacts: ['جایگزینی یا تمیزکاری آن در بازه‌ای نزدیک به رویدادهای اخیر رخ داده است.'],
      knownRelations: ['احتمال تعویض محتوا'],
      reliability: 85,
    });
  }

  // 6. Penti Cleaner Smell (NOTE)
  if (ev.includes('object_has_different_cleaner_smell') || ev.includes('penti_avoids_new_object')) {
    items.push({
      id: 'archive_penti_cleaner_scent',
      sourceEvidenceIds: ['object_has_different_cleaner_smell'],
      kind: 'NOTE',
      playerVisibleText: 'پرهیز پنتی از شیء جدید به دلیل بوی شویندهٔ نامتعارف و با منشأ محیطی متفاوت.',
      knownTemporalFacts: ['ورود شیء در ساعات اخیر.'],
      knownRelations: ['نشان‌دهنده ورود شیء از خارج کافه'],
      reliability: 85,
    });
  }

  // 7. Red Glove (PHOTO) — physical object evidence; no identity Canon-assigned
  if (ev.includes('red_glove_object') || sceneFacts.includes('examined_red_glove')) {
    items.push({
      id: 'archive_red_glove_object',
      sourceEvidenceIds: ['red_glove_object'],
      kind: 'PHOTO',
      playerVisibleText: 'دستکش پارچه‌ای قرمز کشف‌شده نزدیک کانتر. هویت صاحب آن تأیید نشده. Theory Ledger مسئول تفسیر است.',
      knownTemporalFacts: ['پیش از ورود بازیکن در صحنه حضور داشته.'],
      knownRelations: ['موقعیت مکانی: نزدیک کانتر و دراور'],
      reliability: 60,
    });
  }

  // 8. The Guest remark (MESSAGE) — canonical utterance, no speaker identity
  if (sceneFacts.includes('talked_to_the_guest') || sceneFacts.includes('fact_the_guest_pentimento_remark')) {
    items.push({
      id: 'archive_the_guest_remark',
      sourceEvidenceIds: [],
      kind: 'MESSAGE',
      playerVisibleText: '«اسم جالبیه. پنتیمنتو.» — گفته‌شده توسط مردی ناشناس که به تابلو خیره بود و قبل از پاسخ شنیدن رفت.',
      knownTemporalFacts: ['در همان شب وقایع اصلی در کافه اتفاق افتاده.'],
      knownRelations: ['مرتبط با تابلوی مرکزی کافه'],
      reliability: 70,
    });
  }

  return items;
}

/**
 * CANONICAL TEMPORAL CONSTRAINTS:
 * Hard rules derived strictly from canon and logical causality.
 */
export const CANONICAL_TIMELINE_CONSTRAINTS: TemporalRelation[] = [
  {
    leftItemId: 'archive_painting_label_numbers',
    relation: 'BEFORE',
    rightItemId: 'archive_invoice_rg_lot55',
    confidence: 'high',
    sourceEvidenceIds: ['label_numbers_14_3_7_55', 'invoice_is_forged'],
  },
  {
    leftItemId: 'archive_camera_gap_7min',
    relation: 'BEFORE',
    rightItemId: 'archive_witness_clock_discrepancy',
    confidence: 'medium',
    sourceEvidenceIds: ['seven_minute_camera_gap', 'fact_witness_clock_discrepancy'],
  },
];

/**
 * DESIGN AUGMENTATION:
 * Synthesis readiness prerequisite for NODE 17.
 * Requires at least 3 distinct evidence items and at least one temporal/contradiction clue.
 */
export function isNode17Eligible(state: RunState): boolean {
  const ev = state.canonical.evidenceIds;
  const facts = state.scene.establishedFactIds;

  const totalDistinctEvidence = new Set([...ev, ...facts.filter(f => f.startsWith('fact_'))]).size;
  const hasMultipleEvidence = totalDistinctEvidence >= 3;

  const hasTemporalOrContradiction =
    ev.includes('seven_minute_camera_gap') ||
    ev.includes('footage_was_never_written') ||
    ev.includes('invoice_is_forged') ||
    ev.includes('fact_witness_clock_discrepancy') ||
    facts.includes('fact_route_testimony_conflict');

  return hasMultipleEvidence && hasTemporalOrContradiction;
}

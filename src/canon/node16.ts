import type { CanonicalActionId, ObjectGroundingStrictness, RunState } from '../core/types.js';

export const NODE_16_STRICTNESS: Record<string, ObjectGroundingStrictness> = {
  collector_entity: 'INVESTIGATIVE_OBJECT',
  meeting_table: 'NORMAL_OBJECT',
  tea_cups: 'NORMAL_OBJECT',
};

export const NODE_16_ALLOWED_ACTIONS: CanonicalActionId[] = [
  'APPROACH_COLLECTOR_MEETING',
  'TALK_TO_COLLECTOR',
  'BLUFF_COLLECTOR',
  'REMAIN_SILENT_TO_COLLECTOR',
  'OBSERVE_COLLECTOR_REACTIONS',
  'ASK_COLLECTOR_ABOUT_INTENT',
  'ASK_COLLECTOR_ABOUT_LOT55',
  'ASK_COLLECTOR_ABOUT_PAINTING',
  'ACCEPT_FINANCIAL_OFFER',
  'REJECT_FINANCIAL_OFFER',
  'WITHDRAW_FROM_MEETING',
  'PROPOSE_THEORY',
  'RETURN_TO_TABLE_5',
];

export const NODE_16_FACTS = [
  {
    id: 'fact_collector_public_meeting',
    text: 'ملاقات در یک مکان عمومی با فردی موقر، مؤدب و خونسرد که درخواست گفتگوی مستقیم با آقای صالحی را داشته است.',
  },
  {
    id: 'fact_collector_canonical_line_1',
    text: 'طرف مقابل با لحنی ملایم و کنترل‌شده می‌گوید: «ما نمی‌خواهیم چیزی از شما بگیریم، آقای صالحی.»',
  },
  {
    id: 'fact_salar_canonical_line_2',
    text: 'آقای صالحی در پاسخ می‌پرسد: «پس چی می‌خواید؟»',
  },
  {
    id: 'fact_collector_canonical_line_3',
    text: 'طرف مقابل با تأکیدی سنجیده بیان می‌کند: «می‌خواهیم چیزی که هیچ‌وقت مال شما نبوده، مال شما باقی نماند.»',
  },
  {
    id: 'fact_collector_financial_offer_hint',
    text: 'طرف مقابل اشاره می‌کند که پیشنهاد مالی مناسبی برای واگذاری و عدم ادامهٔ پیگیری‌ها وجود دارد.',
  },
];

export const NODE_16_INITIAL_STATE = {
  description: `میزی در گوشهٔ آرام یک مکان عمومی.
مردی با لباس رسمی، آرام و بسیار مؤدب پشت میز نشسته است.
آقای صالحی روبروی او نشسته و فنجان چای دست‌نخورده روی میز قرار دارد.`,

  activeEntityIds: ['salar_salehi', 'collector'] as string[],
  visibleObjectIds: ['collector_entity', 'meeting_table', 'tea_cups'] as string[],
  canonFacts: NODE_16_FACTS,
};

/**
 * DESIGN AUGMENTATION:
 * NODE 16 is conditional and occurs only in branches where the player has progressed the investigation
 * and established sufficient exposure/threat for the Collector to initiate a meeting.
 */
export function isNode16Eligible(state: RunState): boolean {
  const hasThreat = state.canonical.threatActive === true || state.canonical.threat > 0;
  const hasMultipleEvidence = state.canonical.evidenceIds.length >= 2;

  // Case Escalation Requirement: Must have at least one high-value anomaly/conflict
  const ev = state.canonical.evidenceIds;
  const facts = state.scene.establishedFactIds;
  const hasEscalationEvidence =
    ev.includes('invoice_is_forged') ||
    ev.includes('footage_was_never_written') ||
    ev.includes('seven_minute_camera_gap') ||
    ev.includes('label_numbers_14_3_7_55') ||
    ev.includes('fact_witness_clock_discrepancy') ||
    facts.includes('fact_route_testimony_conflict');

  const hasVisitedOutdoorOrOffice =
    state.canonical.canonicalFlags.includes('exited_to_alley') ||
    state.canonical.canonicalFlags.includes('entered_office') ||
    state.canonical.canonicalFlags.includes('entered_security_desk');

  return hasThreat && hasMultipleEvidence && hasEscalationEvidence && hasVisitedOutdoorOrOffice;
}

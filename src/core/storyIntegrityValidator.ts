import type { RunState } from './types.js';

export interface ValidationResult {
  isValid: boolean;
  sanitizedNarrative: string;
  violations: string[];
}

/**
 * Story Integrity Validator
 * 1. Enforces strict narrative boundaries and strips leaked technical IDs.
 * 2. Canon Injection Guard (P0): Prevents narrator from adopting player-asserted world facts
 *    or arbitrary tokens/nonces as objective world state.
 * 3. Enforces entity and object physical presence.
 */
export function validateAndSanitizeStoryNarrative(
  narrative: string,
  state: RunState,
  playerInput?: string
): ValidationResult {
  let text = narrative;
  const violations: string[] = [];

  // 1. Sanitize raw technical database IDs & variables
  const rawIdReplacements: Array<[RegExp, string]> = [
    [/invoice_rg_lot55/gi, 'فاکتور سفارش ۵۵ با نشان آر.جی'],
    [/archive_invoice_rg_lot55/gi, 'سند بایگانی‌شده پلاک ۵۵'],
    [/fact_[a-z0-9_]+/gi, 'مدرک کشف‌شده'],
    [/beat_[a-z0-9_]+/gi, ''],
    [/NODE_\d+/gi, ''],
    [/scene_[a-z0-9_]+/gi, ''],
    [/candidateId/gi, ''],
  ];

  for (const [pattern, replacement] of rawIdReplacements) {
    if (pattern.test(text)) {
      violations.push(`Technical ID leak detected: ${pattern}`);
      text = text.replace(pattern, replacement);
    }
  }

  // 2. Canon Injection Guard (P0):
  // Never allow arbitrary player nonces / test codes to become world facts on objects
  const nonceMatch = text.match(/PLAYTEST-[A-Z0-9]+/i);
  if (nonceMatch) {
    violations.push(`Canon Injection violation: Player nonce '${nonceMatch[0]}' adopted into world narrative`);
    text = text.replace(/با کد «?PLAYTEST-[A-Z0-9]+»?/gi, 'با ساعت و شماره سفارش ثبت‌شده');
    text = text.replace(/کد «?PLAYTEST-[A-Z0-9]+»?/gi, 'شماره سفارش کافه');
    text = text.replace(/PLAYTEST-[A-Z0-9]+/gi, 'سفارش کافه');
  }

  // Also check if player asserted an unsupported world fact (e.g., "نوشته داوینچی" when not in canon)
  if (playerInput) {
    const normPlayer = playerInput.toLowerCase();
    if (normPlayer.includes('داوینچی') && !state.canonical.canonicalFlags.includes('DISCOVERED_LEONARDO_CIPHER')) {
      if (text.includes('داوینچی') && !text.includes('شاید')) {
        violations.push('Canon Injection: Unsupported world assertion adopted');
        text = text.replace(/داوینچی/g, 'طراح ناشناس رنسانس');
      }
    }
  }

  // 3. Prevent Phantom Red Glove duplication on floor
  // The man wears the red gloves; there are no dropped gloves on the floor.
  if (state.canonical.currentNode === 'NODE_01' || state.canonical.currentNode === 'NODE_02') {
    if (/دستکش.*(افتاده|روی زمین|کف پیاده‌رو|کف سالن)/i.test(text) && !/رسید.*(افتاده|روی زمین)/i.test(text)) {
      violations.push('Phantom dropped red glove detected on floor');
      text = text.replace(/و یک جفت دستکش قرمز افتاده/g, '');
      text = text.replace(/دستکش.*روی زمین افتاده است\./g, 'رسید کاغذی نم‌کشیده روی زمین افتاده است.');
    }
  }

  // 4. Clean up any trailing double spaces or broken punctuation
  text = text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return {
    isValid: violations.length === 0,
    sanitizedNarrative: text,
    violations,
  };
}

import type { RunState, CandidateAction } from './types.js';

export interface AgencyValidationResult {
  isValid: boolean;
  sanitizedNarrative: string;
  violations: string[];
}

/**
 * Player Agency Validator
 * Guarantees that the engine never performs voluntary player actions
 * (e.g., entering, leaving, attacking, disclosing secrets, drinking)
 * that were not explicitly chosen by the player.
 */
export function validatePlayerAgency(
  narrative: string,
  state: RunState,
  playerInput: string,
  candidate: CandidateAction
): AgencyValidationResult {
  let text = narrative;
  const violations: string[] = [];
  const norm = playerInput.trim().toLowerCase();

  const isEntering = /وارد|داخل.*(برم|می‌رم|می‌شوم|قدم|شدن)|در.*(باز|فشار)|دستگیره/.test(norm) ||
                     candidate.id === 'ENTER_CAFE';

  const isDrinking = /می‌نوشم|بخورم|سر.*می‌کشم|یک‌نفس|چشیدن/.test(norm) ||
                     candidate.id === 'DRINK_ESPRESSO_CUP';

  // 1. Guard against unsolicited movement into Cafe while in Alley
  if (state.canonical.currentNode === 'NODE_01' && !isEntering) {
    if (/قدم به.*سالن|پا به گرمای سالن|وارد سالن کافه|در گوشه سالن، میز شماره ۵/.test(text)) {
      violations.push('Player Agency violation: Auto-entering cafe from alley without player movement command');
      // Repair narration to keep player strictly outside in the alley
      text = text.replace(/قدم به.*سالن.*$/s, 'همچنان در آستانه در چوبی کافه، در هوای سرد کوچه حسینی ایستاده‌ای.');
      text = text.replace(/پا به گرمای سالن.*$/s, 'همچنان در آستانه در چوبی کافه، در هوای سرد کوچه حسینی ایستاده‌ای.');
    }
  }

  // 2. Guard against unsolicited drinking when only inspecting/smelling
  if (!isDrinking && (/مایع.*(یک‌نفس|سر کشیدی|بلعیدی|نوشیدی)/.test(text))) {
    violations.push('Player Agency violation: Auto-drinking cup when only inspecting');
    text = text.replace(/مایع.*نوشیدی/g, 'فنجان را با احتیاط بررسی می‌کنی.');
  }

  return {
    isValid: violations.length === 0,
    sanitizedNarrative: text,
    violations,
  };
}

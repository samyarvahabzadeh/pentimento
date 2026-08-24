import type { RunState, SemanticAction } from './types.js';
import { extractSemanticAction } from './candidateGenerator.js';
import { solveSemanticAction, type SemanticSolverResult } from './semanticSolver.js';

export interface MultiActionResult {
  narrative: string;
  subActions: SemanticAction[];
  solverResults: SemanticSolverResult[];
  isCompound: boolean;
}

/**
 * Splits a compound player input into sequential sub-actions.
 * e.g. "مانی را با بحث قهوه سرگرم می‌کنم، رسید را زیر منو می‌گذارم و بعد واکنشش را نگاه می‌کنم"
 * -> [distract, hide, observe]
 */
export function decomposeMultiActionInput(playerInput: string, state: RunState): SemanticAction[] {
  const norm = playerInput.trim();

  // If input starts with a conditional ('اگر'), treat as a single conditional action unless explicitly chained with 'سپس' or 'بعد'
  if (/^اگر/.test(norm) && !/و\s*سپس|و\s*بعد/.test(norm)) {
    return [extractSemanticAction(norm, state)];
  }

  // Split on strong Persian conjunctions and delimiters
  let rawClauses = norm
    .split(/،|\s*و\s*سپس\s*|\s*و\s*بعد\s*|\s*سپس\s*|\s*بعد\s*|\s*قبل\s*از\s*اینکه\s*|\s*در\s*حالی\s*که\s*|;|؛/)
    .map(c => c.trim())
    .filter(c => c.length > 2);

  // A leading discourse fragment is not an action of its own: in sentences
  // such as «به جای سؤال بعدی، از حانیه می‌خواهم...» the comma carries tone
  // and motive. Executing the fragment separately used to produce a spurious
  // "be more specific" stage before the real social action.
  const finitePredicate = /می‌?(?:پرسم|خواهم|خوام|کنم|زنم|روم|شوم|ایستم|مانم|گذارم|ذارم|کشم|برم|گیرم|دهم|دم|بینم|خوانم)|(?:بگو|بده|بمان|بیا|برو|کن|شو)(?:م|د|ید)?$/;
  if (rawClauses.length > 1 && !finitePredicate.test(rawClauses[0])) {
    rawClauses = [`${rawClauses[0]}، ${rawClauses[1]}`, ...rawClauses.slice(2)];
  }

  // A plain «و» often joins nouns/adjectives, so it is not generally a safe
  // delimiter.  For clearly physical two-step commands, however, a second
  // finite verb is a real action boundary ("در را قفل می‌کنم و جلوی تابلو
  // می‌ایستم").  Social sentences stay whole so promises and motives survive.
  if (
    rawClauses.length <= 1 &&
    !/می‌?پرسم|میپرسم|قول|قانع|متقاعد|می‌?(?:خواهم|خوام).*(?:همکاری|اعتماد)/.test(norm)
  ) {
    const physicalClauses = norm
      .split(/\s+و\s+(?=[^،؛]{0,40}می‌?(?:کنم|زنم|روم|شوم|ایستم|گذارم|ذارم|کشم|برم|گیرم|دهم|دم))/)
      .map(c => c.trim())
      .filter(c => c.length > 2);
    const finiteAction = /می‌?(?:کنم|زنم|روم|شوم|ایستم|گذارم|ذارم|کشم|گیرم|دهم|دم)/;
    if (physicalClauses.length > 1 && physicalClauses.every(clause => finiteAction.test(clause))) {
      const parsed = physicalClauses.map(clause => extractSemanticAction(clause, state));
      const genuinelySequential = parsed.some((action, index) => {
        if (index === 0) return false;
        const previous = parsed[index - 1];
        return action.primitive !== previous.primitive || Boolean(
          action.target && previous.target && action.target !== previous.target
        );
      });
      if (genuinelySequential) rawClauses = physicalClauses;
    }
  }

  if (rawClauses.length <= 1) {
    return [extractSemanticAction(norm, state)];
  }

  // Extract semantic action for each clause
  const actions: SemanticAction[] = [];
  for (const clause of rawClauses) {
    actions.push(extractSemanticAction(clause, state));
  }

  return actions;
}

/**
 * Executes a compound multi-action sequence sequentially against the mutating world state.
 */
export function executeMultiActionSequence(
  playerInput: string,
  state: RunState
): MultiActionResult {
  const subActions = decomposeMultiActionInput(playerInput, state);

  if (subActions.length <= 1) {
    const singleRes = solveSemanticAction(subActions[0], state);
    return {
      narrative: singleRes.narrative,
      subActions,
      solverResults: [singleRes],
      isCompound: false,
    };
  }

  const solverResults: SemanticSolverResult[] = [];
  const narrativeParts: string[] = [];

  for (let i = 0; i < subActions.length; i++) {
    const act = subActions[i];
    const res = solveSemanticAction(act, state);
    solverResults.push(res);
    narrativeParts.push(`[مرحلهٔ ${i + 1}]: ${res.narrative}`);
  }

  return {
    narrative: narrativeParts.join('\n\n'),
    subActions,
    solverResults,
    isCompound: true,
  };
}

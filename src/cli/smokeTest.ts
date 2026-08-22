/**
 * Quick smoke test: run 4 pairwise inputs through the full pipeline
 * and print results. Does NOT require LLM (works in fallback mode too).
 */
import { v4 as uuidv4 } from 'uuid';
import { RunState } from '../core/types.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { NODE_01_INITIAL_STATE } from '../canon/node01.js';
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';

function makeState(): RunState {
  return createInitialRunState(1);
}

const transport = createTransport();

const tests = [
  'اسمت چیه؟',
  'با مشت میزنمش',
  'دستهاش رو نگاه میکنم',
  'ذهنش رو میخونم',
];

console.log('\n=== PAIRWISE SMOKE TEST ===\n');

for (const input of tests) {
  const state = makeState();
  const result = await resolvePlayerTurn(state, input, transport);
  console.log(`INPUT: «${input}»`);
  console.log(`  INTERPRETATION: ${result.interpretation.kind} → ${result.interpretation.targetId ?? 'none'}`);
  console.log(`  SOURCE: ${result.source}`);
  console.log(`  NARRATIVE: ${result.narrative}`);
  console.log(`  VALIDATOR: action=${result.validation.acceptedActionId ?? 'none'} | effects=${result.validation.acceptedSoftEffects.length}`);
  console.log(`  STATE DIFF: stress ${result.stateBefore.canonical.stress}→${result.stateAfter.canonical.stress} | threat ${result.stateBefore.canonical.threat}→${result.stateAfter.canonical.threat}`);
  console.log('');
}

console.log('=== DONE ===');

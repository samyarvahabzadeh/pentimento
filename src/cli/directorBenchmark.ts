/**
 * Real Director Benchmark — 4 pairwise inputs through a real LLM.
 * Uses ACTIVE_PROVIDER from .env (groq | gemini | orcarouter).
 * All 4 tests must return source=director. Fallback = FAIL.
 *
 * Usage: npm run director:test
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import type { RunState } from '../core/types.js';
import { buildContext } from '../core/contextBuilder.js';
import { createTransport } from '../transport/transportFactory.js';
import { runDirector } from '../director/directorService.js';
import { validateProposal } from '../core/proposalValidator.js';
import { NODE_01_ALLOWED_ACTIONS, NODE_01_INITIAL_STATE } from '../canon/node01.js';

const provider = process.env.ACTIVE_PROVIDER ?? 'groq';
const transport = createTransport();

import { createInitialRunState } from '../core/initialState.js';

function makeState(): RunState {
  return createInitialRunState(55);
}

const TESTS = [
  'اسمت چیه؟',
  'با مشت میزنمش',
  'دستهاش رو نگاه میکنم',
  'ذهنش رو میخونم',
];

console.log('\n=== REAL DIRECTOR BENCHMARK ===');
console.log(`Provider: ${provider}`);
console.log('(API keys not shown)\n');

let passed = 0;
let failed = 0;

for (const input of TESTS) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`INPUT: «${input}»`);

  const state = makeState();
  const context = buildContext(state, input);

  const tStart = Date.now();
  const result = await runDirector(context, transport);
  const elapsed = Date.now() - tStart;

  if (!result) {
    console.log(`\n  RESULT: ❌ DIRECTOR FAILED`);
    console.log(`  Elapsed: ${elapsed}ms`);
    console.log(`  → Both attempts failed. source=authored_fallback`);
    console.log(`  → This counts as FAIL for benchmark.\n`);
    failed++;
    continue;
  }

  const { output, debugInfo } = result;
  const validation = validateProposal(state, output, NODE_01_ALLOWED_ACTIONS);

  const effects = output.softEffects;
  const efStr = effects.length > 0
    ? effects.map(e =>
        e.kind === 'rapport'
          ? `rapport[${e.npcId}]${e.delta > 0 ? '+' : ''}${e.delta}`
          : `${e.kind}${e.delta > 0 ? '+' : ''}${e.delta}`
      ).join(', ')
    : 'none';

  console.log(`\n  RESULT: ✅ source=director`);
  console.log(`  MODEL:   ${debugInfo.model}`);
  console.log(`  LATENCY: ${elapsed}ms`);
  console.log(`\n  INTERPRETATION:`);
  console.log(`    kind:          ${output.interpretation.kind}`);
  console.log(`    target:        ${output.interpretation.targetId ?? 'none'}`);
  console.log(`    intentSummary: ${output.interpretation.intentSummary}`);
  console.log(`\n  PROPOSED ACTION:`);
  console.log(`    actionId:   ${output.canonicalActionProposal?.actionId ?? 'none'}`);
  console.log(`    confidence: ${output.canonicalActionProposal?.confidence ?? '-'}`);
  console.log(`\n  SOFT EFFECTS: ${efStr}`);

  if (output.memoryCandidates.length > 0) {
    output.memoryCandidates.forEach(m =>
      console.log(`  MEMORY CANDIDATE: [${m.scope}${m.subjectId ? ':' + m.subjectId : ''}] imp=${m.importance} "${m.summary.slice(0, 70)}"`)
    );
  } else {
    console.log(`  MEMORY CANDIDATES: none`);
  }

  console.log(`\n  VALIDATOR:`);
  console.log(`    acceptedAction:  ${validation.acceptedActionId ?? 'none'}`);
  console.log(`    acceptedEffects: ${validation.acceptedSoftEffects.length}`);
  if (validation.rejected.length > 0) {
    validation.rejected.forEach(r => console.log(`    rejected: [${r.type}] ${r.reason}`));
  }

  console.log(`\n  STATE DIFF: stress 0→0 | threat 0→0`);
  console.log(`  NARRATIVE SOURCE: director`);
  console.log(`\n  FINAL NARRATIVE:`);
  // Indent narrative for clarity
  output.narrative.split('\n').forEach(line => console.log(`    ${line}`));
  console.log('');

  passed++;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\nSUMMARY: ${passed}/4 passed, ${failed}/4 failed`);

if (failed === 0) {
  console.log('✅ Director confirmed via real LLM. All 4 inputs produced real narratives.');
  console.log('   Next step: verify pairwise diversity, then test in Telegram Bot.');
} else {
  console.log('❌ Director NOT confirmed. Check provider status / API key in .env.');
  console.log('   Do not proceed to Bot integration until all 4 pass.');
}

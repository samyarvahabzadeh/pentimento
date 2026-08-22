/**
 * NODE 02 Integration Test — Table 5 (میز شماره ۵) & Transition.
 * Tests seamless transition from NODE 01 to NODE 02, evidence discovery,
 * Red Herring preservation on the red stain, and dialogue with Haniyeh.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import type { RunState } from '../core/types.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { NODE_01_INITIAL_STATE } from '../canon/node01.js';

const transport = createTransport();

import { createInitialRunState } from '../core/initialState.js';

function createInitialState(): RunState {
  return createInitialRunState(101);
}

const SCENARIO = [
  {
    step: 1,
    label: 'Transition: Enter Cafe from NODE 01 to NODE 02',
    input: 'از کنار مرد رد می‌شم و وارد سالن کافه می‌شم.',
    expectedNode: 'NODE_02',
  },
  {
    step: 2,
    label: 'Examine Table 5 & Untouched Espresso',
    input: 'میز شماره ۵ و فنجان قهوه‌ای که روش مونده رو بررسی می‌کنم.',
    expectedEvidence: 'untouched_espresso',
  },
  {
    step: 3,
    label: 'Examine Red Stain on Saucer (Red Herring Check)',
    input: 'لکه قرمز رنگ روی لبه نعلبکی رو با دقت نگاه می‌کنم ببینم چیه.',
    expectedEvidence: 'red_stain_saucer',
  },
  {
    step: 4,
    label: 'Question Haniyeh about the customer',
    input: 'رو به حانیه می‌پرسم: کسی که پشت این میز نشسته بود کی بود و کجا رفت؟',
    expectedSpeaker: 'haniyeh',
  },
  {
    step: 5,
    label: 'Observe Penti (Environmental Witness)',
    input: 'حرکات پنتی رو زیر نظر می‌گیرم ببینم چرا نزدیک این میز ۵ نمیاد.',
  },
  {
    step: 6,
    label: 'Approach Counter (Transition towards NODE 03)',
    input: 'از میز ۵ فاصله می‌گیرم و به سمت کانتر کافه می‌رم.',
  },
];

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 02 INTEGRATION TEST');
  console.log(`     Active Provider: ${process.env.ACTIVE_PROVIDER ?? 'gemini'}`);
  console.log('====================================================\n');

  let state = createInitialState();

  for (const turn of SCENARIO) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[STEP ${turn.step}] ${turn.label}`);
    console.log(`INPUT: «${turn.input}»`);

    const start = Date.now();
    const result = await resolvePlayerTurn(state, turn.input, transport);
    const latency = Date.now() - start;

    state = result.stateAfter;
    const dbg = result._debugInfo ?? {};
    const out = result._output ?? {};
    const val = result.validation;

    console.log(`\nDIRECTOR (${latency}ms) [src:${result.source} | model:${dbg.model ?? '?'}]`);
    console.log(`  «${result.narrative}»`);
    console.log(`\nMETRICS:`);
    console.log(`  Interpretation: kind=${result.interpretation.kind} | target=${result.interpretation.targetId ?? 'none'}`);
    console.log(`  Proposed Action: ${out.canonicalActionProposal?.actionId ?? 'none'}`);
    console.log(`  Accepted Action: ${val.acceptedActionId ?? 'none'}`);
    console.log(`  Current Node: ${state.canonical.currentNode} | Scene: ${state.scene.sceneId}`);
    console.log(`  Active Entities: [${state.scene.activeEntityIds.join(', ')}]`);
    console.log(`  Discovered Evidence: [${state.canonical.evidenceIds.join(', ')}]`);
    console.log(`  Canonical Flags: [${state.canonical.canonicalFlags.join(', ')}]`);

    // Pacing delay to respect API limits
    await new Promise(r => setTimeout(r, 4000));
  }

  console.log('\n====================================================');
  console.log('     NODE 02 INTEGRATION TEST COMPLETE');
  console.log('====================================================\n');
}

runTest().catch(console.error);

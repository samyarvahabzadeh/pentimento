/**
 * 15-Turn Continuity Acceptance Test for NODE 01.
 * Tests 15 sequential turns on the same RunState using the active LLM Director.
 * Validates continuity, memory retention, grounded clues, and deterministic physical resolution.
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
  return createInitialRunState(42);
}

const TURNS: Array<{ step: number; category: string; input: string }> = [
  { step: 1, category: 'Question to exiting man', input: 'سلام. اینجا چه جور جاییه و چرا گفتی هنوز بازه؟' },
  { step: 2, category: 'Observation', input: 'دست‌هاش و حالت پالتوش رو با دقت نگاه می‌کنم.' },
  { step: 3, category: 'Bluff', input: 'من از اماکن اومدم برای بازرسی، بهتره دقیق جواب بدی.' },
  { step: 4, category: 'Threat', input: 'اگه نگی این تو چه خبره، همین الان با گشت تماس می‌گیرم.' },
  { step: 5, category: 'Physical attempt', input: 'با مشت به سمتش حمله می‌کنم و سعی می‌کنم هلش بدم.' },
  { step: 6, category: 'Reference previous statement', input: 'چرا چند لحظه پیش گفتی اسم‌ها برای شناسنامه‌اند؟' },
  { step: 7, category: 'Repeated observation', input: 'دوباره به لبه در و دست‌هاش نگاه می‌کنم.' },
  { step: 8, category: 'Weird but possible action', input: 'روی زمین جلوی ورودی خم می‌شم و کف پیاده‌رو رو بررسی می‌کنم.' },
  { step: 9, category: 'Impossible action', input: 'تمرکز می‌کنم و ذهنش رو می‌خونم تا قصد واقعیش رو بفهمم.' },
  { step: 10, category: 'Normal dialogue', input: 'داخل کافه کسی هست؟ صدای چی میاد؟' },
  { step: 11, category: 'Normal dialogue', input: 'تو خودت چرا داری توی این سرما می‌ری؟' },
  { step: 12, category: 'Movement intention', input: 'یک قدم به سمت در نیمه‌باز برمی‌دارم.' },
  { step: 13, category: 'Normal dialogue', input: 'ممنون که در رو باز نگه داشتی.' },
  { step: 14, category: 'Observation inside', input: 'از لای در به داخل سالن کافه نگاه می‌اندازم.' },
  { step: 15, category: 'Canonical action (ENTER_CAFE)', input: 'دستگیره رو می‌گیرم و وارد کافه می‌شم.' },
];

async function runSession() {
  console.log('====================================================');
  console.log('     PENTIMENTO — 15-TURN CONTINUITY ACCEPTANCE TEST');
  console.log(`     Provider: ${process.env.ACTIVE_PROVIDER ?? 'gemini'}`);
  console.log('====================================================\n');
  console.log('OPENING SCENE:');
  console.log(NODE_01_INITIAL_STATE.openingNarrative);
  console.log('\n----------------------------------------------------\n');

  let state = createInitialState();

  for (const t of TURNS) {
    console.log(`\n━━━ [TURN ${t.step}/15] ${t.category.toUpperCase()} ━━━`);
    console.log(`PLAYER: «${t.input}»`);

    const start = Date.now();
    const result = await resolvePlayerTurn(state, t.input, transport);
    const latency = Date.now() - start;

    state = result.stateAfter;

    const dbg = result._debugInfo ?? {};
    const out = result._output ?? {};
    const validation = result.validation;

    console.log(`DIRECTOR [${dbg.model ?? '?'}] (${latency}ms) [src:${result.source}]:`);
    console.log(`  «${result.narrative}»`);
    console.log(`INTERPRETATION: kind=${result.interpretation.kind} | target=${result.interpretation.targetId ?? 'none'}`);
    console.log(`ACTION PROPOSAL: ${out.canonicalActionProposal?.actionId ?? 'none'}`);
    console.log(`VALIDATOR: acceptedAction=${validation.acceptedActionId ?? 'none'} | effects=${validation.acceptedSoftEffects.length}`);
    console.log(`STATE: turn=${state.scene.turn} | stress=${state.canonical.stress}/100 | threat=${state.canonical.threat}/100 | node=${state.canonical.currentNode}`);
    console.log(`FLAGS: [${state.canonical.canonicalFlags.join(', ')}]`);
    console.log(`NPC IMPRESSIONS: [${state.npcMemory.exiting_man?.impressions.map(i => i.tag).join(', ') ?? ''}]`);
    console.log(`RECENT BEATS COUNT: ${state.scene.recentBeats.length}`);

    // Pacing delay to remain within Cloud Free Tier RPM rate limit
    await new Promise(r => setTimeout(r, 4500));
  }

  console.log('\n====================================================');
  console.log('     15-TURN ACCEPTANCE RUN COMPLETE');
  console.log('====================================================\n');
}

runSession().catch(console.error);

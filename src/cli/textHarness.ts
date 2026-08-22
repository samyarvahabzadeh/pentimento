import * as readline from 'readline';
import { RunState } from '../core/types.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { v4 as uuidv4 } from 'uuid';
import { NODE_01_INITIAL_STATE } from '../canon/node01.js';
import * as dotenv from 'dotenv';
dotenv.config();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

import { createInitialRunState } from '../core/initialState.js';

function createInitialState(): RunState {
  return createInitialRunState();
}

let currentState = createInitialState();
const transport = createTransport();
const debugMode = process.env.PENTIMENTO_DEBUG === '1';

function formatDebug(result: any): string {
  const debug = result._debugInfo ?? {};
  const out = result._output ?? {};
  const stateBefore = result.stateBefore;
  const stateAfter = result.stateAfter;
  const effects = result.validation.acceptedSoftEffects;
  const effectStr = effects.length > 0
    ? effects.map((e: any) => `${e.kind}${e.delta > 0 ? '+' : ''}${e.delta}${e.npcId ? `(${e.npcId})` : ''}`).join(', ')
    : 'none';
  const rejected = result.validation.rejected;
  const rejStr = rejected.length > 0 ? rejected.map((r: any) => r.reason).join('; ') : 'none';

  return [
    '',
    '--- DEBUG ---',
    `source: ${result.source}`,
    `provider: ${debug.provider ?? 'unknown'}`,
    `model: ${debug.model ?? 'unknown'}`,
    `latency: ${debug.latency ?? 0}ms`,
    `parseSuccess: ${debug.parseSuccess ?? false}`,
    `interpretation: ${result.interpretation.kind} → ${result.interpretation.targetId ?? 'none'}`,
    `intentSummary: ${result.interpretation.intentSummary ?? '—'}`,
    `proposedAction: ${out.canonicalActionProposal?.actionId ?? 'none'}`,
    `validatorResult: ${result.validation.acceptedActionId ? 'accepted: ' + result.validation.acceptedActionId : 'no canonical action'}`,
    `acceptedEffects: ${effectStr}`,
    `rejectedEffects: ${rejStr}`,
    `stateDiff: stress: ${stateBefore.canonical.stress}→${stateAfter.canonical.stress}, threat: ${stateBefore.canonical.threat}→${stateAfter.canonical.threat}`,
    `memoryWrites: ${out.memoryCandidates?.length ?? 0} candidates`,
    `flags: [${stateAfter.canonical.canonicalFlags.join(', ')}]`,
    '-------------',
  ].join('\n');
}

async function processInput(input: string): Promise<void> {
  if (input.trim() === '') return;

  if (input.toLowerCase() === '/restart') {
    currentState = createInitialState();
    console.log('\n[Run reset]\n' + NODE_01_INITIAL_STATE.openingNarrative);
    return;
  }

  try {
    const result = await resolvePlayerTurn(currentState, input, transport);
    currentState = result.stateAfter;

    console.log('\n' + result.narrative);

    if (debugMode) {
      console.log(formatDebug(result));
    }
  } catch (e: any) {
    console.error('\n[خطا در پردازش نوبت]', e.message);
  }
}

rl.on('close', () => process.exit(0));

function ask(): void {
  rl.question('\n> ', async (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      rl.close();
      return;
    }
    await processInput(input);
    ask();
  });
}

console.log('\n=== PENTIMENTO ===');
console.log(NODE_01_INITIAL_STATE.openingNarrative);
console.log('\n(برای خروج: exit | برای ریست: /restart)');
ask();

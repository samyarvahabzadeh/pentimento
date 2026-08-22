/**
 * NODE 03 & Ambient / Run Flavor Multi-Run Simulation Test.
 * Validates:
 * 1. Seed-based variation across two distinct runs.
 * 2. Independent, isolated NPC knowledge between Yashin and Mani.
 * 3. Ambient / Flavor events do NOT create false canonical evidence.
 * 4. Deterministic POS evidence discovery.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

const TURNS = [
  { step: 1, label: 'Move to Counter (NODE 02 -> NODE 03)', input: 'از میز ۵ فاصله می‌گیرم و به سمت کانتر کافه می‌رم تا با باریستاها صحبت کنم.' },
  { step: 2, label: 'Question Yashin (Isolated Coffee Knowledge)', input: 'رو به یاشین می‌پرسم: فنجان میز ۵ دست‌نخورده مونده، تو سفارشش رو آماده کرده بودی؟' },
  { step: 3, label: 'Question Mani (Isolated Social / Banter Knowledge)', input: 'از مانی می‌پرسم: تو چیزی از اون مشتری یادت هست؟ رفتارش چطور بود؟' },
  { step: 4, label: 'Check POS Orders (Canonical Evidence)', input: 'روی مانیتور سیستم POS آخرین سفارش‌های ثبت‌شده میز ۵ رو چک می‌کنم.' },
  { step: 5, label: 'Follow-up on Table 5 & Gallery view', input: 'به یاشین می‌گم گفتی به تابلوی انتهای سالن نگاه می‌کرد؛ کدوم تابلو؟' },
];

async function simulateRun(runNumber: number, seed: number) {
  console.log(`\n====================================================`);
  console.log(`     SIMULATING RUN #${runNumber} (Seed: ${seed})`);
  console.log(`====================================================`);

  let state = createInitialRunState(seed);

  // Directly place player into NODE_02 (inside cafe) to start transition to NODE_03
  state.canonical.currentNode = 'NODE_02';
  state.canonical.currentScene = 'scene_table_5';
  state.scene.nodeId = 'NODE_02';
  state.scene.sceneId = 'scene_table_5';
  state.scene.activeEntityIds = ['haniyeh', 'penti'];

  console.log(`[Run #${runNumber} Assigned Flavors]:`);
  for (const [npc, f] of Object.entries(state.runFlavor)) {
    console.log(`  • ${npc}: ${f.flavorSummary} (topic: ${f.topic})`);
  }

  for (const t of TURNS) {
    console.log(`\n--- [RUN ${runNumber} | TURN ${t.step}] ${t.label} ---`);
    console.log(`PLAYER: «${t.input}»`);

    const start = Date.now();
    const result = await resolvePlayerTurn(state, t.input, transport);
    const latency = Date.now() - start;

    state = result.stateAfter;
    const dbg = result._debugInfo ?? {};
    const out = result._output ?? {};
    const val = result.validation;

    console.log(`DIRECTOR [${dbg.model ?? '?'}] (${latency}ms):`);
    console.log(`  «${result.narrative}»`);
    console.log(`INTERPRETATION: kind=${result.interpretation.kind} | target=${result.interpretation.targetId ?? 'none'}`);
    console.log(`ACTION: proposed=${out.canonicalActionProposal?.actionId ?? 'none'} | accepted=${val.acceptedActionId ?? 'none'}`);
    console.log(`STATE: node=${state.canonical.currentNode} | scene=${state.scene.sceneId}`);
    console.log(`ACTIVE NPCS: [${state.scene.activeEntityIds.join(', ')}]`);
    console.log(`CANONICAL EVIDENCE: [${state.canonical.evidenceIds.join(', ')}]`);
    console.log(`AMBIENT HISTORY COUNT: ${state.ambientHistory.length}`);

    // Pacing delay
    await new Promise(r => setTimeout(r, 4000));
  }

  return state;
}

async function runComparison() {
  console.log('####################################################');
  console.log('     PENTIMENTO — NODE 03 MULTI-RUN SIMULATION');
  console.log('####################################################');

  const finalState1 = await simulateRun(1, 101);
  const finalState2 = await simulateRun(2, 999);

  console.log('\n====================================================');
  console.log('     MULTI-RUN COMPARISON SUMMARY');
  console.log('====================================================');
  console.log(`Run 1 (Seed 101) Mani Flavor: "${finalState1.runFlavor.mani?.flavorSummary}"`);
  console.log(`Run 2 (Seed 999) Mani Flavor: "${finalState2.runFlavor.mani?.flavorSummary}"`);
  console.log(`Run 1 (Seed 101) Yashin Flavor: "${finalState1.runFlavor.yashin?.flavorSummary}"`);
  console.log(`Run 2 (Seed 999) Yashin Flavor: "${finalState2.runFlavor.yashin?.flavorSummary}"`);
  console.log(`Both Runs Discovered POS Evidence: Run 1=[${finalState1.canonical.evidenceIds}], Run 2=[${finalState2.canonical.evidenceIds}]`);
  console.log('====================================================\n');
}

runComparison().catch(console.error);

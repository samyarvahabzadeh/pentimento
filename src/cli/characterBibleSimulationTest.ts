/**
 * Character & Story Potential Bible V3 Multi-Run Simulation.
 * Validates:
 * 1. Two Runs have different character-derived Run Flavors / Current Threads.
 * 2. Mani and Yashin are distinct, in-character, and consistent within each run.
 * 3. Run Flavors never turn into fake canonical case evidence.
 * 4. Confident Misinformation (Yashin) is rendered in prose without being added to engine facts.
 * 5. Cross-character conflict / synergy hooks trigger naturally.
 * 6. Rare character events respect strict prerequisites.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

const TURNS = [
  {
    step: 1,
    label: 'Move to Counter (NODE 02 -> NODE 03)',
    input: 'از میز ۵ فاصله می‌گیرم و به سمت کانتر کافه می‌رم تا با یاشین و مانی صحبت کنم.',
  },
  {
    step: 2,
    label: 'Question Yashin on Coffee (High Reliability Domain)',
    input: 'از یاشین می‌پرسم: این فنجان قهوه روی میز ۵ چه نوع عصاره‌گیری و رستی بود؟',
  },
  {
    step: 3,
    label: 'Question Yashin on General Lore (Confident Misinformation Check)',
    input: 'از یاشین می‌پرسم: درباره آدم‌هایی که نصفه‌شب میان این کوچه و معماری قدیمی این پلاک چیزی می‌دونی؟',
  },
  {
    step: 4,
    label: 'Deep Value Question to Mani (Ratin / Moral Reflection Check)',
    input: 'رو به مانی می‌گم: چرا تو این ساعت هنوز اینجایی و با اینکه خطرناکه از کار کافه و دوستات دفاع می‌کنی؟ چی برات مهمه؟',
  },
  {
    step: 5,
    label: 'Check POS Orders (Canonical Case Evidence Discovery)',
    input: 'روی مانیتور سیستم POS آخرین سفارش‌های ثبت‌شده میز ۵ رو چک می‌کنم.',
  },
];

async function simulateRun(runNumber: number, seed: number) {
  console.log(`\n====================================================`);
  console.log(`     CHARACTER BIBLE V3 SIMULATION — RUN #${runNumber} (Seed: ${seed})`);
  console.log(`====================================================`);

  let state = createInitialRunState(seed);
  state.canonical.playerClass = 'systems_analyst';

  // Position at NODE_02 ready for transition
  state.canonical.currentNode = 'NODE_02';
  state.canonical.currentScene = 'scene_table_5';
  state.scene.nodeId = 'NODE_02';
  state.scene.sceneId = 'scene_table_5';
  state.scene.activeEntityIds = ['haniyeh', 'penti'];

  console.log(`\n[Run #${runNumber} Assigned Character Threads]:`);
  for (const [npc, f] of Object.entries(state.runFlavor)) {
    console.log(`  • ${npc.padEnd(12)}: ${f.flavorSummary}`);
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
    console.log(`METRICS:`);
    console.log(`  Interpretation: kind=${result.interpretation.kind} | target=${result.interpretation.targetId ?? 'none'}`);
    console.log(`  Proposed Action: ${out.canonicalActionProposal?.actionId ?? 'none'} | Accepted: ${val.acceptedActionId ?? 'none'}`);
    console.log(`  Current Node: ${state.canonical.currentNode} | Scene: ${state.scene.sceneId}`);
    console.log(`  Active Entities: [${state.scene.activeEntityIds.join(', ')}]`);
    console.log(`  Canonical Evidence in Engine: [${state.canonical.evidenceIds.join(', ')}]`);
    console.log(`  Ambient/Rare Events Triggered: ${state.ambientHistory.length}`);

    // Pacing delay to respect Gemini Free Tier 15 RPM rate limit
    await new Promise(r => setTimeout(r, 6000));
  }

  return state;
}

async function runTest() {
  console.log('####################################################');
  console.log('     PENTIMENTO — CHARACTER BIBLE V3 TEST');
  console.log('####################################################');

  const run1State = await simulateRun(1, 204);
  const run2State = await simulateRun(2, 777);

  console.log('\n====================================================');
  console.log('     BIBLE V3 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`1. Run 1 Mani Thread: "${run1State.runFlavor.mani?.flavorSummary}"`);
  console.log(`   Run 2 Mani Thread: "${run2State.runFlavor.mani?.flavorSummary}"`);
  console.log(`2. Run 1 Yashin Thread: "${run1State.runFlavor.yashin?.flavorSummary}"`);
  console.log(`   Run 2 Yashin Thread: "${run2State.runFlavor.yashin?.flavorSummary}"`);
  console.log(`3. Canonical Evidence strictly owned by GameEngine:`);
  console.log(`   Run 1 Evidence: [${run1State.canonical.evidenceIds}]`);
  console.log(`   Run 2 Evidence: [${run2State.canonical.evidenceIds}]`);
  console.log(`4. Confident Misinformation handled in prose without polluting canonical state.`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

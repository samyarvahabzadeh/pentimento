import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import type { RunState } from '../core/types.js';

function stateAt(node: string, seed: number): RunState {
  const state = createInitialRunState(seed);
  state.canonical.currentNode = node;
  state.canonical.currentScene = node.toLowerCase();
  state.scene.nodeId = node;
  state.scene.sceneId = node.toLowerCase();
  state.canonical.playerClass = 'investigator';
  return state;
}

// Novel prop use changes concrete state but never creates a clue by fiat.
const curtainState = stateAt('NODE_02', 2901);
const curtain = await resolvePlayerTurn(curtainState, 'پرده مخمل را کامل می‌کشم تا دید کوچه بسته شود');
assert.equal(curtainState.environmentState?.modifiedObjects?.curtain, 'closed_over_window');
assert.equal(curtainState.worldObjects?.curtain.state.isOpen, false);
assert.deepEqual(curtain._debugInfo?.trace?.evidenceAdded, []);

const menuState = stateAt('NODE_02', 2902);
await resolvePlayerTurn(menuState, 'پایه منو را از میز پنج به میز شماره یک منتقل می‌کنم');
assert.equal(menuState.worldObjects?.table5_menu.state.customAttributes?.placement, 'table_1');
assert.equal(menuState.environmentState?.modifiedObjects?.table5_menu, 'moved:table_1');
assert.equal(menuState.canonical.evidenceIds.length, 0);

const posState = stateAt('NODE_03', 2903);
await resolvePlayerTurn(posState, 'روشنایی نمایشگر پوز را با دکمه کناری کم می‌کنم');
assert.equal(posState.worldObjects?.pos_terminal.state.customAttributes?.displayBrightness, 'dim');
assert.equal(posState.canonical.evidenceIds.length, 0);

// Plausible failure has a diegetic cost/state and does not become a generic
// rejection or magical success.
const credentialState = stateAt('NODE_12', 2904);
const credential = await resolvePlayerTurn(credentialState, 'پسورد سیستم دوربین‌ها را بدون سرنخ حدس می‌زنم');
assert.equal(credentialState.environmentState?.modifiedObjects?.cctv_system, 'one_failed_login_attempt');
assert.match(credential.narrative, /تلاش ناموفق|رد می‌کند|قفل/);
assert.doesNotMatch(credential.narrative, /نیتت قابل فهم|کنش اجرایی روشنی ندارد/);
assert.equal(credentialState.canonical.evidenceIds.length, 0);

const labelState = stateAt('NODE_07', 2905);
const label = await resolvePlayerTurn(labelState, 'برچسب پشت بوم را بدون ابزار یک‌تکه جدا می‌کنم');
assert.match(label.narrative, /ریش‌ریش|یک‌تکه جدا نمی‌شود/);
assert.equal(labelState.worldObjects?.painting_back_label.state.isDamaged, undefined);
assert.equal(labelState.canonical.evidenceIds.length, 0);

const leapState = stateAt('NODE_02', 2906);
const leap = await resolvePlayerTurn(leapState, 'با یک پرش از سقف کافه به خیابان پشتی می‌پرم');
assert.equal(leapState.canonical.currentNode, 'NODE_02');
assert.match(leap.narrative, /فرود کنترل‌شده نیست|چند متر پایین‌تر/);

// Turning on a recorder stores a setup; it cannot award an unheard sound.
const recorderState = stateAt('NODE_02', 2907);
const recorder = await resolvePlayerTurn(
  recorderState,
  'گوشی‌ام را روی ضبط مدام می‌گذارم و زیر میز ۵ رها می‌کنم تا بعداً صداها را بشنوم'
);
assert.equal(recorderState.environmentState?.recordingActive, true);
assert.equal(recorderState.environmentState?.hiddenItems?.smartphone, 'under_table5');
assert.ok(!recorderState.canonical.evidenceIds.includes('fact_acoustic_distant_motorcycle'));
assert.match(recorder.narrative, /ضبط صدا|زیر میز شمارهٔ ۵/);

// Taking an object moves it to inventory but does not reveal its chemistry.
const cupState = stateAt('NODE_02', 2908);
const cup = await resolvePlayerTurn(cupState, 'فنجان را داخل کیفم می‌گذارم تا بعداً آزمایش کنم');
assert.ok(cupState.canonical.inventoryIds.includes('item_sample_cup'));
assert.ok(!cupState.canonical.evidenceIds.includes('fact_solvent_smell_cup'));
assert.equal(cupState.worldObjects?.table5_cup.state.location, 'in_bag');
assert.match(cup.narrative, /کیف/);

// Physical access is not gated behind knowing the authored clue, while the
// clue itself remains gated behind the right observation.
const behindState = stateAt('NODE_06', 2909);
await resolvePlayerTurn(behindState, 'می‌رم پشت بوم تا برچسبش را ببینم');
assert.equal(behindState.canonical.currentNode, 'NODE_07');
assert.ok(!behindState.canonical.evidenceIds.includes('fact_underpainting_hidden_layer'));

// Objects cannot teleport into the player's hands just because a hiding place
// was named in a different room.
const receiptState = stateAt('NODE_03', 2910);
const receipt = await resolvePlayerTurn(receiptState, 'رسید خیس را زیر منو پنهان می‌کنم');
assert.equal(receiptState.environmentState?.hiddenItems?.item_wet_receipt, undefined);
assert.match(receipt.narrative, /در دسترس|میدان دید/);

// Deception must remain deception even when phrased as reported speech.
const salarState = stateAt('NODE_11', 2911);
const bluff = await resolvePlayerTurn(salarState, 'به سالار دروغ می‌گم که پلیس پایین منتظر گزارشه');
assert.equal(bluff._debugInfo?.trace?.primitive, 'deceive');
assert.equal(salarState.npcTrust?.salar, -1);
assert.equal(salarState.clocks?.policeAttention, 1);
assert.match(bluff.narrative, /پلیس/);

// Waiting where the relevant witness is absent advances the world but does not
// generate that witness's clue for free.
const waitState = stateAt('NODE_02', 2912);
await resolvePlayerTurn(waitState, 'ده دقیقه ساکت می‌نشینم و هیچ حرفی نمی‌زنم');
assert.ok(!waitState.canonical.evidenceIds.includes('fact_guest_hesitation'));

// Compound reference grounding retains the human referent of «واکنشش» while
// still rejecting an inaccessible receipt in the middle step.
const compoundState = stateAt('NODE_03', 2913);
const compound = await resolvePlayerTurn(
  compoundState,
  'مانی را با بحث قهوه سرگرم می‌کنم، رسید را زیر منو می‌گذارم و بعد واکنشش را نگاه می‌کنم'
);
assert.match(compound.narrative, /مانی.*نگاهش|مانی.*انگشت/);
assert.doesNotMatch(compound.narrative, /با دقت محیط اطراف را بررسی می‌کنی/);
assert.equal(compoundState.environmentState?.hiddenItems?.item_wet_receipt, undefined);

console.log('PASS affordanceStateRegressionTest');

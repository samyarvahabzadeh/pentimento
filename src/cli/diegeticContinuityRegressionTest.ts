import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

const META_PROSE = /سرنخ تولید نمی|منتظر حل معما|چهارسرنخی|خودکار کشف|بحث تزئینی|تعداد سرنخ|نتیجه را مجانی/;

// Listening and peeking through the same doorway are different embodied acts.
const sensory = createInitialRunState(2901);
await resolvePlayerTurn(sensory, 'سلام، چرا گفتی هنوز بازه؟');
const heard = await resolvePlayerTurn(sensory, 'داخل کافه کسی هست؟ صدای چی میاد؟');
const peeked = await resolvePlayerTurn(sensory, 'از لای در به داخل سالن کافه نگاه می‌اندازم');
assert.equal(heard._debugInfo?.trace?.selectedCandidateId, 'SCENE_LISTEN');
assert.equal(peeked._debugInfo?.trace?.selectedCandidateId, 'SCENE_PEEK');
assert.match(heard.narrative, /صدای بخار|کافه خالی نیست/);
assert.match(peeked.narrative, /برشی باریک|زنی کنار|گربه/);
assert.notEqual(heard.narrative, peeked.narrative);

const shortPeekState = createInitialRunState(2900);
await resolvePlayerTurn(shortPeekState, 'من دوست قدیمی سالارم');
const shortPeek = await resolvePlayerTurn(shortPeekState, 'از لای در نگاه می‌کنم');
assert.equal(shortPeek._debugInfo?.trace?.selectedCandidateId, 'SCENE_PEEK');
assert.match(shortPeek.narrative, /برشی باریک/);

// Bluffing and threatening the courier persist after the player turns away.
const hostileOpening = createInitialRunState(2902);
await resolvePlayerTurn(hostileOpening, 'سلام، چرا گفتی هنوز بازه؟');
const bluff = await resolvePlayerTurn(hostileOpening, 'من از اماکن اومدم برای بازرسی، بهتره دقیق جواب بدی');
const threat = await resolvePlayerTurn(hostileOpening, 'اگه نگی این تو چه خبره، همین الان با گشت تماس می‌گیرم');
assert.ok(hostileOpening.canonical.canonicalFlags.includes('exiting_man_bluffed'));
assert.ok(hostileOpening.canonical.canonicalFlags.includes('exiting_man_threatened'));
assert.ok(bluff._debugInfo?.trace?.flagsAdded.includes('exiting_man_bluffed'));
assert.ok(threat._debugInfo?.trace?.flagsAdded.includes('exiting_man_threatened'));

const enteredAfterPressure = await resolvePlayerTurn(hostileOpening, 'دستگیره را می‌گیرم و وارد کافه می‌شوم');
assert.ok(hostileOpening.situation?.eventHistory.some(
  event => event.eventId === 'opening_courier_reports_false_authority_and_threat',
));
assert.equal(hostileOpening.situation?.fronts.redactor_cleanup.progress, 1);
assert.equal(hostileOpening.situation?.fronts.custodian_extraction.progress, 1);
assert.match(enteredAfterPressure.narrative, /«بازرس» و «گشت»|مسیرش را عوض می‌کند/);
assert.doesNotMatch(enteredAfterPressure.narrative, /نیتت قابل فهم|\[مرحلهٔ/);
assert.equal(enteredAfterPressure._debugInfo?.trace?.resolutionPath, 'generic_location_transition');
assert.equal(hostileOpening.environmentState?.entranceDoorOpen, true);
assert.equal(hostileOpening.worldObjects?.cafe_door.state.isOpen, true);
assert.match(enteredAfterPressure.narrative, /کامل چفت نمی‌شود/);

const closedAfterEntry = await resolvePlayerTurn(hostileOpening, 'در رو پشت سرم می‌بندم');
assert.equal(hostileOpening.environmentState?.entranceDoorOpen, false);
assert.equal(hostileOpening.worldObjects?.cafe_door.state.isOpen, false);
assert.match(closedAfterEntry.narrative, /آرام پشت سرت می‌بندی/);

// The same threshold is not scripted to fire that report in every run. A
// non-hostile opening leaves a measurably different situation history.
const calmOpening = createInitialRunState(2902);
await resolvePlayerTurn(calmOpening, 'سلام، چرا گفتی هنوز بازه؟');
await resolvePlayerTurn(calmOpening, 'دست‌ها و حالت پالتوش رو نگاه می‌کنم');
await resolvePlayerTurn(calmOpening, 'باشه، ممنون که جواب دادی');
const calmEntry = await resolvePlayerTurn(calmOpening, 'دستگیره را می‌گیرم و وارد کافه می‌شوم');
assert.ok(!calmOpening.situation?.eventHistory.some(
  event => event.eventId.startsWith('opening_courier_reports_'),
));
assert.doesNotMatch(calmEntry.narrative, /«بازرس» و «گشت»|پلیس را وسط کشید/);

// A player can also close the door as part of the entry action; the world
// remembers that phrasing instead of forcing a contradictory second action.
const explicitClose = createInitialRunState(2903);
await resolvePlayerTurn(explicitClose, 'دوست قدیمی سالارم');
const enteredAndClosed = await resolvePlayerTurn(explicitClose, 'وارد کافه می‌شوم و در را پشت سرم می‌بندم');
assert.equal(explicitClose.environmentState?.entranceDoorOpen, false);
assert.equal(explicitClose.worldObjects?.cafe_door.state.isOpen, false);
assert.match(enteredAndClosed.narrative, /پشت سرت چفت می‌کنی/);

// Off-screen Salar cannot suddenly become visible beside table five.
// Seed 2904 selects the custodian-first pressure pattern.
const inside = createInitialRunState(2904);
await resolvePlayerTurn(inside, 'دوست قدیمی سالارم و اومدم کمکش کنم');
await resolvePlayerTurn(inside, 'میام توی کافه');
await resolvePlayerTurn(inside, 'حانیه جان سالار کجاست؟');
const owner = await resolvePlayerTurn(inside, 'قهوه مال کیه؟');
assert.equal(inside.canonical.currentScene, 'scene_table5');
assert.match(owner.narrative, /از سمت اتاق حسابداری|درِ نیمه‌باز دفتر/);
assert.doesNotMatch(owner.narrative, /گوشی سالار روی میز می‌لرزد|سالار فوراً صفحه را برمی‌گرداند/);

// The courier's report is carried into the later network contact instead of
// disappearing after a single flavour line at the door.
const rememberedThreat = createInitialRunState(2904);
await resolvePlayerTurn(rememberedThreat, 'سلام، چرا گفتی هنوز بازه؟');
await resolvePlayerTurn(rememberedThreat, 'من از اماکن اومدم برای بازرسی');
await resolvePlayerTurn(rememberedThreat, 'اگه نگی چه خبره با گشت تماس می‌گیرم');
await resolvePlayerTurn(rememberedThreat, 'وارد کافه می‌شوم');
let networkMemory = '';
for (const action of ['چی می‌بینم؟', 'با حانیه سلام می‌کنم', 'به فنجان نگاه می‌کنم', 'به سالار زنگ می‌زنم و می‌گویم رسیدم']) {
  const turn = await resolvePlayerTurn(rememberedThreat, action);
  networkMemory += `\n${turn.narrative}`;
}
assert.match(networkMemory, /عنوان مهمان تازه تأیید نشد|از گشت اسم برده|عنوانی که به مأمور ما گفتی|گشت را وارد ماجرا/);

await resolvePlayerTurn(rememberedThreat, 'می‌روم داخل اتاق حسابداری پیش سالار');
const warnSalar = await resolvePlayerTurn(
  rememberedThreat,
  'به سالار می‌گم مرد بیرون فهمیده خودمو بازرس معرفی کردم و با گشت تهدیدش کردم',
);
assert.match(warnSalar.narrative, /پیام دربارهٔ تو|اسم و صورتت|بخشی از مذاکره/);
assert.ok(rememberedThreat.canonical.canonicalFlags.includes('salar_warned_about_courier_contact'));

const callFromInside = await resolvePlayerTurn(inside, 'به سالار زنگ میزنم و میگم رسیدم');
assert.match(callFromInside.narrative, /فهمیدم داخل شدی|از سمت در نیمه‌باز حسابداری/);
assert.doesNotMatch(callFromInside.narrative, /بیا داخل و/);

await resolvePlayerTurn(inside, 'روی صندلی می‌شینم');
await resolvePlayerTurn(inside, 'یه اسپرسو سفارش میدم');
const fracture = await resolvePlayerTurn(inside, 'در رو پشت سرم می‌بندم');
assert.match(fracture.narrative, /یاشین و مانی|درِ حسابداری/);

const openingFlow = [owner, callFromInside, fracture]
  .map(result => result.narrative)
  .join('\n');
assert.doesNotMatch(openingFlow, META_PROSE);

// The same phone action is rendered from the player's actual location.
const outsideCallState = createInitialRunState(2905);
await resolvePlayerTurn(outsideCallState, 'من دوست قدیمی سالارم');
const outsideCall = await resolvePlayerTurn(outsideCallState, 'به سالار زنگ میزنم و میگم رسیدم');
assert.match(outsideCall.narrative, /دوربین ورودی دیدمت/);

await resolvePlayerTurn(inside, 'می‌روم داخل اتاق حسابداری پیش سالار');
const faceToFaceCall = await resolvePlayerTurn(inside, 'به سالار زنگ میزنم و میگم رسیدم');
assert.match(faceToFaceCall.narrative, /گوشی سالار روی میز شروع به لرزیدن|همین‌جایی/);

console.log('PASS diegeticContinuityRegressionTest');

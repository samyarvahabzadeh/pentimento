import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { extractSemanticAction } from '../core/candidateGenerator.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

async function selectIdentity(input: string) {
  const state = createInitialRunState(2801);
  const result = await resolvePlayerTurn(state, input);
  return { state, result };
}

// Exact failed live transcript: every line must now resolve as ordinary
// tabletop language, not as a hidden command vocabulary.
const exact = createInitialRunState(2802);

const identity = await resolvePlayerTurn(exact, 'دوست قدیمیشم بینمون خاطره ی مشترک زیاد هست');
assert.equal(exact.canonical.currentNode, 'NODE_01');
assert.equal(exact.canonical.currentScene, 'scene_entrance');
assert.equal(exact.canonical.playerClass, 'investigator');
assert.equal(identity._debugInfo?.trace?.resolutionPath, 'character_intake');
assert.doesNotMatch(identity.narrative, /حمله|تهاجمی|ضربه/);
assert.match(identity.narrative, /دوست|خاطره/);

const recap = await resolvePlayerTurn(exact, 'چیشده ؟');
assert.equal(recap._debugInfo?.trace?.resolutionPath, 'conversational_grounding');
assert.match(recap.narrative, /سالار|پلاک ۵۵|مردی با پالتوی تیره/);
assert.doesNotMatch(recap.narrative, /نیتت قابل فهم|کنش اجرایی/);

const correction = await resolvePlayerTurn(exact, 'کاراگاهم اصلا');
assert.equal(correction._debugInfo?.trace?.resolutionPath, 'character_intake');
assert.equal(exact.canonical.playerClass, 'investigator');
assert.equal(exact.canonical.playerIdentityStatements?.length, 2);
assert.match(correction.narrative, /کارآگاهی|دوستی قدیمی/);

const enter = await resolvePlayerTurn(exact, 'میرم تو کافه');
assert.equal(enter._debugInfo?.trace?.resolutionPath, 'generic_location_transition');
assert.equal(exact.canonical.currentNode, 'NODE_02');
assert.equal(exact.canonical.currentScene, 'scene_table5');
assert.match(enter.narrative, /وارد سالن اصلی کافه/);

const overview = await resolvePlayerTurn(exact, 'چی میبینم؟');
assert.equal(overview._debugInfo?.trace?.resolutionPath, 'conversational_grounding');
assert.match(overview.narrative, /حانیه/);
assert.match(overview.narrative, /پنتی/);
assert.match(overview.narrative, /پیشخوان/);
assert.doesNotMatch(overview.narrative, /نیتت قابل فهم|کنش اجرایی/);

// A question at character intake remains a question and does not silently
// choose a class for the player.
const intakeQuestion = createInitialRunState(2803);
const intakeQuestionResult = await resolvePlayerTurn(intakeQuestion, 'چی شده؟');
assert.equal(intakeQuestion.canonical.currentNode, 'NODE_00');
assert.equal(intakeQuestion.canonical.playerClass, undefined);
assert.equal(intakeQuestionResult._debugInfo?.trace?.resolutionPath, 'conversational_grounding');

// The character prompt is an invitation, not a modal form. Acting or speaking
// immediately uses a provisional observer lens and resolves the same turn.
const deferredQuestion = createInitialRunState(2810);
const deferredQuestionResult = await resolvePlayerTurn(deferredQuestion, 'اسمت چیه؟');
assert.equal(deferredQuestion.canonical.currentNode, 'NODE_01');
assert.equal(deferredQuestion.canonical.playerClass, 'observer');
assert.ok(deferredQuestion.canonical.canonicalFlags.includes('player_identity_deferred'));
assert.ok(!deferredQuestion.canonical.canonicalFlags.includes('player_identity_declared'));
assert.equal(deferredQuestionResult._debugInfo?.trace?.primitive, 'ask');
assert.equal(deferredQuestionResult._debugInfo?.trace?.target, 'exiting_man');
assert.match(deferredQuestionResult.narrative, /اسم/);

const deferredAttack = createInitialRunState(2811);
const deferredAttackResult = await resolvePlayerTurn(deferredAttack, 'با مشت میزنمش');
assert.equal(deferredAttackResult._debugInfo?.trace?.primitive, 'damage');
assert.equal(deferredAttackResult._debugInfo?.trace?.target, 'exiting_man');
assert.ok(deferredAttack.canonical.canonicalFlags.includes('attacked_exiting_man'));

const deferredImpossible = createInitialRunState(2812);
const deferredImpossibleResult = await resolvePlayerTurn(deferredImpossible, 'ذهنش رو میخونم');
assert.match(deferredImpossibleResult.narrative, /نمی‌توانی ذهن کسی را مستقیم بخوانی/);
assert.doesNotMatch(deferredImpossibleResult.narrative, /نیتت قابل فهم|کنش اجرایی/);

const naturalThreat = createInitialRunState(2813);
await resolvePlayerTurn(naturalThreat, 'سلام، چرا گفتی هنوز بازه؟');
const naturalThreatResult = await resolvePlayerTurn(naturalThreat, 'اگه نگی چه خبره با گشت تماس می‌گیرم');
assert.equal(naturalThreatResult._debugInfo?.trace?.primitive, 'threaten');
assert.equal(naturalThreatResult._debugInfo?.trace?.target, 'exiting_man');
assert.doesNotMatch(naturalThreatResult.narrative, /سالار پشت تلفن همه‌چیز را نگفت/);

const groundLook = await resolvePlayerTurn(naturalThreat, 'جلوی ورودی خم می‌شم و کف پیاده‌رو رو بررسی می‌کنم');
assert.equal(groundLook._debugInfo?.trace?.primitive, 'inspect');
assert.equal(groundLook._debugInfo?.trace?.target, 'wet_receipt');
assert.equal(naturalThreat.environmentState?.doorBlocked, undefined);

// Open identity statements map to internal lenses while preserving raw text.
const identities = [
  ['من متخصص امنیت شبکه و تحلیل لاگ هستم', 'systems_analyst'],
  ['مرمتگر آثار تاریخی و کارشناس اصالت بومم', 'art_historian'],
  ['باریستام و شامه تیزی برای قهوه و حلال دارم', 'coffee_alchemist'],
  ['کاراگاهم اصلا', 'investigator'],
  ['من عکاس مستندم و برای ثبت واقعیت اومدم', 'observer'],
] as const;

for (const [input, expectedRole] of identities) {
  const { state, result } = await selectIdentity(input);
  assert.equal(state.canonical.playerClass, expectedRole, input);
  assert.equal(state.canonical.playerIdentity, input, input);
  assert.equal(result._debugInfo?.trace?.resolutionPath, 'character_intake', input);
}

// Substring safety: «مشترک» and «مشتری» are not fists. Explicit violence is.
const lexicalState = createInitialRunState(2804);
lexicalState.canonical.currentNode = 'NODE_01';
lexicalState.canonical.currentScene = 'scene_entrance';
assert.notEqual(extractSemanticAction('بین ما خاطره مشترک زیادی هست', lexicalState).primitive, 'damage');
assert.notEqual(extractSemanticAction('مشتری کافه رو میشناسم', lexicalState).primitive, 'damage');
assert.equal(extractSemanticAction('با مشت می‌زنمش', lexicalState).primitive, 'damage');
assert.notEqual(extractSemanticAction('من اهل هنر و گفت‌وگو هستم', lexicalState).primitive, 'move');
assert.equal(extractSemanticAction('حواسش رو پرت می‌کنم', lexicalState).primitive, 'distract');

// Colloquial movement and scene questions must generalize beyond the exact
// live wording.
for (const movement of ['میام توی سالن', 'وارد میشم', 'برم داخل کافه']) {
  const { state } = await selectIdentity('من دوست قدیمی سالارم');
  const moved = await resolvePlayerTurn(state, movement);
  assert.equal(state.canonical.currentScene, 'scene_table5', movement);
  assert.equal(moved._debugInfo?.trace?.resolutionPath, 'generic_location_transition', movement);
}

for (const question of ['اینجا چی هست؟', 'دور و برم رو نگاه می‌کنم', 'چه کسایی اینجان؟']) {
  const { state } = await selectIdentity('من دوست قدیمی سالارم');
  await resolvePlayerTurn(state, 'میرم تو کافه');
  const seen = await resolvePlayerTurn(state, question);
  assert.equal(seen._debugInfo?.trace?.resolutionPath, 'conversational_grounding', question);
  assert.match(seen.narrative, /حانیه|پنتی/, question);
}

// A less test-like human flow exercises addressee vs topic, ordinary social
// play, embodied actions, service requests, and a remote call.
const natural = createInitialRunState(2805);
const naturalIdentity = await resolvePlayerTurn(natural, 'دوست قدیمی سالارم و اومدم کمکش کنم');
assert.equal(naturalIdentity._debugInfo?.trace?.resolutionPath, 'character_intake');
assert.ok(natural.canonical.canonicalFlags.includes('player_salar_old_friend'));
assert.equal(natural.npcTrust?.salar, 1);

await resolvePlayerTurn(natural, 'میام توی کافه');

const locationQuestion = await resolvePlayerTurn(natural, 'حانیه جان سالار کجاست؟');
assert.equal(locationQuestion._debugInfo?.trace?.target, 'haniyeh');
assert.equal(locationQuestion._debugInfo?.trace?.secondaryTarget, 'salar');
assert.match(locationQuestion.narrative, /اتاق حسابداری/);

const ownerQuestion = await resolvePlayerTurn(natural, 'قهوه مال کیه؟');
assert.equal(ownerQuestion._debugInfo?.trace?.target, 'haniyeh');
assert.match(ownerQuestion.narrative, /مرد پالتوپوش/);

const pet = await resolvePlayerTurn(natural, 'پنتی رو آروم نوازش می‌کنم');
assert.equal(pet._debugInfo?.trace?.primitive, 'touch');
assert.ok(natural.canonical.canonicalFlags.includes('penti_comforted'));
assert.match(pet.narrative, /نوازش/);

const sit = await resolvePlayerTurn(natural, 'روی صندلی می‌شینم');
assert.equal(sit._debugInfo?.trace?.primitive, 'use');
assert.equal(natural.environmentState?.playerPosture, 'seated_at_table5');
assert.match(sit.narrative, /می‌نشینی/);

const order = await resolvePlayerTurn(natural, 'یه اسپرسو سفارش میدم');
assert.equal(order._debugInfo?.trace?.target, 'haniyeh');
assert.ok(natural.canonical.canonicalFlags.includes('player_ordered_espresso'));
assert.match(order.narrative, /سفارش را.*ثبت|اسپرسو؛ چشم/);
assert.doesNotMatch(order.narrative, /پاسخ قبلی|همان جمله را از نو/);

const closeDoor = await resolvePlayerTurn(natural, 'در رو پشت سرم می‌بندم');
assert.equal(closeDoor._debugInfo?.trace?.primitive, 'use');
assert.equal(natural.environmentState?.entranceDoorOpen, false);
assert.match(closeDoor.narrative, /درِ شیشه‌ای را.*می‌بندی/);

const catQuestion = await resolvePlayerTurn(natural, 'از حانیه میپرسم چرا گربه ترسیده؟');
assert.equal(catQuestion._debugInfo?.trace?.target, 'haniyeh');
assert.match(catQuestion.narrative, /پنتی.*فنجون|فنجون.*پنتی/);
assert.doesNotMatch(catQuestion.narrative, /پاسخ قبلی|همان جمله را از نو/);

const call = await resolvePlayerTurn(natural, 'به سالار زنگ میزنم و میگم رسیدم');
assert.equal(call._debugInfo?.trace?.target, 'salar');
assert.equal(call._debugInfo?.trace?.primitive, 'ask');
assert.match(call.narrative, /سالار.*جواب می‌دهد|دیدمت/);
assert.doesNotMatch(call.narrative, /رسید.*زمین|کاغذ|دسترس/);

// «بی‌خیال» may abandon one lead without accidentally ending the whole run.
const skipLead = await resolvePlayerTurn(natural, 'بیخیال فنجون، از حانیه میپرسم سالار کجاست');
assert.equal(natural.canonical.endingId, undefined);
assert.equal(skipLead._debugInfo?.trace?.target, 'haniyeh');

const abandon = createInitialRunState(2806);
await resolvePlayerTurn(abandon, 'من برای پول وارد این ماجرا شدم');
await resolvePlayerTurn(abandon, 'میرم تو کافه');
const abandonResult = await resolvePlayerTurn(abandon, 'این پرونده رو بیخیال، میرم خونه');
assert.equal(abandon.canonical.endingId, 'BAD_ENDING_ABANDONMENT_ARSON');
assert.match(abandonResult.narrative, /پایان تلخ|آتش‌سوزی/);

console.log('CONVERSATIONAL_FREEDOM_REGRESSION_PASS');

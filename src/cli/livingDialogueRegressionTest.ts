import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

// A composite identity must survive intake as a composite—not collapse to the
// relationship half while silently keeping the profession only in state.
const composite = createInitialRunState(3001);
const compositeArrival = await resolvePlayerTurn(
  composite,
  'من کارآگاه خصوصی و دوست قدیمی سالارم',
);
assert.equal(composite.canonical.playerClass, 'investigator');
assert.ok(composite.canonical.canonicalFlags.includes('player_salar_old_friend'));
assert.match(compositeArrival.narrative, /دوست|گذشتهٔ مشترک/);
assert.match(compositeArrival.narrative, /کارآگاه|حرفه/);

// The courier answers the topic actually asked. Purpose, opening hours and a
// follow-up about the object are separate authored topics with durable memory.
const purposeState = createInitialRunState(3002);
await resolvePlayerTurn(purposeState, 'من دوست قدیمی سالارم');
const purpose = await resolvePlayerTurn(
  purposeState,
  'از مرد پالتویی می‌پرسم این وقت شب اینجا چه کار می‌کنه',
);
assert.match(purpose.narrative, /منتظر تحویلی|پیش از نیمه‌شب/);
assert.doesNotMatch(purpose.narrative, /من نگفتم برای مشتری‌ها بازه/);
assert.ok(purposeState.canonical.canonicalFlags.includes('courier_disclosed_missed_handoff'));

const objectFollowUp = await resolvePlayerTurn(
  purposeState,
  'ازش می‌پرسم چی رو باید تحویل می‌گرفتی؟',
);
assert.match(objectFollowUp.narrative, /یک قاب|ارزشش روی سطحش نیست/);
assert.ok(purposeState.canonical.canonicalFlags.includes('courier_named_frame_delivery'));
assert.ok(purposeState.environmentState?.npcTopicHistory?.exiting_man?.includes('purpose'));
assert.ok(purposeState.environmentState?.npcTopicHistory?.exiting_man?.includes('handoff_object'));

const repeatedPurpose = await resolvePlayerTurn(
  purposeState,
  'پس دقیق بگو این وقت شب اینجا چه کار می‌کردی؟',
);
assert.match(repeatedPurpose.narrative, /یک قدم دیگر|فرصت گفت‌وگو بی‌هزینه نمی‌ماند/);

const hoursState = createInitialRunState(3003);
await resolvePlayerTurn(hoursState, 'من مورخ هنری‌ام');
const openingHours = await resolvePlayerTurn(hoursState, 'چرا گفتی هنوز بازه؟');
assert.match(openingHours.narrative, /برای مشتری‌ها بازه|باید چیزی را پس بگیره/);
assert.doesNotMatch(openingHours.narrative, /منتظر تحویلی بودم که قرار بود/);

const receiptState = createInitialRunState(3004);
await resolvePlayerTurn(receiptState, 'من دوست قدیمی سالارم');
const receiptQuestion = await resolvePlayerTurn(
  receiptState,
  'از مرد پالتویی می‌پرسم این رسید خیس چه ربطی به تو داره؟',
);
assert.match(receiptQuestion.narrative, /رسید برای قهوه|ساعتش برای تحویل/);
assert.ok(receiptState.canonical.canonicalFlags.includes('courier_linked_receipt_to_handoff'));

const appearanceState = createInitialRunState(3005);
await resolvePlayerTurn(appearanceState, 'من کارآگاهم');
const appearance = await resolvePlayerTurn(
  appearanceState,
  'دست‌هاش و حالت پالتوش رو با دقت نگاه می‌کنم',
);
assert.match(appearance.narrative, /دستکش قرمز/);
assert.match(appearance.narrative, /پالتو|جیب داخلی|برآمدگی/);

// Once the player sees the courier send the report, Salar's later reaction
// must acknowledge that concrete event instead of speaking hypothetically.
const reportState = createInitialRunState(3006);
await resolvePlayerTurn(reportState, 'من کارآگاه خصوصی و دوست قدیمی سالارم');
await resolvePlayerTurn(reportState, 'از مرد پالتویی می‌پرسم اینجا چه کار می‌کنه');
await resolvePlayerTurn(reportState, 'من از اماکن اومدم؛ بهتره دقیق جواب بدی');
await resolvePlayerTurn(reportState, 'اگه حرف نزنی با گشت تماس می‌گیرم');
await resolvePlayerTurn(reportState, 'دستگیره را می‌گیرم و وارد کافه می‌شوم');
assert.ok(reportState.situation?.eventHistory.some(
  event => event.eventId === 'opening_courier_reports_false_authority_and_threat',
));
await resolvePlayerTurn(reportState, 'می‌روم داخل اتاق حسابداری پیش سالار');
const reportToSalar = await resolvePlayerTurn(
  reportState,
  'به سالار می‌گم مرد بیرون فهمیده خودمو بازرس معرفی کردم و با گشت تهدیدش کردم',
);
assert.match(reportToSalar.narrative, /حرکت روی گوشی.*گزارش تو|بخشی از مذاکره/);
assert.ok(reportState.canonical.canonicalFlags.includes('salar_warned_about_courier_contact'));

console.log('PASS livingDialogueRegressionTest');

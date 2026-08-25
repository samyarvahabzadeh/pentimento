import assert from 'node:assert/strict';
import {
  AccessAttemptLimiter,
  fingerprintAccessPassword,
  normalizeAccessPassword,
  readAccessPasswordConfig,
  verifyAccessPassword,
} from '../telegram/accessControl.js';
import { buildPlayerHelp, buildRecapPanel, buildWherePanel } from '../telegram/playerPanel.js';
import { grantAccess, isAccessGranted, resetAllRuns, revokeAccess } from '../storage/db.js';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

assert.equal(readAccessPasswordConfig('').active, false);
assert.equal(readAccessPasswordConfig('short').reason, 'too_short');
const configured = readAccessPasswordConfig('  Alpha–راز–۱۴۰۵  ');
assert.equal(configured.active, true);
assert.equal(normalizeAccessPassword('  Alpha–راز–۱۴۰۵  '), 'Alpha–راز–۱۴۰۵');
assert.ok(configured.normalizedPassword);
assert.ok(configured.fingerprint);
assert.equal(verifyAccessPassword('Alpha–راز–۱۴۰۵', configured.normalizedPassword!), true);
assert.equal(verifyAccessPassword('alpha–راز–۱۴۰۵', configured.normalizedPassword!), false);

const limiter = new AccessAttemptLimiter(3, 1_000);
assert.equal(limiter.recordFailure('tester', 1_000).remainingAttempts, 2);
assert.equal(limiter.recordFailure('tester', 1_100).remainingAttempts, 1);
const blocked = limiter.recordFailure('tester', 1_200);
assert.equal(blocked.allowed, false);
assert.equal(blocked.retryAfterSeconds, 1);
assert.equal(limiter.status('tester', 2_201).allowed, true);

const fp = fingerprintAccessPassword('Alpha–راز–۱۴۰۵');
grantAccess('alpha-user', fp);
assert.equal(isAccessGranted('alpha-user', fp), true);
assert.equal(isAccessGranted('alpha-user', fingerprintAccessPassword('different-secret')), false);
resetAllRuns();
assert.equal(isAccessGranted('alpha-user', fp), true, 'story reset must preserve invited tester access');
revokeAccess('alpha-user');
assert.equal(isAccessGranted('alpha-user', fp), false);

const state = createInitialRunState(21101);
const panelTurn = state.scene.turn;
assert.match(buildPlayerHelp(), /زبان خودت|\/where|\/recap|\/logout/);
assert.match(buildWherePanel(state), /زمان داستان را جلو نمی‌برد/);
assert.match(buildRecapPanel(state), /هویت و انگیزه|زمان داستان را جلو نمی‌برد/);
assert.equal(state.scene.turn, panelTurn, 'player panels must not consume a story turn');

await resolvePlayerTurn(state, 'من دوست قدیمی سالارم و قهوه را هم حرفه‌ای می‌شناسم');
await resolvePlayerTurn(state, 'در کافه را باز می‌کنم و می‌روم داخل سالن');
await resolvePlayerTurn(state, 'می‌روم پشت پیشخوان پیش یاشین');

const hello = await resolvePlayerTurn(state, 'سلام یاشین');
assert.equal(hello._debugInfo?.trace?.target, 'yashin');
assert.match(hello.narrative, /درود بر شما/);

const evidenceBeforePersonality = [...state.canonical.evidenceIds];
const fifa = await resolvePlayerTurn(state, 'یاشین تو فیفا چطوری؟');
assert.equal(fifa._debugInfo?.trace?.target, 'yashin');
assert.match(fifa.narrative, /خیر.*سؤال درست|فیفا/s);
assert.ok(state.canonical.canonicalFlags.includes('yashin_fifa_boast_heard'));
assert.deepEqual(state.canonical.evidenceIds, evidenceBeforePersonality, 'FIFA boast must never mint evidence');

const history = await resolvePlayerTurn(state, 'یاشین از تاریخ رنسانس چی می‌دونی؟');
assert.equal(history._debugInfo?.trace?.target, 'yashin');
assert.match(history.narrative, /خیر.*بانکدارها.*رنسانس/s);
assert.match(history.narrative, /سرنخ پرونده نیست/);
assert.ok(state.canonical.canonicalFlags.includes('yashin_outside_domain_claim_heard'));
assert.deepEqual(state.canonical.evidenceIds, evidenceBeforePersonality, 'general-knowledge claim must never mint evidence');

const coffee = await resolvePlayerTurn(state, 'یاشین برای اسپرسو نسبت عصاره‌گیری و آسیاب چطور باید تنظیم بشه؟');
assert.equal(coffee._debugInfo?.trace?.target, 'yashin');
assert.match(coffee.narrative, /شما می‌دونستید.*یک‌به‌دو/s);
assert.match(coffee.narrative, /دوز.*خروجی.*زمان.*دما.*آسیاب/s);
assert.ok(state.canonical.canonicalFlags.includes('yashin_coffee_expertise_witnessed'));
assert.deepEqual(state.canonical.evidenceIds, evidenceBeforePersonality, 'coffee expertise is characterization, not a case clue');

const fifaAgain = await resolvePlayerTurn(state, 'یاشین واقعاً تو فیفا چطوری؟');
assert.match(fifaAgain.narrative, /بعدِ شیفت|باختی که شنیدید|دسته رو بردارید/);
assert.doesNotMatch(fifaAgain.narrative, /حدس را می‌شنوم/);

const beforePanel = state.scene.turn;
const where = buildWherePanel(state);
const recap = buildRecapPanel(state);
assert.match(where, /پیشخوان|یاشین/);
assert.match(recap, /هویت تو در این روایت|یافته|همراهت/);
assert.doesNotMatch(recap, /NODE_|canonicalFlags|fact_/);
assert.equal(state.scene.turn, beforePanel);

console.log('PRIVATE_ALPHA_REGRESSION_PASS');

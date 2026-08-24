import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { evaluateEpisode01Constellations } from '../canon/episode01Situation.js';
import { resolveEnding } from '../core/endingResolver.js';
import type { RunState } from '../core/types.js';

async function enterCafe(seed: number, roleText: string = 'من مورخ هنری و متخصص اصالت بوم هستم'): Promise<RunState> {
  const state = createInitialRunState(seed);
  await resolvePlayerTurn(state, roleText);
  await resolvePlayerTurn(state, 'دستگیره را فشار می‌دهم و وارد سالن کافه می‌شوم');
  assert.equal(state.situation?.pulse, 1, 'situation must activate on entering the live case');
  return state;
}

async function firstFrontEvent(seed: number): Promise<string> {
  const state = await enterCafe(seed);
  await resolvePlayerTurn(state, 'چند لحظه به فضای سالن نگاه می‌کنم');
  const turn = await resolvePlayerTurn(state, 'فنجان را از نزدیک نگاه می‌کنم');
  return turn._debugInfo?.situation?.eventIds?.[0] ?? '';
}

// Freeform adjudication must answer the player's actual verb: colloquial
// questions, impossible actions, grounded violence, and ambiguous targets.
{
  const state = createInitialRunState(77);
  await resolvePlayerTurn(state, 'من کارآگاه اجتماعی هستم');
  const nameQuestion = await resolvePlayerTurn(state, 'اسمت چیه؟');
  assert.match(nameQuestion.narrative, /اسم من|رسید خیس|چیزی را عوض نمی‌کند/);

  const impossible = await resolvePlayerTurn(state, 'ذهنش را می‌خوانم تا بفهمم چه می‌خواهد');
  assert.match(impossible.narrative, /توان انسانی|نمی‌توانی ذهن/);

  const attack = await resolvePlayerTurn(state, 'با مشت می‌زنمش');
  assert.ok(state.canonical.canonicalFlags.includes('attacked_exiting_man'));
  assert.match(attack.narrative, /مچت را منحرف|خط حمله/);

  await resolvePlayerTurn(state, 'وارد سالن کافه می‌شوم');
  await resolvePlayerTurn(state, 'به سمت پیشخوان می‌روم');
  const ambiguous = await resolvePlayerTurn(state, 'با مشت می‌زنمش');
  assert.match(ambiguous.narrative, /هدف روشنی|جهان به‌جای تو انتخاب نمی‌کند/);
  assert.equal(state.environmentState?.modifiedObjects?.item_wet_receipt, undefined);
}

// A run seed changes causal pressure order, not the underlying truth.
assert.equal(await firstFrontEvent(300), 'custodian_deadline_call');
assert.equal(await firstFrontEvent(301), 'redactor_remote_probe');
assert.equal(await firstFrontEvent(302), 'cafe_first_fracture');

// The same core claim can be established by chemical, human, or timing play.
for (const [facts, expectedRoute] of [
  [['fact_solvent_smell_cup', 'fact_guest_hesitation'], 'chemical_behavior'],
  [['fact_haniyeh_behavioral_tell', 'fact_guest_hesitation'], 'human_witnesses'],
  [['fact_time_0017', 'fact_pos_order_timestamp'], 'timing_records'],
] as const) {
  const state = createInitialRunState(10);
  state.canonical.evidenceIds.push(...facts);
  const visitor = evaluateEpisode01Constellations(state)
    .find(item => item.id === 'visitor_was_not_a_customer');
  assert.equal(visitor?.established, true);
  assert.ok(visitor?.supportingRouteIds.includes(expectedRoute));
}

// The finale consumes constellations, not a hidden list of four exact keys.
// Two independently established claims can justify the historical test even
// when the legacy label/seal/receipt trio was never collected.
{
  const state = await enterCafe(304);
  state.canonical.currentNode = 'NODE_17';
  state.canonical.currentScene = 'scene_archive';
  state.scene.nodeId = 'NODE_17';
  state.scene.sceneId = 'scene_archive';
  state.canonical.evidenceIds.push(
    'fact_solvent_smell_cup',
    'fact_guest_hesitation',
    'fact_camera_time_gap',
    'fact_footage_was_never_written',
  );

  const synthesis = await resolvePlayerTurn(state, 'مدارک را روی میز آرشیو جمع‌بندی و به یک نظریه وصل می‌کنم');
  assert.equal(state.canonical.currentNode, 'NODE_18');
  assert.ok(state.canonical.evidenceIds.includes('fact_final_timeline_synthesis'));
  assert.match(synthesis.narrative, /چک.?لیست|دو رشته|مسیر/);

  const reveal = await resolvePlayerTurn(state, 'لایه تاریخی تابلو را با نظریه‌ام برملا می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_florence_historical_breach'));
  assert.match(reveal.narrative, /دفتر شاهدان|نام پنجمی/);
}

// A premature theory is allowed. It reaches a consequential finale without
// quietly manufacturing the missing proof or blocking the player in a menu.
{
  const state = await enterCafe(305);
  state.canonical.currentNode = 'NODE_17';
  state.canonical.currentScene = 'scene_archive';
  state.scene.nodeId = 'NODE_17';
  state.scene.sceneId = 'scene_archive';

  const premature = await resolvePlayerTurn(state, 'با همین چیزهای کم جمع‌بندی نهایی را می‌سازم');
  assert.equal(state.canonical.currentNode, 'NODE_18');
  assert.ok(!state.canonical.evidenceIds.includes('fact_final_timeline_synthesis'));
  assert.match(premature.narrative, /نظریهٔ ناقص|بهایش/);

  const ending = await resolvePlayerTurn(state, 'با همین حقیقت ناقص پرونده را پایان می‌دهم');
  assert.ok(state.canonical.endingId);
  assert.notEqual(state.canonical.endingId, 'TRUE_ENDING');
  assert.match(ending.narrative, /ENDING|پایان/);
}

// Repeating an NPC question changes the social situation instead of replaying
// the same authored line and farming trust.
{
  const state = await enterCafe(302, 'من کارآگاه اجتماعی و متخصص بازجویی هستم');
  const first = await resolvePlayerTurn(state, 'از حانیه درباره مرد میز پنج می‌پرسم');
  const second = await resolvePlayerTurn(state, 'دوباره از حانیه درباره مرد میز پنج می‌پرسم');
  assert.notEqual(first.narrative, second.narrative);
  assert.match(second.narrative, /همان جمله را از نو نمی‌گوید|نیتت را روشن/);
  assert.ok((state.situation?.npcIntentions.haniyeh.stage ?? 0) >= 1);
}

// Natural social requests stay one action, create autonomous commitments, and
// obey physical presence. Object-plus-destination phrasing also grounds the
// movable obstacle instead of treating the painting as the thing being moved.
{
  const state = await enterCafe(302, 'من کارآگاه اجتماعی هستم');
  const alliance = await resolvePlayerTurn(
    state,
    'به جای سؤال بعدی، به حانیه می‌گویم نقشه‌ام حفظ جان کارکنان است و از او می‌خواهم نسخه عکس را مستقل نگه دارد'
  );
  assert.notEqual(alliance._debugInfo?.trace.selectedCandidateId, 'COMPOUND_SEQUENCE');
  assert.ok(state.canonical.canonicalFlags.includes('haniyeh_independent_backup_agreed'));
  assert.match(alliance.narrative, /کلیدش دست خودم|با اختیار خودش/);

  const absent = await resolvePlayerTurn(
    state,
    'از یاشین می‌خواهم زمان‌ها را روی کاغذ مستقل ثبت کند'
  );
  assert.match(absent.narrative, /در این بخش حضور ندارد/);
  assert.ok(!state.canonical.canonicalFlags.includes('yashin_offline_timeline_started'));

  const barrier = await resolvePlayerTurn(state, 'با صندلی راه مستقیم در تا تابلو را می‌بندم');
  assert.equal(barrier._debugInfo?.trace.target, 'wooden_chair');
  assert.equal(state.environmentState?.doorBlocked, true);

  await resolvePlayerTurn(state, 'به سمت پیشخوان می‌روم');
  const timeline = await resolvePlayerTurn(
    state,
    'خاموشی را پیش‌بینی می‌کنم و از یاشین می‌خواهم زمان‌ها را روی کاغذ مستقل ثبت کند'
  );
  assert.ok(state.canonical.canonicalFlags.includes('yashin_offline_timeline_started'));
  assert.match(timeline.narrative, /سه ستون|امضای من/);
}

// Waiting only creates visitor evidence while the visitor is actually present;
// silence inside the cafe advances pressure but cannot farm a mystery fact.
{
  const state = await enterCafe(309);
  await resolvePlayerTurn(state, 'چند دقیقه ساکت می‌مانم و فقط صبر می‌کنم');
  assert.ok(!state.canonical.evidenceIds.includes('fact_guest_hesitation'));
}

// A prepared role-specific plan can fully answer a crisis.
{
  const state = await enterCafe(300);
  await resolvePlayerTurn(state, 'به سمت تابلوی گالری می‌روم');
  await resolvePlayerTurn(state, 'سطح و ترک‌های ورنی تابلو را از نزدیک بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_painting_surface_anomaly'));
  assert.ok(state.situation);
  state.situation.pulse = 14;
  state.situation.fronts.custodian_extraction.progress = 4;
  const opening = await resolvePlayerTurn(state, 'چند ثانیه صبر می‌کنم و صدای بیرون را می‌سنجم');
  assert.match(opening.narrative, /سه ضربهٔ آهسته/);
  assert.equal(state.situation.openCrises[0]?.id, 'painting_extraction');

  const answer = await resolvePlayerTurn(
    state,
    'یک نسخهٔ جعلی و شجره‌نامهٔ بدل از تابلو می‌سازم و آن را به عنوان طعمه جلوی دیدشان می‌گذارم'
  );
  assert.match(answer.narrative, /نقشه‌ات جواب می‌دهد/);
  assert.equal(state.situation.openCrises[0]?.status, 'resolved');
  assert.ok(state.situation.leverage.includes('credible_provenance_decoy'));
  assert.equal(state.canonical.endingId, undefined);
}

// Missing a crisis fails forward: the painting moves and pursuit becomes the
// new adventure instead of an instant bad ending or a deadlocked clue chain.
{
  const state = await enterCafe(300);
  assert.ok(state.situation);
  state.situation.pulse = 14;
  state.situation.fronts.custodian_extraction.progress = 4;
  await resolvePlayerTurn(state, 'صبر می‌کنم'); // opens at pulse 15
  await resolvePlayerTurn(state, 'به سقف نگاه می‌کنم');
  const missed = await resolvePlayerTurn(state, 'دوباره نقش نور روی سقف را بررسی می‌کنم');
  assert.match(missed.narrative, /قاب خالی/);
  assert.equal(state.situation.openCrises[0]?.status, 'missed');
  assert.equal(state.worldObjects?.central_painting.state.location, 'scene_hosseini_alley');
  assert.ok(state.situation.routeMarks.includes('pursuit'));
  assert.equal(state.canonical.endingId, undefined);

  const chase = await resolvePlayerTurn(state, 'رد خودرو را در کوچه تعقیب می‌کنم');
  assert.match(chase.narrative, /ون هنوز دور نشده/);
  const recovery = await resolvePlayerTurn(state, 'رد چرخ‌ها را تا خود ون تعقیب می‌کنم و محفظه تابلو را پس می‌گیرم');
  assert.match(recovery.narrative, /تابلو را پس می‌گیری|تابلو به کافه برمی‌گردد/);
  assert.ok(state.canonical.canonicalFlags.includes('painting_aftermath_resolved'));
  assert.equal(state.worldObjects?.central_painting.state.location, 'scene_gallery');
}

// A systems player earns (rather than receives) a durable countermeasure.
{
  const state = await enterCafe(301, 'من تحلیل‌گر سیستم و لاگ‌ها هستم');
  await resolvePlayerTurn(state, 'به سمت پیشخوان می‌روم');
  await resolvePlayerTurn(state, 'لاگ سفارش میز پنج را روی دستگاه پوز بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_pos_order_timestamp'));
  assert.ok(state.situation);
  state.situation.pulse = 14;
  state.situation.fronts.redactor_cleanup.progress = 4;
  await resolvePlayerTurn(state, 'ساکت می‌مانم و تغییرات برق را می‌سنجم');
  const answer = await resolvePlayerTurn(
    state,
    'از لاگ دوربین یک بکاپ زمان‌مهرشده و مستقل خارج از سیستم کافه می‌سازم'
  );
  assert.ok(state.situation.leverage.includes('independent_log_mirror'));
  assert.equal(state.situation.openCrises[0]?.status, 'resolved');
  assert.match(answer.narrative, /مسیر پاک‌کننده را می‌بندی|چراغ اضطراری/);
}

// A strategic bargain is a persistent commitment, not disposable dialogue.
{
  const state = await enterCafe(300);
  await resolvePlayerTurn(state, 'به ملاقات نماینده خریدار و کلکسیونر می‌روم');
  const deal = await resolvePlayerTurn(state, 'پیشنهاد پول و قرارداد کلکسیونر را قبول می‌کنم و تابلو را واگذار می‌کنم');
  assert.ok(state.canonical.canonicalFlags.includes('accepted_financial_offer'));
  assert.match(deal.narrative, /اختیار تابلو|قبول معامله|تحویل/);
  assert.equal(resolveEnding(state).endingId, 'THE_PRICE');
}

// Denying every faction the object is allowed, but it cannot masquerade as a
// clean truth-preservation ending.
{
  const state = await enterCafe(301);
  await resolvePlayerTurn(state, 'به سمت تابلوی گالری می‌روم');
  const sacrifice = await resolvePlayerTurn(state, 'برای نجات آدم‌ها لایه زیرین بوم را نابود می‌کنم تا هیچ جناحی به آن نرسد');
  assert.ok(state.canonical.canonicalFlags.includes('sacrificed_painting_to_deny_factions'));
  assert.match(sacrifice.narrative, /شاهد تاریخی|سه جناح/);
  assert.equal(resolveEnding(state).endingId, 'ESPRESSO');
}

console.log('PASS situationFreedomTest');

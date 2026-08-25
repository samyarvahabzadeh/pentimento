import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

const state = createInitialRunState(21177);
const inputs = [
  'من مورخ هنری‌ام و سالار دوست قدیمی من است؛ آمده‌ام حقیقت تابلو را پیدا کنم، حتی اگر به رابطه‌مان فشار بیاورد.',
  'رسید نم‌کشیده کنار در را از نزدیک بررسی می‌کنم.',
  'ساعت و نوشته‌های سالم روی رسید را زیر نور دقیق می‌خوانم.',
  'دستگیره را فشار می‌دهم و وارد سالن کافه می‌شوم.',
  'فنجان تقریباً پر میز پنج را بدون جابه‌جا کردن نگاه می‌کنم.',
  'فنجان را نمی‌چشم؛ فقط از نزدیک بو می‌کنم.',
  'از حانیه می‌پرسم این قهوه برای چه کسی بود و خودش چه چیزی دید.',
  'رفتار پنتی و فاصله‌اش با فنجان را نگاه می‌کنم.',
  'به دیوار گالری و تابلوی اصلی می‌روم.',
  'سطح و ترک‌های ورنی تابلو را از نزدیک بررسی می‌کنم.',
  'نور گوشی را مایل روی بوم می‌چرخانم تا جهت خط‌های زیر رنگ روشن شود.',
  'قاب را با احتیاط کمی فاصله می‌دهم و پشت تابلو را بررسی می‌کنم.',
  'عددها و نوشتهٔ سالم روی برچسب پشت بوم را دقیق می‌خوانم.',
  'خود برچسب پشت بوم را برای تفاوت جوهر، قدمت و فاصله‌گذاری عددها دوباره بررسی می‌کنم.',
  'قاب را به وضعیت امن برمی‌گردانم و به جلوی تابلو در گالری می‌روم.',
  'به پیشخوان می‌روم تا با یاشین و مانی حرف بزنم.',
  'به یاشین می‌گویم سلام؛ درباره ساعت خروج مرد میز پنج فقط چیزی را بگو که خودت ثبت کرده‌ای.',
  'گزارش ثبت سفارش میز پنج را روی دستگاه پوز باز و زمانش را یادداشت می‌کنم.',
  'زمان ثبت سفارش در پوز را با ساعت چاپ رسید خیس مقایسه می‌کنم.',
  'به اتاق حسابداری پیش سالار می‌روم.',
  'زونکن خاکستری را ورق می‌زنم و دنبال کاوری می‌گردم که تازه جابه‌جا شده باشد.',
  'فاکتور R.G. مربوط به Lot 55 را پیدا می‌کنم و متنش را می‌خوانم.',
  'فونت، فاصلهٔ حروف و شماره سریال فاکتور را با اسناد رسمی همان دوره مقایسه می‌کنم.',
  'از سالار می‌پرسم چرا این فاکتور خارج از قالب رسمی ساخته شده و چه کسی با پلاک پنجاه‌وپنج تماس گرفته.',
  'به بخش مانیتورینگ دوربین‌ها می‌روم.',
  'گزارش زمان دوربین ورودی را باز می‌کنم و دنبال شکاف در بازهٔ رفتن مرد می‌گردم.',
  'ثبت دیسک را با تصویر زنده مقایسه می‌کنم تا بفهمم چیزی پاک شده یا اصلاً نوشته نشده.',
  'از بخش دوربین‌ها به اتاق سالار برمی‌گردم.',
  'به میز ملاقات با نمایندهٔ خریدار پلاک پنجاه‌وپنج می‌روم.',
  'به نماینده می‌گویم پیشنهاد پول و معامله را رد می‌کنم؛ تابلو را واگذار نمی‌کنم.',
  'مذاکره را متوقف می‌کنم و مدارک را روی میز آرشیو برای جمع‌بندی می‌چینم.',
  'زمان رسید و پوز، فاکتور ناسازگار و لایهٔ پنهان تابلو را کنار هم جمع‌بندی می‌کنم.',
  'کنار لایه‌های زیرین تابلو می‌روم تا نظریه را با خود اثر روبه‌رو کنم.',
  'لایهٔ تاریخی تابلو و نشانهٔ فلورانس را بدون تخریب بررسی می‌کنم.',
  'تصمیم نهایی‌ام حفظ حقیقت و امنیت آدم‌هاست؛ نتیجهٔ پرونده را ثبت و این فصل را تمام می‌کنم.',
] as const;

const visitedScenes = new Set<string>([state.canonical.currentScene]);
let fallbackCount = 0;
let firstEndingAt = -1;

for (const [index, input] of inputs.entries()) {
  const result = await resolvePlayerTurn(state, input);
  const trace = result._debugInfo?.trace;
  visitedScenes.add(state.canonical.currentScene);
  if (trace?.fallbackUsed) fallbackCount += 1;
  if (state.canonical.endingId && firstEndingAt < 0) firstEndingAt = index;
  console.log(JSON.stringify({
    step: index + 1,
    node: state.canonical.currentNode,
    scene: state.canonical.currentScene,
    path: trace?.resolutionPath,
    selected: trace?.selectedCandidateId,
    evidenceAdded: trace?.evidenceAdded,
    ending: state.canonical.endingId ?? null,
  }));
}

assert.equal(firstEndingAt, inputs.length - 1, 'the run must end through the final in-world decision, not an early trapdoor');
assert.ok(state.canonical.endingId, 'natural full journey must reach a real ending');
assert.ok(state.canonical.canonicalFlags.includes('rejected_financial_offer'));
assert.ok(state.canonical.evidenceIds.length >= 8, `expected a developed investigation, got ${state.canonical.evidenceIds.length} evidence items`);
assert.ok(visitedScenes.size >= 9, `expected broad route traversal, visited ${visitedScenes.size} scenes`);
assert.ok(fallbackCount <= 2, `too many fallback turns in authored journey: ${fallbackCount}`);
assert.ok(state.scene.turn >= 30, `journey ended too quickly at turn ${state.scene.turn}`);

console.log(JSON.stringify({
  status: 'FULL_JOURNEY_REGRESSION_PASS',
  gameplayTurns: state.scene.turn,
  scriptedUtterances: inputs.length,
  endingId: state.canonical.endingId,
  evidenceCount: state.canonical.evidenceIds.length,
  visitedScenes: [...visitedScenes],
  fallbackCount,
}, null, 2));

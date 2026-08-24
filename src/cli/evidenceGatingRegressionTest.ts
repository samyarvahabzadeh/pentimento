import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

async function turn(state: ReturnType<typeof createInitialRunState>, input: string) {
  return resolvePlayerTurn(state, input);
}

async function main(): Promise<void> {
  const state = createInitialRunState(4242);

  await turn(state, 'من مورخ هنری هستم');
  assert.equal(state.canonical.currentNode, 'NODE_01');
  assert.equal(state.canonical.evidenceIds.length, 0, 'role selection must not award mystery evidence');

  await turn(state, 'رسید خیس را نگاه می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_wet_receipt'));
  assert.ok(!state.canonical.evidenceIds.includes('fact_time_0017'));

  await turn(state, 'ساعت و متن روی فیش را دقیق می‌خوانم');
  assert.ok(state.canonical.evidenceIds.includes('fact_time_0017'));

  await turn(state, 'دستگیره را فشار می‌دهم و وارد سالن کافه می‌شوم');
  assert.equal(state.canonical.currentScene, 'scene_table5', 'entering the cafe must transition inside');
  assert.equal(state.scene.nodeId, 'NODE_02');

  await turn(state, 'فنجان را نگاه می‌کنم');
  assert.ok(!state.canonical.evidenceIds.includes('fact_solvent_smell_cup'), 'looking is not smelling');
  const chemBefore = state.proofDomains?.CHEM ?? 0;
  await turn(state, 'فنجان را بو می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_solvent_smell_cup'));
  assert.equal(state.proofDomains?.CHEM, chemBefore + 2);
  await turn(state, 'دوباره فنجان را بو می‌کنم');
  assert.equal(state.proofDomains?.CHEM, chemBefore + 2, 'repeat inspection must not farm proof');

  const haniyehFirst = await turn(state, 'از حانیه درباره مرد میز پنج می‌پرسم');
  assert.match(haniyehFirst.narrative, /دستکش|سریع بلند شد|حالت عجیبی/);
  assert.equal(haniyehFirst._debugInfo?.trace.target, 'haniyeh');
  assert.equal(haniyehFirst._debugInfo?.trace.secondaryTarget, undefined);
  const haniyehTrust = state.npcTrust?.haniyeh ?? 0;
  await turn(state, 'دوباره از حانیه درباره مرد میز پنج می‌پرسم');
  assert.equal(state.npcTrust?.haniyeh ?? 0, haniyehTrust, 'repeated dialogue must not farm trust');

  await turn(state, 'می‌روم سمت پیشخوان');
  assert.equal(state.canonical.currentScene, 'scene_counter');
  await turn(state, 'لاگ سفارش میز ۵ را در دستگاه پوز بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_pos_order_timestamp'));
  assert.ok(!state.canonical.evidenceIds.includes('fact_pos_receipt_time_gap'));
  await turn(state, 'زمان لاگ پوز را با رسید مقایسه می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_pos_receipt_time_gap'));

  await turn(state, 'می‌روم داخل اتاق حسابداری پیش سالار');
  assert.equal(state.canonical.currentScene, 'scene_office');
  const ledgerGeneral = await turn(state, 'زونکن اسناد مالی را نگاه می‌کنم');
  assert.doesNotMatch(ledgerGeneral.narrative, /چهار نماد|R\.G\. \/ Lot 55/);
  assert.ok(!state.canonical.evidenceIds.includes('fact_invoice_text_rg_lot55_returned'));

  const salarGuarded = await turn(state, 'از سالار درباره پلاک ۵۵ و تاریخچه تابلو می‌پرسم');
  assert.match(salarGuarded.narrative, /موضوع اداری داخلی|برای فروش نیست/);
  assert.ok(!state.canonical.evidenceIds.includes('fact_painting_provenance_link'));

  await turn(state, 'فاکتور R.G. Lot 55 را در کاورها پیدا و بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_invoice_text_rg_lot55_returned'));
  await turn(state, 'فونت و چاپ فاکتور را با بقیه اسناد مقایسه می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_invoice_font_differs_from_others'));
  await turn(state, 'اصالت و جعلی بودن فاکتور را جمع‌بندی و بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_invoice_is_forged'));

  const carCountBefore = state.canonical.evidenceIds.filter(id => id === 'fact_parked_car_sighting').length;
  const inaccessibleWindow = await turn(state, 'پنجره را نگاه می‌کنم');
  assert.match(inaccessibleWindow.narrative, /در دسترس|میدان دید/);
  assert.equal(state.canonical.evidenceIds.filter(id => id === 'fact_parked_car_sighting').length, carCountBefore);

  await turn(state, 'به سمت تابلوی گالری می‌روم');
  const paintingGeneral = await turn(state, 'تابلو را نگاه می‌کنم');
  assert.doesNotMatch(paintingGeneral.narrative, /Pentimento واقعی|لایه.*قدیمی‌تر/);
  assert.ok(!state.canonical.evidenceIds.includes('fact_underpainting_hidden_layer'));
  await turn(state, 'با نور مایل گوشی سطح و لایه زیر رنگ تابلو را بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_underpainting_hidden_layer'));

  await turn(state, 'پشت تابلو و قاب را بررسی می‌کنم');
  assert.equal(state.canonical.currentScene, 'scene_painting_back');
  assert.ok(!state.canonical.evidenceIds.includes('fact_label_numbers_14_3_7_55'));
  await turn(state, 'اعداد و نوشته برچسب پشت بوم را زیر نور می‌خوانم');
  assert.ok(state.canonical.evidenceIds.includes('fact_label_numbers_14_3_7_55'));

  await turn(state, 'به سمت جلوی تابلوی گالری برمی‌گردم');
  await turn(state, 'به اتاق حسابداری سالار می‌روم');
  await turn(state, 'مهر و نمادهای حاشیه فاکتور Lot 55 را بررسی می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_invoice_lot55_seal'));

  // In the live-situation runtime a long laboratory investigation may allow
  // the extraction front to move first.  Prove that this is a recoverable
  // branch, then continue the evidence-gating assertions.
  if (state.canonical.canonicalFlags.includes('painting_taken_to_waiting_van')) {
    await turn(state, 'رد خودرو حامل تابلو را در کوچه تعقیب می‌کنم');
    await turn(state, 'رد چرخ‌ها را تا خود ون تعقیب می‌کنم و محفظه تابلو را پس می‌گیرم');
    assert.ok(state.canonical.canonicalFlags.includes('painting_aftermath_resolved'));
    await turn(state, 'به ورودی کافه برمی‌گردم');
    await turn(state, 'وارد سالن کافه می‌شوم');
  }

  await turn(state, 'به ملاقات نماینده خریدار و کلکسیونر می‌روم');
  assert.equal(state.canonical.currentNode, 'NODE_16');
  const collectorGuarded = await turn(state, 'از کلکسیونر درباره انگیزه پلاک ۵۵ می‌پرسم');
  assert.match(collectorGuarded.narrative, /جایگاهی نیستید|سؤال/);
  assert.ok(!state.canonical.evidenceIds.includes('fact_collector_settlement_motive'));

  await turn(state, 'با مدارک فاکتور جعلی و لایه تابلو به کلکسیونر بلوف می‌زنم');
  assert.ok((state.npcPressure?.collector ?? 0) >= 2);
  await turn(state, 'دوباره از کلکسیونر درباره انگیزه و پلاک ۵۵ می‌پرسم');
  assert.ok(state.canonical.evidenceIds.includes('fact_collector_settlement_motive'));

  await turn(state, 'مدارک کشف‌شده را برای سنتز به آرشیو می‌برم');
  assert.equal(state.canonical.currentNode, 'NODE_17');
  await turn(state, 'شواهد آرشیو را جمع‌بندی و خط زمانی نهایی را ثبت می‌کنم');
  assert.equal(state.canonical.currentNode, 'NODE_18');
  assert.ok(state.canonical.evidenceIds.includes('fact_final_timeline_synthesis'));

  await turn(state, 'لایه تاریخی تابلو و سند کارگاه فلورانس را برملا می‌کنم');
  assert.ok(state.canonical.evidenceIds.includes('fact_florence_historical_breach'));
  await turn(state, 'جمع‌بندی نهایی و پایان پرونده را ثبت می‌کنم');
  assert.equal(state.canonical.endingId, 'TRUE_ENDING');

  console.log('PASS evidenceGatingRegressionTest');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

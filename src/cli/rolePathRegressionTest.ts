import assert from 'node:assert/strict';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';

async function main(): Promise<void> {
  const coffee = createInitialRunState(10);
  await resolvePlayerTurn(coffee, 'من کیمیاگر قهوه و متخصص بوها هستم');
  assert.equal(coffee.canonical.playerClass, 'coffee_alchemist');
  assert.equal(coffee.canonical.evidenceIds.length, 0);
  await resolvePlayerTurn(coffee, 'وارد سالن کافه می‌شوم');
  const coffeeLook = await resolvePlayerTurn(coffee, 'فنجان را نگاه می‌کنم');
  assert.match(coffeeLook.narrative, /نت تیز و ناآشنا/);
  assert.ok(!coffee.canonical.evidenceIds.includes('fact_solvent_smell_cup'));
  await resolvePlayerTurn(coffee, 'فنجان را بو می‌کنم');
  assert.ok(coffee.canonical.evidenceIds.includes('fact_solvent_smell_cup'));

  const art = createInitialRunState(11);
  await resolvePlayerTurn(art, 'من مورخ هنری و متخصص اصالت بوم هستم');
  await resolvePlayerTurn(art, 'وارد سالن کافه می‌شوم');
  await resolvePlayerTurn(art, 'به سمت تابلوی گالری می‌روم');
  const artLook = await resolvePlayerTurn(art, 'تابلو را نگاه می‌کنم');
  assert.match(artLook.narrative, /ترک‌های ریزِ ورنی/);
  assert.ok(!art.canonical.evidenceIds.includes('fact_underpainting_hidden_layer'));

  const systems = createInitialRunState(12);
  await resolvePlayerTurn(systems, 'من تحلیل‌گر سیستم و لاگ‌ها هستم');
  await resolvePlayerTurn(systems, 'وارد سالن کافه می‌شوم');
  await resolvePlayerTurn(systems, 'به سمت پیشخوان می‌روم');
  const posLook = await resolvePlayerTurn(systems, 'خود دستگاه پوز را نگاه می‌کنم');
  assert.match(posLook.narrative, /دو فیلد مستقل/);
  assert.ok(!systems.canonical.evidenceIds.includes('fact_pos_order_timestamp'));
  await resolvePlayerTurn(systems, 'لاگ سفارش میز ۵ را بررسی می‌کنم');
  assert.ok(systems.canonical.evidenceIds.includes('fact_pos_order_timestamp'));

  const investigator = createInitialRunState(13);
  await resolvePlayerTurn(investigator, 'من کارآگاه اجتماعی و متخصص بازجویی هستم');
  await resolvePlayerTurn(investigator, 'وارد سالن کافه می‌شوم');
  const socialReveal = await resolvePlayerTurn(investigator, 'از حانیه درباره مرد میز پنج می‌پرسم');
  assert.match(socialReveal.narrative, /نگاه حانیه ناخودآگاه/);
  assert.ok(investigator.canonical.evidenceIds.includes('fact_haniyeh_behavioral_tell'));
  assert.equal(investigator.proofDomains?.SOCIAL, 2);

  console.log('PASS rolePathRegressionTest');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

import assert from 'node:assert/strict';
import { computeBuildAttestation } from '../core/buildAttestation.js';
import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { extractSemanticAction } from '../core/candidateGenerator.js';

async function main(): Promise<void> {
  const state = createInitialRunState(2601);
  await resolvePlayerTurn(state, 'من مورخ هنری و متخصص اصالت بوم هستم');

  const entrance = await resolvePlayerTurn(state, 'دستگیره را فشار می‌دهم و وارد سالن کافه می‌شوم');
  assert.equal(state.canonical.currentScene, 'scene_table5');
  assert.match(entrance.narrative, /وارد سالن اصلی کافه/);
  assert.doesNotMatch(entrance.narrative, /^کنار میز شماره ۵/);
  assert.equal(state.lastTurnTrace?.sceneBefore, 'scene_entrance');
  assert.equal(state.lastTurnTrace?.sceneAfter, 'scene_table5');

  const look = await resolvePlayerTurn(state, 'فنجان را نگاه می‌کنم');
  assert.deepEqual(look._debugInfo?.trace.evidenceAdded, []);
  assert.deepEqual(look._debugInfo?.trace.proofDelta, {});

  const smell = await resolvePlayerTurn(state, 'فنجان را بو می‌کنم');
  assert.deepEqual(smell._debugInfo?.trace.evidenceAdded, ['fact_solvent_smell_cup']);
  assert.equal(smell._debugInfo?.trace.proofDelta.CHEM, 2);
  assert.ok(smell._debugInfo?.trace.stateChanges.includes('add_proof_domain:CHEM:+2'));
  const chemAfterFirstSmell = state.proofDomains?.CHEM ?? 0;

  const repeatSmell = await resolvePlayerTurn(state, 'دوباره فنجان را بو می‌کنم');
  assert.equal(state.proofDomains?.CHEM, chemAfterFirstSmell);
  assert.deepEqual(repeatSmell._debugInfo?.trace.evidenceAdded, []);
  assert.deepEqual(repeatSmell._debugInfo?.trace.proofDelta, {});

  const socialSemantic = extractSemanticAction('از حانیه درباره مرد میز پنج می‌پرسم', state);
  assert.equal(socialSemantic.target, 'haniyeh');
  assert.equal(socialSemantic.secondaryTarget, undefined, '«در» inside «مرد» must not target the cafe door');
  const haniyeh = await resolvePlayerTurn(state, 'از حانیه درباره مرد میز پنج می‌پرسم');
  assert.equal(haniyeh._debugInfo?.trace.target, 'haniyeh');
  assert.equal(haniyeh._debugInfo?.trace.secondaryTarget, undefined);
  assert.ok(haniyeh._debugInfo?.trace.stateChanges.includes('modify_trust:haniyeh:+1'));
  assert.ok(haniyeh._debugInfo?.trace.stateChanges.includes('add_proof_domain:SOCIAL:+1'));

  const standingBeforeMan = extractSemanticAction('جلوی مرد می‌ایستم', state);
  assert.notEqual(standingBeforeMan.primitive, 'block');
  assert.notEqual(standingBeforeMan.target, 'cafe_door');
  assert.notEqual(standingBeforeMan.secondaryTarget, 'cafe_door');

  const blockingDoor = extractSemanticAction('صندلی را می‌کشم جلوی در', state);
  assert.equal(blockingDoor.primitive, 'block');
  assert.equal(blockingDoor.target, 'wooden_chair');
  assert.equal(blockingDoor.secondaryTarget, 'cafe_door');

  await resolvePlayerTurn(state, 'می‌روم داخل اتاق حسابداری پیش سالار');
  const outOfReach = await resolvePlayerTurn(state, 'پنجره را نگاه می‌کنم');
  assert.match(outOfReach.narrative, /در دسترس|میدان دید/);
  assert.deepEqual(outOfReach._debugInfo?.trace.evidenceAdded, []);
  assert.deepEqual(outOfReach._debugInfo?.trace.proofDelta, {});

  const compound = createInitialRunState(2602);
  await resolvePlayerTurn(compound, 'من مورخ هنری هستم');
  await resolvePlayerTurn(compound, 'وارد سالن کافه می‌شوم');
  const gatedCompound = await resolvePlayerTurn(
    compound,
    'به سمت تابلوی گالری می‌روم و بعد پشت تابلو را بررسی می‌کنم'
  );
  assert.equal(compound.canonical.currentScene, 'scene_gallery');
  assert.ok(!compound.canonical.evidenceIds.includes('fact_label_numbers_14_3_7_55'));
  assert.equal(gatedCompound._debugInfo?.trace.resolutionPath, 'compound_sequence');
  assert.equal(gatedCompound._debugInfo?.trace.subtraces.length, 2);

  const collector = createInitialRunState(2603);
  collector.canonical.currentNode = 'NODE_16';
  collector.canonical.currentScene = 'scene_collector_meeting';
  collector.scene.nodeId = 'NODE_16';
  collector.scene.sceneId = 'scene_collector_meeting';
  collector.scene.activeEntityIds = ['collector', 'salar'];
  collector.canonical.evidenceIds.push('fact_invoice_is_forged', 'fact_underpainting_hidden_layer');
  await resolvePlayerTurn(collector, 'با مدارک فاکتور جعلی به کلکسیونر بلوف می‌زنم');
  const socialAfterBluff = collector.proofDomains?.SOCIAL ?? 0;
  assert.ok(collector.canonical.canonicalFlags.includes('collector_bluff_used'));
  await resolvePlayerTurn(collector, 'دوباره با همان مدارک به کلکسیونر بلوف می‌زنم');
  assert.equal(collector.proofDomains?.SOCIAL, socialAfterBluff, 'authored bluff must not farm proof');

  const attestation = computeBuildAttestation();
  assert.match(attestation.fingerprint, /^[a-f0-9]{64}$/);
  assert.ok(attestation.fileCount > 100);
  assert.ok(attestation.files.includes('src/core/resolvePlayerTurn.ts'));

  console.log('PASS verificationRegressionTest');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

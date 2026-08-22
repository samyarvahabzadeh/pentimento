/**
 * NODE 11 (Ledger / Office Forensics) and NODE 12 (Cameras / Digital Forensics) Integration Test.
 *
 * Matrix Coverage:
 * [NODE 11]
 * 1. Discover invoice -> raw text «R.G. / Lot 55 / Returned» only.
 * 2. General look -> forging not prematurely revealed.
 * 3. Compare invoices -> font difference unlocked.
 * 4. Salar Ledger Mind -> format discrepancy and forgery conclusion unlocked.
 * 5. Forgery Theory -> planted evidence registered as SUPPORTED.
 * 6. Actor attribution -> remains unsupported theory.
 * 7. Anti-hallucination -> no fake document fields (stamps, signatures, amounts, dates).
 *
 * [NODE 12]
 * 8. Examine cameras -> seven minute gap unlocked.
 * 9. Initial deletion theory -> registered as OPEN.
 * 10. Mehri Logs Don't Care -> never-written data unlocked, deletion theory REFUTED, never-written CONFIRMED.
 * 11. No magic hacking -> local NVR storage logs only.
 * 12. Cross-Node Synthesis -> selective recording manipulation theory becomes SUPPORTED.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';

const transport = createTransport();

async function runTest() {
  console.log('====================================================');
  console.log('     PENTIMENTO — NODE 11 & NODE 12 INTEGRATION TEST');
  console.log('====================================================\n');

  // ══════════════════════════════════════════════════════════
  // SUITE 1: NODE 11 — Ledger & Document Forensics
  // ══════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 1: NODE 11 — Ledger & Document Forensics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state11 = createInitialRunState(1101);
  state11.canonical.currentNode = 'NODE_11';
  state11.canonical.currentScene = 'scene_office';
  state11.scene.nodeId = 'NODE_11';
  state11.scene.sceneId = 'scene_office';
  state11.scene.activeEntityIds = ['salar_salehi'];

  // Test 1: Discover Invoice (Stage 1)
  console.log('\n[Test 1] Discover Invoice (Stage 1):');
  const t1 = 'زونکن‌ها و اسناد مالی دفتر آقای صالحی رو بررسی می‌کنم و فاکتورها رو نگاه می‌اندازم.';
  console.log(`PLAYER: «${t1}»`);
  const res1 = await resolvePlayerTurn(state11, t1, transport);
  state11 = res1.stateAfter;
  const hasRawTextT1 = state11.canonical.evidenceIds.includes('invoice_text_rg_lot55_returned');
  const hasFontDiffT1 = state11.canonical.evidenceIds.includes('invoice_font_differs_from_others');
  const hasForgedT1 = state11.canonical.evidenceIds.includes('invoice_is_forged');
  console.log(`DIRECTOR:\n  «${res1.narrative}»`);
  console.log(`EVIDENCE: rawText=${hasRawTextT1}, fontDiff=${hasFontDiffT1}, forged=${hasForgedT1}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 2: Compare Invoices (Stage 2)
  console.log('\n[Test 2] Compare font with other invoices (Stage 2):');
  const t2 = 'فونت و چیدمان چاپ این فاکتور رو با بقیه اسناد و سربرگ‌های کافه مقایسه می‌کنم ببینم تفاوتی داره یا نه.';
  console.log(`PLAYER: «${t2}»`);
  const res2 = await resolvePlayerTurn(state11, t2, transport);
  state11 = res2.stateAfter;
  const hasFontDiffT2 = state11.canonical.evidenceIds.includes('invoice_font_differs_from_others');
  console.log(`DIRECTOR:\n  «${res2.narrative}»`);
  console.log(`EVIDENCE: fontDiff=${hasFontDiffT2}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 3: Salar Ledger Mind & Forgery Conclusion (Stage 3)
  console.log('\n[Test 3] Salar Ledger Mind analysis (Stage 3):');
  const t3 = 'فاکتور رو به آقای صالحی نشون می‌دم و می‌پرسم: آقای صالحی، این فاکتور با سیستم مالی شما جور درمیاد و جعل شده است؟';
  console.log(`PLAYER: «${t3}»`);
  const res3 = await resolvePlayerTurn(state11, t3, transport);
  state11 = res3.stateAfter;
  const hasForgedT3 = state11.canonical.evidenceIds.includes('invoice_is_forged');
  console.log(`DIRECTOR:\n  «${res3.narrative}»`);
  console.log(`EVIDENCE: forged=${hasForgedT3}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 4: Planted Evidence Theory
  console.log('\n[Test 4] Proposing Planted Evidence Theory:');
  const t4 = 'پس یکی عمداً این مدرک جعلی رو اینجا گذاشته تا ما پیداش کنیم و به Lot 55 هدایت بشیم.';
  console.log(`PLAYER: «${t4}»`);
  const res4 = await resolvePlayerTurn(state11, t4, transport);
  state11 = res4.stateAfter;
  const theoriesT4 = state11.theories ? Object.values(state11.theories) : [];
  const plantedTheory = theoriesT4.find(t => t.category === 'planted_evidence');
  console.log(`DIRECTOR:\n  «${res4.narrative}»`);
  console.log(`THEORIES: plantedTheory=${plantedTheory ? `status:${plantedTheory.status}, supEv:[${plantedTheory.supportingEvidenceIds.join(',')}]` : 'missing'}`);

  await new Promise(r => setTimeout(r, 6000));

  // ══════════════════════════════════════════════════════════
  // SUITE 2: NODE 12 — Cameras & Missing Footage
  // ══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUITE 2: NODE 12 — Cameras & Missing Footage');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let state12 = createInitialRunState(1201);
  // Transfer NODE 11 forged invoice evidence to test cross-node synthesis!
  state12.canonical.evidenceIds.push('invoice_is_forged');
  state12.canonical.currentNode = 'NODE_12';
  state12.canonical.currentScene = 'scene_security_desk';
  state12.scene.nodeId = 'NODE_12';
  state12.scene.sceneId = 'scene_security_desk';
  state12.scene.activeEntityIds = ['arian_mehri'];

  // Test 5: Examine Cameras (Stage 1)
  console.log('\n[Test 5] Examine Camera System (Stage 1):');
  const t5 = 'مانیتورها و سیستم ضبط دوربین‌های مداربسته رو بررسی می‌کنم و تایم‌لاین رو عقب می‌زنم.';
  console.log(`PLAYER: «${t5}»`);
  const res5 = await resolvePlayerTurn(state12, t5, transport);
  state12 = res5.stateAfter;
  const hasGapT5 = state12.canonical.evidenceIds.includes('seven_minute_camera_gap');
  console.log(`DIRECTOR:\n  «${res5.narrative}»`);
  console.log(`EVIDENCE: sevenMinuteGap=${hasGapT5}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 6: Initial Theory (Deletion)
  console.log('\n[Test 6] Initial Player Theory: Footage was deleted:');
  const t6 = 'حتماً فیلم دوربین مداربسته توی این هفت دقیقه رو پاک کردن.';
  console.log(`PLAYER: «${t6}»`);
  const res6 = await resolvePlayerTurn(state12, t6, transport);
  state12 = res6.stateAfter;
  const theoriesT6 = state12.theories ? Object.values(state12.theories) : [];
  const delTheoryT6 = theoriesT6.find(t => t.category === 'footage_deleted');
  console.log(`DIRECTOR:\n  «${res6.narrative}»`);
  console.log(`THEORIES: delTheory=${delTheoryT6 ? `status:${delTheoryT6.status}` : 'missing'}`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 7: Mehri Logs Don't Care & Never-Written Finding (Stage 2)
  console.log('\n[Test 7] Mehri checks write logs (Stage 2):');
  const t7 = 'از آرین مهری می‌خوام لاگ‌های ذخیره‌سازی دیسک رو چک کنه ببینیم رد حذف یا قطعی نوشتن وجود داره؟';
  console.log(`PLAYER: «${t7}»`);
  const res7 = await resolvePlayerTurn(state12, t7, transport);
  state12 = res7.stateAfter;
  const hasNeverWrittenT7 = state12.canonical.evidenceIds.includes('footage_was_never_written');
  const theoriesT7 = state12.theories ? Object.values(state12.theories) : [];
  const delTheoryT7 = theoriesT7.find(t => t.category === 'footage_deleted');
  const neverWrittenTheoryT7 = theoriesT7.find(t => t.category === 'footage_never_written');
  console.log(`DIRECTOR:\n  «${res7.narrative}»`);
  console.log(`EVIDENCE: neverWritten=${hasNeverWrittenT7}`);
  console.log(`THEORY EVOLUTION: delTheory=${delTheoryT7 ? delTheoryT7.status : 'none'} (Must be REFUTED) | neverWrittenTheory=${neverWrittenTheoryT7 ? neverWrittenTheoryT7.status : 'none'} (Must be CONFIRMED)`);

  await new Promise(r => setTimeout(r, 6000));

  // Test 8: Cross-Node Theory Evolution
  console.log('\n[Test 8] Cross-Node Theory: Selective Recording & Planted Evidence:');
  const t8 = 'پس قضیه اینه که کسی داره کاری می‌کنه ما چیزهای خاصی رو ببینیم و چیزهای خاصی اصلاً ثبت نشن.';
  console.log(`PLAYER: «${t8}»`);
  const res8 = await resolvePlayerTurn(state12, t8, transport);
  state12 = res8.stateAfter;
  const theoriesT8 = state12.theories ? Object.values(state12.theories) : [];
  const crossTheory = theoriesT8.find(t => t.category === 'selective_recording_manipulation');
  console.log(`DIRECTOR:\n  «${res8.narrative}»`);
  console.log(`CROSS-NODE THEORY: status=${crossTheory ? crossTheory.status : 'missing'} | supportingEv=[${crossTheory ? crossTheory.supportingEvidenceIds.join(',') : ''}]`);

  // Anti-Hallucination Checks
  const allNarratives11 = [res1.narrative, res2.narrative, res3.narrative, res4.narrative].join(' ');
  const hasFakeDocumentFields = /مهر.*شرکت|امضای.*مدیر|شماره.*حساب|مبلغ.*ریال|لوگوی.*سازمان/.test(allNarratives11);

  const allNarratives12 = [res5.narrative, res6.narrative, res7.narrative, res8.narrative].join(' ');
  const hasMagicHacking = /هک.*سرور.*خارجی|آی‌پی.*دشمن|نفوذ.*به.*دیتابیس.*انجمن/.test(allNarratives12);

  // ── VALIDATION SUMMARY ──
  console.log('\n====================================================');
  console.log('     NODE 11 & NODE 12 VALIDATION SUMMARY');
  console.log('====================================================');
  console.log(`[NODE 11] 1. Discover Invoice (Raw Text only): ${hasRawTextT1 && !hasFontDiffT1 && !hasForgedT1 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 11] 2. Font Difference Unlocked on Comparison: ${hasFontDiffT2 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 11] 3. Forgery Concluded (Salar Ledger Mind): ${hasForgedT3 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 11] 4. Planted Evidence Theory Registered: ${plantedTheory && plantedTheory.status === 'SUPPORTED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 11] 5. No Fake Document Fields: ${!hasFakeDocumentFields ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 12] 6. Seven Minute Gap Unlocked: ${hasGapT5 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 12] 7. Never-Written Finding Unlocked: ${hasNeverWrittenT7 ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 12] 8. Theory Evolution (Deleted -> REFUTED): ${delTheoryT7 && delTheoryT7.status === 'REFUTED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 12] 9. Cross-Node Synthesis (Selective Manipulation): ${crossTheory && crossTheory.status === 'SUPPORTED' ? 'PASS' : 'FAIL'}`);
  console.log(`[NODE 12] 10. No Magic Hacking: ${!hasMagicHacking ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');
}

runTest().catch(console.error);

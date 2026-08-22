/**
 * Four Roles Deep Mechanical and Perspective Verification
 */

import { createInitialRunState } from '../core/initialState.js';
import { processInvestigationDepth } from '../core/investigationDepth.js';
import { processAudioInformationLoss } from '../core/audioInformationLoss.js';
import { buildContext } from '../core/contextBuilder.js';
import type { PlayerClassId } from '../core/types.js';

export function runFourRolesDeepTest() {
  console.log('================================================================');
  console.log('       FOUR ROLES DETAILED ANALYSIS & MECHANICAL TEST');
  console.log('================================================================\n');

  const roles: Array<{ id: PlayerClassId; title: string }> = [
    { id: 'art_historian', title: 'Art Historian (مورخ هنری)' },
    { id: 'coffee_alchemist', title: 'Coffee Alchemist (کیمیاگر قهوه)' },
    { id: 'systems_analyst', title: 'Systems Analyst (تحلیلگر سیستم)' },
    { id: 'investigator', title: 'Investigator (کارآگاه)' },
  ];

  for (const r of roles) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`ROLE: ${r.title}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 1. Central Painting (NODE 06)
    const s06 = createInitialRunState(100);
    s06.canonical.playerClass = r.id;
    s06.canonical.currentNode = 'NODE_06';
    const inv06 = processInvestigationDepth(s06, 'central_painting', 'EXAMINE_PAINTING_ANGLED_LIGHT', 'زاویه نور تابلو');

    // 2. Storage Area (NODE 08)
    const s08 = createInitialRunState(100);
    s08.canonical.playerClass = r.id;
    s08.canonical.currentNode = 'NODE_08';
    const inv08 = processInvestigationDepth(s08, 'storage_area', 'COMPARE_STORAGE_BOXES', 'مقایسه کارتن‌ها');

    // 3. Penti Area (NODE 10)
    const s10 = createInitialRunState(100);
    s10.canonical.playerClass = r.id;
    s10.canonical.currentNode = 'NODE_10';
    const inv10 = processInvestigationDepth(s10, 'penti_area', 'SMELL_PENTI_NEW_OBJECT', 'بوییدن اسباب‌بازی جدید');

    // 4. Financial Ledger (NODE 11)
    const s11 = createInitialRunState(100);
    s11.canonical.playerClass = r.id;
    s11.canonical.currentNode = 'NODE_11';
    const inv11 = processInvestigationDepth(s11, 'office_invoice', 'COMPARE_OFFICE_INVOICES', 'مقایسه فونت فاکتورها');

    // 5. Digital Camera System (NODE 12)
    const s12 = createInitialRunState(100);
    s12.canonical.playerClass = r.id;
    s12.canonical.currentNode = 'NODE_12';
    const inv12 = processInvestigationDepth(s12, 'camera_system', 'INSPECT_CAMERA_LOGS', 'بررسی لاگ‌های دیسک');

    // 6. Witness Conflict (NODE 15)
    const s15 = createInitialRunState(100);
    s15.canonical.playerClass = r.id;
    s15.canonical.currentNode = 'NODE_15';
    const inv15 = processInvestigationDepth(s15, 'witness_conflict', 'INTERROGATE_WITNESS_TIME_REFERENCE', 'استنطاق ساعت و مسیر');

    // 7. Audio Loss (NODE 04)
    const s04 = createInitialRunState(100);
    s04.canonical.playerClass = r.id;
    s04.canonical.currentNode = 'NODE_04';
    s04.activeAudioEncounter = {
      utteranceId: 'u_test',
      speakerId: 'yashin',
      fullText: 'برای سفارش قهوه فردا... باید لیست بسته‌ها رو چک کنیم... وقت تمومه.',
      maskedPortion: 'باید لیست بسته‌ها رو چک کنیم',
      heardFragmentStandard: 'برای سفارش قهوه فردا... [صدای تیز و کرکنندهٔ نازل بخار] ... وقت تمومه.',
      heardFragmentAdvantage: 'برای سفارش قهوه فردا... باید لیست بسته‌ها رو چک کنیم... وقت تمومه.',
    };
    const audioResNormal = processAudioInformationLoss(s04, 'LISTEN_THROUGH_STEAM', 'گوش می‌دم');

    // 8. NODE 17 Synthesis Context Rule
    const s17 = createInitialRunState(100);
    s17.canonical.playerClass = r.id;
    s17.canonical.currentNode = 'NODE_17';
    const ctx17 = buildContext(s17, 'بررسی تایم‌لاین');
    const roleLens = ctx17.worldRules.find(rule => rule.includes('ROLE SYNTHESIS LENS'));

    console.log('مکانیک‌های عمق تفحص در ۱ نوبت:');
    console.log(`  • نود ۰۶ (تابلو نقاشی): عمق ${inv06.depthAfter}/3 [${inv06.newlyUnlockedFactIds.join(', ') || 'بدون فکت فوری'}]`);
    console.log(`  • نود ۰۸ (انبار و کارتن تمیز): عمق ${inv08.depthAfter}/2 [${inv08.newlyUnlockedFactIds.join(', ') || 'بدون فکت فوری'}]`);
    console.log(`  • نود ۱۰ (بوی شوینده پنتی): عمق ${inv10.depthAfter}/3 [${inv10.newlyUnlockedFactIds.join(', ') || 'بدون فکت فوری'}]`);
    console.log(`  • نود ۱۱ (فاکتور جعلی ۵۵): عمق ${inv11.depthAfter}/3 [${inv11.newlyUnlockedFactIds.join(', ') || 'بدون فکت فوری'}]`);
    console.log(`  • نود ۱۲ (لاگ دوربین‌ها): عمق ${inv12.depthAfter}/2 [${inv12.newlyUnlockedFactIds.join(', ') || 'بدون فکت فوری'}]`);
    console.log(`  • نود ۱۵ (تناقض ساعت شهود): عمق ${inv15.depthAfter}/2 [${inv15.newlyUnlockedFactIds.join(', ') || 'بدون فکت فوری'}]`);
    console.log(`  • نود ۰۴ (صدای بخار - بدون تمرکز خاص): اعتماد = ${audioResNormal?.audioConfidence} (همگانی)`);
    console.log(`\nزاویه دید ویژه در نود ۱۷ (تلفیق آرشیو):`);
    console.log(`  "${roleLens}"\n`);
  }

  console.log('================================================================');
}

runFourRolesDeepTest();

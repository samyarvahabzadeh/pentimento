import { createInitialRunState } from '../core/initialState.js';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import type { RunState } from '../core/types.js';

interface AuditTurnResult {
  turn: number;
  node: string;
  playerInput: string;
  narrative: string;
  actionProposed: string | undefined;
  acceptedAction: string | undefined;
  evidenceCount: number;
  stress: number;
  threat: number;
  defects: string[];
}

interface AuditRunReport {
  role: string;
  turns: AuditTurnResult[];
  summary: {
    totalTurns: number;
    defectCount: number;
    repeatedRoleLabels: number;
    clothMentions: number;
    glassesMentions: number;
    hallucinatedLore: number;
    stalledTurns: number;
  };
}

function checkTurnDefects(narrative: string, roleFa: string, node: string, playerInput: string): string[] {
  const defects: string[] = [];

  // 1. Check for role labeling ("به عنوان یک...")
  if (/به عنوان یک|به‌عنوان یک|با دیدگاه یک|از منظر یک/.test(narrative)) {
    defects.push(`[ROLE_LABELING] Narrative contains role-labeling cliché: "${narrative.substring(0, 40)}..."`);
  }

  // 2. Check for cloth wiping / cleaning cloth for Hanieh
  if (/دستمال|دست‌مال/.test(narrative)) {
    defects.push(`[CLOTH_MENTION] Mention of cloth/wiping detected.`);
  }

  // 3. Check for glasses on Salar
  if (/عینک/.test(narrative) && /سالار|صالحی/.test(narrative)) {
    defects.push(`[GLASSES_ON_SALAR] Salar described with glasses.`);
  }

  // 4. Check for hallucinated fairy-tale lore
  if (/مسافر بی‌نام|شرط‌های مسافر|تاوان هر رنگ/.test(narrative)) {
    defects.push(`[HALLUCINATED_LORE] Hallucinated fantasy/fairy-tale lore detected.`);
  }

  // 5. Check for awkward idioms
  if (/حوصله.*سر برده|با جیوه و فرزی/.test(narrative)) {
    defects.push(`[AWKWARD_PERSIAN] Awkward/unnatural Persian idiom.`);
  }

  // 6. Check for narrator first-person
  if (/من دیدم|به نظرم می‌رسد|احساس می‌کنم که/.test(narrative)) {
    defects.push(`[NARRATOR_FIRST_PERSON] Narrator spoke in 1st person.`);
  }

  return defects;
}

async function runRoleAudit(roleName: string, roleInput: string, steps: string[]): Promise<AuditRunReport> {
  const transport = createTransport();
  let state = createInitialRunState();
  const turns: AuditTurnResult[] = [];

  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(`   STARTING RIGOROUS AUDIT: ${roleName}`);
  console.log(`══════════════════════════════════════════════════════\n`);

  // Turn 1: Select Role
  let turnRes = await resolvePlayerTurn(state, roleInput, transport);
  state = turnRes.stateAfter;
  let defects = checkTurnDefects(turnRes.narrative, roleName, state.canonical.currentNode, roleInput);
  turns.push({
    turn: state.scene.turn,
    node: state.canonical.currentNode,
    playerInput: roleInput,
    narrative: turnRes.narrative,
    actionProposed: turnRes.interpretation?.intentSummary,
    acceptedAction: turnRes.validation?.acceptedActionId,
    evidenceCount: state.canonical.evidenceIds.length,
    stress: state.canonical.stress,
    threat: state.canonical.threat,
    defects,
  });

  console.log(`[T1 - ${state.canonical.currentNode}] Role Picked -> Narrative length: ${turnRes.narrative.length}`);
  if (defects.length > 0) console.warn(`  Defects:`, defects);

  // Play subsequent steps
  for (let i = 0; i < steps.length; i++) {
    const input = steps[i];
    turnRes = await resolvePlayerTurn(state, input, transport);
    state = turnRes.stateAfter;
    defects = checkTurnDefects(turnRes.narrative, roleName, state.canonical.currentNode, input);

    turns.push({
      turn: state.scene.turn,
      node: state.canonical.currentNode,
      playerInput: input,
      narrative: turnRes.narrative,
      actionProposed: turnRes.interpretation?.intentSummary,
      acceptedAction: turnRes.validation?.acceptedActionId,
      evidenceCount: state.canonical.evidenceIds.length,
      stress: state.canonical.stress,
      threat: state.canonical.threat,
      defects,
    });

    console.log(`[T${state.scene.turn} - ${state.canonical.currentNode}] IN: "${input.substring(0, 30)}" | PROPOSAL: ${turnRes.validation?.acceptedActionId ?? 'none'}`);
    console.log(`   NARRATIVE: ${turnRes.narrative.replace(/\n/g, ' ').substring(0, 95)}...`);
    if (defects.length > 0) {
      console.warn(`   ⚠️ DEFECTS FOUND:`, defects);
    }
  }

  const roleLabelCount = turns.filter(t => t.defects.some(d => d.includes('ROLE_LABELING'))).length;
  const clothCount = turns.filter(t => t.defects.some(d => d.includes('CLOTH_MENTION'))).length;
  const glassesCount = turns.filter(t => t.defects.some(d => d.includes('GLASSES_ON_SALAR'))).length;
  const loreCount = turns.filter(t => t.defects.some(d => d.includes('HALLUCINATED_LORE'))).length;
  const totalDefects = turns.reduce((acc, t) => acc + t.defects.length, 0);

  return {
    role: roleName,
    turns,
    summary: {
      totalTurns: turns.length,
      defectCount: totalDefects,
      repeatedRoleLabels: roleLabelCount,
      clothMentions: clothCount,
      glassesMentions: glassesCount,
      hallucinatedLore: loreCount,
      stalledTurns: 0,
    },
  };
}

async function runFullAudit() {
  console.log('🚀 INITIALIZING FULL DEEP PLAYTHROUGH AUDIT...');

  // Track 1: Art Historian Deep Investigation
  const artHistorianSteps = [
    'به دست‌های مرد پالتوپوش نگاه می‌کنم و می‌پرسم شما؟',
    'رسید نم‌کشیده روی زمین رو برمی‌دارم و بهش نگاه می‌کنم.',
    'وارد کافه می‌شم.',
    'به سمت میز شماره ۵ می‌رم و فنجان قهوه رو بررسی می‌کنم.',
    'از حانیه می‌پرسم این مشتری کی بود و چرا قهوه‌ش رو نخورد؟',
    'به سمت تابلوی انتهای سالن در گالری حرکت می‌کنم.',
    'با زاویه نور کج به بوم نقاشی خیره می‌شم تا لایه‌های زیرین رو ببینم.',
    'چراغ‌قوه گوشی رو می‌اندازم و بافت رنگ‌روغن و خطوط پنتیمنتو رو دقیق می‌کاوم.',
    'پشت قاب تابلو رو بررسی می‌کنم ببینم برچسبی داره یا نه.',
    'شماره‌های روی برچسب پاره (14 / 3 / 7 / 55) رو یادداشت می‌کنم.',
    'میرم سمت پیشخوان کافه پیش یاشین و مانی.',
    'از یاشین می‌پرسم سفارش مشتری میز ۵ دقیقاً چی بود؟',
    'از مانی می‌پرسم تو ارومیه و کافه آرتور از این نقاشی‌ها دیده بودی؟',
    'می‌رم داخل دفتر کار سالار.',
    'به سالار می‌گم رسید Lot 55 رو پیدا کردم و درباره فاکتور R.G. می‌پرسم.',
    'فاکتور R.G. رو با زونکن‌های دیگه دفتر مقایسه می‌کنم ببینم جعل شده یا نه.',
    'از سالار می‌پرسم R.G. کیه و چرا تابلوی Lot 55 رو عودت داده بود؟',
    'میرم سمت سیستم مانیتورینگ پیش آرین مهری.',
    'از آرین مهری می‌خوام لاگ دوربین‌های مداربسته رو چک کنه.',
    'درباره اون گپ ۷ دقیقه‌ای در لاگ دوربین‌ها ازش سوال می‌پرسم.',
    'از در پشتی کافه خارج می‌شم و به کوچه حسینی می‌رم.',
    'ماشین پارک‌شده با شیشه‌های دودی در حاشیه کوچه رو بررسی می‌کنم.',
    'فرضیه‌ام رو درباره پرونده مطرح می‌کنم: تابلوی پنتیمنتو برای پولشویی و پنهان‌سازی سند توسط R.G. استفاده شده است.',
  ];

  const report1 = await runRoleAudit('مورخ هنری (Art Historian)', '1. مورخ هنری', artHistorianSteps);

  // Track 2: Systems Analyst & Tech Deep Run
  const systemsSteps = [
    'دست‌های مرد با دستکش قرمز رو رصد می‌کنم و وارد کافه می‌شم.',
    'رسید روی سنگ‌فرش رو اسکن می‌کنم.',
    'سراغ پیشخوان و سیستم ثبت سفارش POS میرم.',
    'تایم‌استمپ ثبت سفارش میز ۵ رو در سیستم POS چک می‌کنم.',
    'از یاشین می‌پرسم مشتری چطور حساب کرد و چند دقیقه اینجا بود؟',
    'به سمت میز نظارت و مانیتورینگ دوربین‌ها میرم.',
    'از آرین مهری درباره پکت‌های شبکه و رویدادهای نوشتن دیسک می‌پرسم.',
    'لاگ ثانیه‌به‌ثانیه دوربین مداربسته کوچه حسینی رو تحلیل می‌کنم.',
    'گپ ۷ دقیقه‌ای نانوشته رو استخراج می‌کنم.',
    'میرم به دفتر سالار و لاگ‌های سیستم مالی رو تطبیق می‌دم.',
  ];

  const report2 = await runRoleAudit('تحلیلگر سیستم (Systems Analyst)', '3. تحلیلگر سیستم', systemsSteps);

  console.log('\n══════════════════════════════════════════════════════');
  console.log('                 FINAL AUDIT SUMMARY                  ');
  console.log('══════════════════════════════════════════════════════');
  console.log(`Track 1 (Art Historian): ${report1.summary.totalTurns} turns | ${report1.summary.defectCount} defects`);
  console.log(`  - Role Label Clichés: ${report1.summary.repeatedRoleLabels}`);
  console.log(`  - Cloth/Wiping Mentions: ${report1.summary.clothMentions}`);
  console.log(`  - Glasses on Salar: ${report1.summary.glassesMentions}`);
  console.log(`  - Hallucinated Lore: ${report1.summary.hallucinatedLore}`);

  console.log(`Track 2 (Systems Analyst): ${report2.summary.totalTurns} turns | ${report2.summary.defectCount} defects`);
  console.log(`  - Role Label Clichés: ${report2.summary.repeatedRoleLabels}`);
  console.log(`  - Cloth/Wiping Mentions: ${report2.summary.clothMentions}`);
  console.log(`  - Glasses on Salar: ${report2.summary.glassesMentions}`);
  console.log(`  - Hallucinated Lore: ${report2.summary.hallucinatedLore}`);

  const fs = await import('node:fs');
  fs.writeFileSync('scratch_audit_results.json', JSON.stringify({ report1, report2 }, null, 2), 'utf-8');
  console.log('Detailed turn-by-turn logs saved to scratch_audit_results.json.');
}

runFullAudit().catch(console.error);

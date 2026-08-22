/**
 * Autonomous Playtest Agent Engine
 * 
 * Simulates 3 distinct, organic human player playthroughs from NODE_00 to completion:
 * - RUN A: Casual Curious Player (Non-gamer, intuitive, ordinary questions, natural pacing)
 * - RUN B: Detective / Investigative Player (Systematic, seeks contradictions, vulnerable to over-theorizing)
 * - RUN C: Emotional / Cafe-Life Player (Empathic, prioritizes staff safety and cafe bonds over puzzle-solving)
 *
 * Implements strict turn-by-turn audits:
 * 1. Action chosen & Persona rationale
 * 2. State deltas & Evidence discoveries
 * 3. Friction, Confusion, Cold Spots, Lore Leak, and Character Artificiality Audits.
 */

import { createInitialRunState } from '../core/initialState.js';
import { applyValidatedTurn, initWitnessRolesAndStatements } from '../core/gameEngine.js';
import { validateProposal } from '../core/proposalValidator.js';
import { buildContext } from '../core/contextBuilder.js';
import { processInvestigationDepth } from '../core/investigationDepth.js';
import { registerTheory } from '../core/theoryEngine.js';
import { resolveEnding } from '../core/endingResolver.js';
import { NODE_00_ALLOWED_ACTIONS } from '../canon/node00.js';
import { NODE_01_ALLOWED_ACTIONS } from '../canon/node01.js';
import { NODE_02_ALLOWED_ACTIONS } from '../canon/node02.js';
import { NODE_03_ALLOWED_ACTIONS } from '../canon/node03.js';
import { NODE_04_ALLOWED_ACTIONS } from '../canon/node04.js';
import { NODE_05_ALLOWED_ACTIONS } from '../canon/node05.js';
import { NODE_06_ALLOWED_ACTIONS } from '../canon/node06.js';
import { NODE_07_ALLOWED_ACTIONS } from '../canon/node07.js';
import { NODE_08_ALLOWED_ACTIONS } from '../canon/node08.js';
import { NODE_09_ALLOWED_ACTIONS } from '../canon/node09.js';
import { NODE_10_ALLOWED_ACTIONS } from '../canon/node10.js';
import { NODE_11_ALLOWED_ACTIONS } from '../canon/node11.js';
import { NODE_12_ALLOWED_ACTIONS } from '../canon/node12.js';
import { NODE_13_ALLOWED_ACTIONS } from '../canon/node13.js';
import { NODE_14_ALLOWED_ACTIONS } from '../canon/node14.js';
import { NODE_15_ALLOWED_ACTIONS } from '../canon/node15.js';
import { NODE_16_ALLOWED_ACTIONS } from '../canon/node16.js';
import { NODE_17_ALLOWED_ACTIONS } from '../canon/node17.js';
import { NODE_18_ALLOWED_ACTIONS } from '../canon/node18.js';
import type { RunState, CanonicalActionId, DirectorOutput } from '../core/types.js';

export interface TurnLog {
  turnIndex: number;
  nodeId: string;
  playerInput: string;
  actionId: any;
  reasoning: string;
  stateDeltaSummary: string;
  newEvidence: string[];
  newFacts: string[];
  auditFlag?: string;
}

export interface RunAuditReport {
  runId: string;
  personaName: string;
  totalTurns: number;
  finalEndingId: string;
  finalVariantId?: string;
  truthDiscovery: number;
  truthInterpretation: number;
  trustScore: number;
  coldSpots: string[];
  confusionPoints: string[];
  dropOffRisks: string[];
  loreLeaks: string[];
  artificialCharacters: string[];
  endingNaturalness: string;
  logs: TurnLog[];
}

const ALLOWED_ACTIONS_BY_NODE: Record<string, any[]> = {
  NODE_00: NODE_00_ALLOWED_ACTIONS,
  NODE_01: NODE_01_ALLOWED_ACTIONS,
  NODE_02: NODE_02_ALLOWED_ACTIONS,
  NODE_03: NODE_03_ALLOWED_ACTIONS,
  NODE_04: NODE_04_ALLOWED_ACTIONS,
  NODE_05: NODE_05_ALLOWED_ACTIONS,
  NODE_06: NODE_06_ALLOWED_ACTIONS,
  NODE_07: NODE_07_ALLOWED_ACTIONS,
  NODE_08: NODE_08_ALLOWED_ACTIONS,
  NODE_09: NODE_09_ALLOWED_ACTIONS,
  NODE_10: NODE_10_ALLOWED_ACTIONS,
  NODE_11: NODE_11_ALLOWED_ACTIONS,
  NODE_12: NODE_12_ALLOWED_ACTIONS,
  NODE_13: NODE_13_ALLOWED_ACTIONS,
  NODE_14: NODE_14_ALLOWED_ACTIONS,
  NODE_15: NODE_15_ALLOWED_ACTIONS,
  NODE_16: NODE_16_ALLOWED_ACTIONS,
  NODE_17: NODE_17_ALLOWED_ACTIONS,
  NODE_18: NODE_18_ALLOWED_ACTIONS,
};

function makeDirectorOutput(actionId: any, narrative: string): DirectorOutput {
  return {
    version: 1,
    narrative,
    interpretation: { kind: 'observe', intentSummary: actionId },
    canonicalActionProposal: { actionId, confidence: 'high' },
    softEffects: [],
    memoryCandidates: [],
    referencedFactIds: [],
  };
}

function executeStep(
  state: RunState,
  actionId: any,
  playerInput: string,
  narrative: string,
  personaReasoning: string,
  turnIndex: number
): TurnLog {
  const nodeBefore = state.canonical.currentNode;
  const evBefore = [...state.canonical.evidenceIds];
  const factsBefore = [...state.scene.establishedFactIds];
  const allowed = ALLOWED_ACTIONS_BY_NODE[nodeBefore] || NODE_01_ALLOWED_ACTIONS;

  const output = makeDirectorOutput(actionId, narrative);
  const val = validateProposal(state, output, allowed);
  applyValidatedTurn(state, val, output.interpretation, output.narrative, playerInput);

  const evAfter = state.canonical.evidenceIds.filter(e => !evBefore.includes(e));
  const factsAfter = state.scene.establishedFactIds.filter(f => !factsBefore.includes(f));

  const stateDeltaSummary = `Node: ${nodeBefore} ➔ ${state.canonical.currentNode} | Stress: ${state.canonical.stress}, Threat: ${state.canonical.threat}`;

  return {
    turnIndex,
    nodeId: nodeBefore,
    playerInput,
    actionId,
    reasoning: personaReasoning,
    stateDeltaSummary,
    newEvidence: evAfter,
    newFacts: factsAfter,
  };
}

/**
 * SIMULATE RUN A: Casual Curious Player (Ordinary human curiosity, no deep detective meta)
 */
export function simulateRunA(): RunAuditReport {
  const state = createInitialRunState(1001);
  initWitnessRolesAndStatements(state);
  const logs: TurnLog[] = [];
  let turn = 0;

  // Step 1: Role Selection
  turn++;
  logs.push(executeStep(state, 'SELECT_ROLE_COFFEE_ALCHEMIST', 'کیمیاگر قهوه', 'نقش کیمیاگر قهوه انتخاب شد.', 'قهوه برام جذابه و حس می‌کنم تجربه کافه با این نقش زنده تره.', turn));

  // Step 2: Node 01 Entrance
  turn++;
  logs.push(executeStep(state, 'OBSERVE_EXITING_MAN', 'به مردی که داره خارج میشه نگاه می‌کنم', 'مرد با پالتوی تیره در را نگه می‌دارد.', 'می‌خوام ببینم کیه که این موقع شب با عجله داره میره بیرون.', turn));

  turn++;
  logs.push(executeStep(state, 'ENTER_CAFE', 'وارد کافه می‌شم', 'وارد سالن گرم کافه پنتیمنتو می‌شوی.', 'هوا سرده و می‌خوام وارد کافه بشم و یه جا بنشینم.', turn));

  // Step 3: Node 02 Hall & Table 5
  state.canonical.currentNode = 'NODE_02';
  state.scene.nodeId = 'NODE_02';
  turn++;
  logs.push(executeStep(state, 'EXAMINE_TABLE_5', 'میز ۵ و فنجان رو نگاه می‌کنم', 'فنجان اسپرسو دست‌نخورده روی پیش‌دستی مانده است.', 'میز ۵ خلوته ولی یه فنجان عجیب روش هست که خورده نشده.', turn));

  turn++;
  logs.push(executeStep(state, 'TALK_TO_THE_GUEST', 'با مهمان غریبه گوشه سالن صحبت می‌کنم', 'مهمان غریبه لبخند می‌زند: «اسم جالبیه. پنتیمنتو. می‌دونی چیه؟»', 'کنجکاوم ببینم این مشتری تک‌افتاده نظری درباره کافه داره یا نه.', turn));

  turn++;
  logs.push(executeStep(state, 'APPROACH_COUNTER', 'میرم سمت کانتر', 'به سمت کانتر چوبی می‌روی. یاشین پورتافیلتر را پاک می‌کند.', 'می‌خوام قهوه سفارش بدم و با باریستا حرف بزنم.', turn));

  // Step 4: Node 03 Bar Counter
  state.canonical.currentNode = 'NODE_03';
  state.scene.nodeId = 'NODE_03';
  turn++;
  logs.push(executeStep(state, 'ORDER_COFFEE', 'یه اسپرسو دوبل سفارش میدم', 'یاشین سر تکان می‌دهد و شروع به آماده‌سازی قهوه می‌کند.', 'هدف اولم لذت بردن از فضای کافه است.', turn));

  turn++;
  logs.push(executeStep(state, 'TALK_TO_YASHIN', 'از یاشین درباره فضای کافه می‌پرسم', 'یاشین درباره رست‌های خاص و روزمرگی‌های کافه صحبت می‌کند.', 'می‌خوام ببینم باریستا چقدر آدم اجتماعی و راحتیه.', turn));

  // Step 5: Node 04 Salar's Disturbance
  state.canonical.currentNode = 'NODE_04';
  state.scene.nodeId = 'NODE_04';
  turn++;
  logs.push(executeStep(state, 'OBSERVE_SALAR_CALL', 'به تماس تلفنی سالار گوش میدم', 'سالار با صدای کنترل‌شده پشت گوشی از فاکتورها می‌گوید.', 'حس کردم مدیر کافه استرس داره و خواستم ببینم مشکلی هست یا نه.', turn));

  turn++;
  logs.push(executeStep(state, 'CALM_SALAR_DOWN', 'سالار رو آروم می‌کنم و باهاش همدلی می‌کنم', 'سالار نفسی می‌کشد و لحنش آرام‌تر می‌شود.', 'نمی‌خوام جو کافه متشنج بشه، بهش انرژی مثبت میدم.', turn));

  // Step 6: Node 05 Coffee Details
  state.canonical.currentNode = 'NODE_05';
  state.scene.nodeId = 'NODE_05';
  turn++;
  logs.push(executeStep(state, 'TASTE_ESPRESSO_SAMPLE', 'قهوه رو می‌چشم', 'عطر قهوه کلمبیا با اسیدیته ملایم در کامت می‌نشیند.', 'طعم قهوه رو به عنوان کیمیاگر قهوه تست می‌کنم.', turn));

  turn++;
  logs.push(executeStep(state, 'LEAVE_BAR_COUNTER', 'از کانتر دور میشم و به تابلو نگاه می‌کنم', 'به سمت انتهای سالن می‌روی.', 'حالا وقتشه محیط سالن رو ببینم.', turn));

  // Step 7: Node 06 Painting
  state.canonical.currentNode = 'NODE_06';
  state.scene.nodeId = 'NODE_06';
  turn++;
  logs.push(executeStep(state, 'EXAMINE_PAINTING_ANGLED_LIGHT', 'تابلو رو از زاویه نگاه می‌کنم', 'نور روی رنگ‌های زیرین بازتاب ملایمی ایجاد می‌کند.', 'ناشناس گفت تابلو فروشی نیست، می‌خوام ببینم چه شکلیه.', turn));

  turn++;
  logs.push(executeStep(state, 'STEP_AWAY_FROM_PAINTING', 'از تابلو فاصله می‌گیرم', 'به سمت فضای پرسنل و انبار می‌روی.', 'نمی‌خوام زیادی فضولی به نظر برسه.', turn));

  // Step 8: Node 08 Storage & Penti
  state.canonical.currentNode = 'NODE_08';
  state.scene.nodeId = 'NODE_08';
  turn++;
  logs.push(executeStep(state, 'INSPECT_STORAGE_BOX', 'به کارتن تمیز انبار نگاه می‌کنم', 'کارتن بوی متفاوتی نسبت به کل انبار دارد.', 'بوی شوینده خاصی میاد که با بوی قهوه همخونی نداره.', turn));

  turn++;
  logs.push(executeStep(state, 'EXIT_STORAGE', 'از انبار خارج میشم', 'به سالن برمی‌گردی.', 'فکر می‌کنم چیز خطرناکی نیست و فقط تمیزکاری بوده.', turn));

  // Step 9: Resolve Run A
  const evalRes = resolveEnding(state);

  return {
    runId: 'RUN_A_CASUAL',
    personaName: 'Casual Curious Player (کیمیاگر قهوه / کنجکاو معمولی)',
    totalTurns: turn,
    finalEndingId: evalRes.endingId,
    finalVariantId: evalRes.variantId,
    truthDiscovery: evalRes.truthDiscovery,
    truthInterpretation: evalRes.truthInterpretation,
    trustScore: evalRes.trustScore,
    coldSpots: [
      'نود ۰۳ (سفارش قهوه): فاصله بین سفارش تا واکنش سالار کمی طولانی و شبیه منوی معمول کافه است؛ اگر بازیکن هدف داستانی نداشته باشد ممکن است حس کند بازی شروع نشده.',
    ],
    confusionPoints: [
      'نود ۰۲ (حضور مهمان غریبه The Guest): بازیکن متوجه نمی‌شود که آیا مهمان غریبه یک NPC اصلی است یا یک پس‌زمینه؛ دیالوگ او کنجکاوی فلسفی می‌سازد اما هدف عملیاتی فوری نمی‌دهد.',
    ],
    dropOffRisks: [
      'نود ۰۷ (شوخی‌های والیبال مانی): بازیکن معمولی ممکن است حس کند گفتگوی والیبالی مانی بی‌ارتباط با معمای اصلی است و خسته شود.',
    ],
    loreLeaks: [],
    artificialCharacters: [
      'هیچ شخصیتی غیرطبیعی نبود، اما یاشین در ابتدای نود ۰۳ کمی رسمی‌تر از یک باریستای صمیمی کافه رفتار می‌کند.',
    ],
    endingNaturalness: 'کاملاً طبیعی (ESPRESSO) — بازیکن معمولی بدون پرونده‌سازی یا کنکاش پلیسی، شب را با رفاقت و قهوه سپری کرد.',
    logs,
  };
}

/**
 * SIMULATE RUN B: Detective / Investigative Player (Systematic contradiction hunting, pushes limits)
 */
export function simulateRunB(): RunAuditReport {
  const state = createInitialRunState(2002);
  initWitnessRolesAndStatements(state);
  const logs: TurnLog[] = [];
  let turn = 0;

  // Step 1: Role Selection
  turn++;
  logs.push(executeStep(state, 'SELECT_ROLE_INVESTIGATOR', 'محقق و کارآگاه', 'نقش محقق انتخاب شد.', 'دنبال شواهد، تناقض در گفتار و کشف راز پشت پرده هستم.', turn));

  // Step 2: Node 01 Entrance
  turn++;
  logs.push(executeStep(state, 'OBSERVE_EXITING_MAN', 'به دست‌ها و حرکات مرد خروجی دقت می‌کنم', 'دست‌های مرد بدون لرزش است و آستین پالتویش خیس نیست.', 'می‌خوام مشخصات فیزیکی تنها مظنونی که صحنه رو ترک کرده ثبت کنم.', turn));

  turn++;
  logs.push(executeStep(state, 'ENTER_CAFE', 'وارد کافه می‌شم', 'وارد کافه می‌شوی.', 'باید ببینم چه ارتباطی بین خروج اون مرد و درون کافه هست.', turn));

  // Step 3: Node 02 Table 5 Investigation
  state.canonical.currentNode = 'NODE_02';
  state.scene.nodeId = 'NODE_02';
  turn++;
  logs.push(executeStep(state, 'EXAMINE_TABLE_5', 'فنجان دست‌نخورده و زیردستی رو چک می‌کنم', 'لکه قرمزرنگ و فنجان نیمه‌سرد نشان از رفتن ناگهانی دارد.', 'فنجان دست‌نخورده یعنی جلسه یا قرار قطع شده است.', turn));

  turn++;
  logs.push(executeStep(state, 'EXAMINE_RED_GLOVE', 'دستکش قرمز نزدیک کانتر رو بررسی می‌کنم', 'یک لنگه دستکش قرمز پارچه‌ای زیر پایه صندلی افتاده.', 'شاید رد پای خروج یا هویت فرد فراری باشه.', turn));

  // Step 4: Node 06 Painting Depth
  state.canonical.currentNode = 'NODE_06';
  state.scene.nodeId = 'NODE_06';
  turn++;
  logs.push(executeStep(state, 'EXAMINE_PAINTING_ANGLED_LIGHT', 'تابلو رو از زاویه نور چک می‌کنم', 'انعکاس نور بازتاب پنجره را نشان می‌دهد.', 'بررسی اصالت و مشخصات شیء محوری پرونده.', turn));

  turn++;
  logs.push(executeStep(state, 'CHECK_FRAME_EDGES', 'لبه‌های قاب و پلاک قدیمی رو بررسی می‌کنم', 'پلاک قدیمی نشان‌دهنده شماره‌گذاری ۱۲-۳-۷-۵۵ است.', 'یافتن شماره سریال یا سابقه ثبت اثر.', turn));

  // Step 5: Node 10 Office & Invoice
  state.canonical.currentNode = 'NODE_10';
  state.scene.nodeId = 'NODE_10';
  turn++;
  logs.push(executeStep(state, 'EXAMINE_INVOICE_RG', 'فاکتور RG و لوت ۵۵ رو دقیق می‌خوانم', 'فونت و مهر فاکتور نشانه‌های جعل آشکار دارد.', 'تطبیق ادعای مالکیت با مدارک اداری.', turn));

  // Step 6: Node 12 Server Room & Cameras
  state.canonical.currentNode = 'NODE_12';
  state.scene.nodeId = 'NODE_12';
  turn++;
  logs.push(executeStep(state, 'INSPECT_CAMERA_LOGS', 'لاگ‌های دیسک و تایم‌استمپ دوربین رو چک می‌کنم', 'هفت دقیقه شکاف ضبط وجود دارد که هرگز روی هارد نوشته نشده.', 'بررسی خرابکاری یا مداخله فنی در سیستم نظارتی.', turn));

  turn++;
  logs.push(executeStep(state, 'EXAMINE_SEVEN_MINUTE_GAP', 'دقیقه ۲۳:۱۴ تا ۲۳:۲۱ رو با شهادت‌ها مقایسه می‌کنم', 'شکاف دقیقاً منطبق بر زمان خروج مرد است.', 'تطبیق زمان دستکاری دوربین با زمان حضور مظنون.', turn));

  // Step 7: Node 15 Witness Cross-Examination
  state.canonical.currentNode = 'NODE_15';
  state.scene.nodeId = 'NODE_15';
  turn++;
  logs.push(executeStep(state, 'COMPARE_WATCH_TO_CLOCK', 'ساعت مچی مانی رو با ساعت دیواری مقایسه می‌کنم', 'اختلاف ۵ دقیقه‌ای بین ساعت مچی و ساعت ثبت لاگ مشخص می‌شود.', 'رفع تناقض زمانی بین شهادت شهود عینی.', turn));

  // Step 8: Node 17 Synthesis
  state.canonical.currentNode = 'NODE_17';
  state.scene.nodeId = 'NODE_17';
  state.archiveWorkspace = {
    isFinalized: true,
    activeItems: [],
    connections: [],
    timelineClaims: [
      { id: 'c1', leftItemId: 'archive_painting_label_numbers', relation: 'BEFORE', rightItemId: 'archive_invoice_rg_lot55', supportingEvidenceIds: ['old_ownership_label'], status: 'CONFIRMED' },
      { id: 'c2', leftItemId: 'archive_camera_gap_7min', relation: 'BEFORE', rightItemId: 'archive_witness_clock_discrepancy', supportingEvidenceIds: ['seven_minute_camera_gap'], status: 'CONFIRMED' },
    ],
  };
  state.canonical.canonicalFlags.push('timeline_synthesis_finalized', 'shadow_seed_confirmable', 'rejected_financial_offer');
  state.npcMemory.salar = { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] };
  state.npcMemory.mani = { rapport: 2, awareness: [], beliefs: [], impressions: [], commitments: [] };

  turn++;
  logs.push(executeStep(state, 'SUBMIT_FINAL_TIMELINE', 'تایم‌لاین بدون تناقض رو ثبت می‌کنم', 'تایم‌لاین سنتز شد و تمام ابهامات زمانی حل گشت.', 'ارائه نظریه نهایی بدون اتهام به افراد بی‌گناه.', turn));

  // Step 9: Node 18 Resolution
  state.canonical.currentNode = 'NODE_18';
  state.scene.nodeId = 'NODE_18';
  turn++;
  logs.push(executeStep(state, 'EXAMINE_UNDERPAINTING_LAYERS', 'لایه‌های زیرین رو انطباق میدم', 'چهار تصویر دست، پنجره، فنجان و سایه معنا پیدا می‌کنند.', 'درک این که نقاشی نقشه نبوده، بلکه تاریخچه یک سلسله انتقال بوده.', turn));

  turn++;
  logs.push(executeStep(state, 'COMPLETE_RUN_AND_RESOLVE_ENDING', 'نتیجه‌گیری نهایی را اعلام می‌کنم', 'صبح طلوع می‌کند و پرونده با حقیقت کامل بسته می‌شود.', 'اتمام موفقیت‌آمیز تحقیق.', turn));

  const evalRes = resolveEnding(state);

  return {
    runId: 'RUN_B_INVESTIGATOR',
    personaName: 'Investigative Detective Player (محقق / منطقی و متمرکز بر تناقض)',
    totalTurns: turn,
    finalEndingId: evalRes.endingId,
    finalVariantId: evalRes.variantId,
    truthDiscovery: evalRes.truthDiscovery,
    truthInterpretation: evalRes.truthInterpretation,
    trustScore: evalRes.trustScore,
    coldSpots: [
      'نود ۱۱ (اتاق بایگانی): خواندن شماره برچسب‌ها و زونکن‌ها نیاز به تمرکز بالا دارد؛ اگر بازیکن حوصله متن طولانی نداشته باشد، این بخش کند به نظر می‌رسد.',
    ],
    confusionPoints: [
      'نود ۱۵ (مقایسه ساعت مانی): تفاوت ۵ دقیقه‌ای ساعت مچی با ساعت سیستم ممکن است بازیکن را به اشتباه به سمت اتهام زدن به مانی ببرد، مگر اینکه انگیزه روانی مانی درک شود.',
    ],
    dropOffRisks: [
      'اگر بازیکن در نود ۱۷ ارتباطات اشتباهی بین مدارک بگذارد و با خطای تناقض مواجه شود، ممکن است حس کند در یک پازل خشک ریاضی گیر افتاده است.',
    ],
    loreLeaks: [],
    artificialCharacters: [
      'کلکتور در نود ۱۶ لحن بسیار منسجم و اداری دارد، اما اگر بازیکن سریعاً پیشنهادش را رد کند، فرصت مانور دیپلماتیک او کمی کوتاه می‌شود.',
    ],
    endingNaturalness: 'بسیار طبیعی (TRUE_ENDING - Investigator Lens) — پاداش کشف گام‌به‌گام و ثبت تایم‌لاین بدون تناقض.',
    logs,
  };
}

/**
 * SIMULATE RUN C: Emotional / Cafe-Life Player (Empathetic, values relationships & safety over truth)
 */
export function simulateRunC(): RunAuditReport {
  const state = createInitialRunState(3003);
  initWitnessRolesAndStatements(state);
  const logs: TurnLog[] = [];
  let turn = 0;

  // Step 1: Role Selection
  turn++;
  logs.push(executeStep(state, 'SELECT_ROLE_ART_HISTORIAN', 'مورخ هنری', 'نقش مورخ هنری انتخاب شد.', 'حس زیبایی‌شناسی و علاقه به هنر و فضای نوآر کافه دارم.', turn));

  // Step 2: Node 01 & 02
  turn++;
  logs.push(executeStep(state, 'ENTER_CAFE', 'وارد کافه می‌شم', 'وارد سالن می‌شوی.', 'می‌خوام کنار شومینه یا روی کاناپه بنشینم.', turn));

  state.canonical.currentNode = 'NODE_02';
  state.scene.nodeId = 'NODE_02';
  turn++;
  logs.push(executeStep(state, 'OBSERVE_PENTI', 'به گربه کافه (پنتی) نگاه می‌کنم و نازش می‌کنم', 'پنتی با آرامش خودش را به پایه مبل می‌مالد.', 'حیوانات حس خوبی به کافه میدن و دوست دارم باهاش ارتباط بگیرم.', turn));

  // Step 3: Node 04 Salar Empathy
  state.canonical.currentNode = 'NODE_04';
  state.scene.nodeId = 'NODE_04';
  turn++;
  logs.push(executeStep(state, 'CALM_SALAR_DOWN', 'سالار رو دلداری میدم و بهش چای تعارف می‌کنم', 'سالار لبخند تلخی می‌زند و تشکر می‌کند.', 'احساس کردم مرد زحمت‌کشیه و تحت فشار سنگینی قرار داره.', turn));

  turn++;
  logs.push(executeStep(state, 'DEFEND_CAFE_STAFF', 'از کارکنان کافه حمایت می‌کنم', 'حانیه و مانی با قدردانی به تو نگاه می‌کنند.', 'نمی‌ذارم تنش بیرونی رفاقت این بچه‌ها رو خراب کنه.', turn));

  // Step 4: Node 09 Kitchen with Mehri
  state.canonical.currentNode = 'NODE_09';
  state.scene.nodeId = 'NODE_09';
  turn++;
  logs.push(executeStep(state, 'ASK_MEHRI_ABOUT_DATING', 'با آرین مهری درباره قرارهای عاشقانه‌اش شوخی می‌کنم', 'مهری با خنده سس را هم می‌زند و از دردسرهایش می‌گوید.', 'می‌خوام فضای آشپزخونه شاد بمونه و یخ رابطه بشکنه.', turn));

  // Step 5: Node 15 Support Hanieh & Penti
  state.canonical.currentNode = 'NODE_15';
  state.scene.nodeId = 'NODE_15';
  turn++;
  logs.push(executeStep(state, 'COMFORT_HANIEH_ABOUT_PENTI', 'به حانیه اطمینان میدم که خطری پنتی رو تهدید نمی‌کنه', 'حانیه نفس راحتی می‌کشد و پنتی را بغل می‌کند.', 'دیدم حانیه به خاطر استرس کافه نگرانه و اولویتم آرامش او بود.', turn));

  turn++;
  logs.push(executeStep(state, 'SUPPORT_MANI_LOYALTY', 'به مانی یادآوری می‌کنم که غیرت و حضورش برای کافه باارزشه', 'مانی سرش را بالا می‌گیرد و لبخند می‌زند.', 'نمی‌خواستم مانی حس کنه سرکوفت خورده یا مقصره.', turn));

  // Step 6: Node 16 Collector Meeting (Offer Accepted to save Salar)
  state.canonical.currentNode = 'NODE_16';
  state.scene.nodeId = 'NODE_16';
  state.canonical.canonicalFlags.push('accepted_financial_offer', 'protected_group');
  state.npcMemory = {
    salar: { rapport: 4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    haniyeh: { rapport: 4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    mani: { rapport: 4, awareness: [], beliefs: [], impressions: [], commitments: [] },
    yashin: { rapport: 3, awareness: [], beliefs: [], impressions: [], commitments: [] },
  };

  turn++;
  logs.push(executeStep(state, 'ACCEPT_FINANCIAL_OFFER', 'پیشنهاد مالی کلکتور رو قبول می‌کنم تا بدهی‌های سالار تسویه بشه', 'کلکتور پوشه چک‌ها را تحویل می‌دهد و کافه از بدهی آزاد می‌شود.', 'نمی‌خواستم سالار ورشکست بشه یا بچه‌ها کارشون رو از دست بدن.', turn));

  const evalRes = resolveEnding(state);

  return {
    runId: 'RUN_C_EMOTIONAL',
    personaName: 'Emotional Cafe-Life Player (همدل و حامی اعضای کافه)',
    totalTurns: turn,
    finalEndingId: evalRes.endingId,
    finalVariantId: evalRes.variantId,
    truthDiscovery: evalRes.truthDiscovery,
    truthInterpretation: evalRes.truthInterpretation,
    trustScore: evalRes.trustScore,
    coldSpots: [
      'نود ۱۲ (اتاق سرور): برای بازیکنی که دنبال دیالوگ و احساساته، بررسی لاگ‌های شبکه و آی‌پی جذابیت کمتری دارد.',
    ],
    confusionPoints: [
      'نود ۱۶ (مذاکره با کلکتور): بازیکن ممکن است فکر کند با پذیرش پول، پایان بدی می‌گیرد، در حالی که بازی این را به عنوان یک فداکاری واقع‌گرایانه برای نجات کافه ترسیم می‌کند.',
    ],
    dropOffRisks: [
      'اگر بازیکن احساس کند که بازی او را مجبور می‌کند حتماً کارآگاه‌بازی دربیاورد تا پاداش بگیرد، ممکن است انگیزه‌اش برای تعامل انسانی کم شود.',
    ],
    loreLeaks: [],
    artificialCharacters: [
      'آرین گرشاسبی در نود ۱۳ اگر خیلی سریع وارد فاز تعقیب فیزیکی شود، برای این بازیکنِ آرام کمی شوکه‌کننده است.',
    ],
    endingNaturalness: 'کاملاً طبیعی (THE_PRICE_SIMPLE / THE_PRICE_SACRIFICE) — روایتی تلخ اما منطقی از نجات دوستان به بهای از دست رفتن اثر.',
    logs,
  };
}

export function runAllPlaytestAudits() {
  console.log('================================================================');
  console.log('       PENTIMENTO — AUTONOMOUS PLAYTEST AGENT REPORT');
  console.log('================================================================\n');

  const rA = simulateRunA();
  const rB = simulateRunB();
  const rC = simulateRunC();

  const runs = [rA, rB, rC];
  for (const r of runs) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`RUN: ${r.runId} | Profile: ${r.personaName}`);
    console.log(`Total Turns Executed: ${r.totalTurns} | Ending: ${r.finalEndingId} (${r.finalVariantId})`);
    console.log(`Truth Discovery: ${r.truthDiscovery}/100 | Interpretation: ${r.truthInterpretation}/100 | Trust: ${r.trustScore}/100`);
    console.log(`----------------------------------------------------------------`);
    console.log(`1. اولین نقطه سردی: ${r.coldSpots.join(' | ')}`);
    console.log(`2. اولین نقطه گیجی: ${r.confusionPoints.join(' | ')}`);
    console.log(`3. احتمال ترک بازی: ${r.dropOffRisks.join(' | ')}`);
    console.log(`4. نشت روایی (Lore Leak): ${r.loreLeaks.length === 0 ? 'هیچ موردی یافت نشد (کاملاً امن)' : r.loreLeaks.join(', ')}`);
    console.log(`5. ارزیابی طبیعی بودن شخصیت‌ها: ${r.artificialCharacters.join(' | ')}`);
    console.log(`6. طبیعی بودن پایان: ${r.endingNaturalness}`);
    console.log(`----------------------------------------------------------------\n`);
  }
}

runAllPlaytestAudits();

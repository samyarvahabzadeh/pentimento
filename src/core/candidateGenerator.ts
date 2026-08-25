import type {
  ActionPrimitive,
  CandidateAction,
  CandidateActionKind,
  CandidateItemForRanker,
  PlayerClassId,
  RunState,
  SemanticAction,
  TurnRankerPacket,
} from './types.js';
import { findWorldObject, hasStandaloneLexeme, INITIAL_WORLD_OBJECTS } from './worldAffordances.js';
import { solveSemanticAction } from './semanticSolver.js';
import {
  EPISODE_01_CLUE_CONSTELLATIONS,
  evaluateEpisode01Constellations,
} from '../canon/episode01Situation.js';
import {
  classifyConversationalIntent,
  inferPlayerIdentity,
  isPlayerIdentityDeclaration,
  roleCandidateId,
} from './conversationGrounding.js';

export const ACTION_PRIMITIVES: ActionPrimitive[] = [
  'move', 'inspect', 'touch', 'take', 'give', 'hide', 'use', 'combine', 'damage',
  'threaten', 'persuade', 'deceive', 'ask', 'accuse', 'follow', 'wait', 'listen',
  'smell', 'taste', 'distract', 'steal', 'protect', 'reveal', 'leave', 'block',
  'lock', 'record', 'improvise'
];

/**
 * Extracts a structured Semantic Action Representation using generic lexical rules.
 */
export function extractSemanticAction(playerInput: string, state: RunState): SemanticAction {
  const norm = playerInput.trim();
  const mentionsDoor = hasStandaloneLexeme(norm, 'در') || /ورودی|مدخل/.test(norm);

  let primitive: ActionPrimitive = 'inspect';
  let target: string | undefined = undefined;
  let secondaryTarget: string | undefined = undefined;
  let method: string = norm;
  let motive: string | undefined = undefined;
  let confidence = 0.85;
  const conversationalIntent = classifyConversationalIntent(norm);
  const explicitQuestion = /[؟?]/.test(norm) || /(?:می‌?پرسم|میپرسم|سؤال\s*می‌?کنم|سوال\s*می‌?کنم|از\s+\S+.*(?:می‌?خواهم|می‌?خوام).*(?:بگو|توضیح|جواب)|(?:^|\s)(?:چرا|چطور|چجوری|کجاست|کیه|چیه|اسمت|نامت)(?:\s|$|[؟?]))/.test(norm);
  const explicitPersuasion = /قانع|متقاعد|راضی.*کن|قول.*(?:کمک|محافظت|همکاری)|می‌?(?:خواهم|خوام).*(?:همکاری|اعتماد).*کن|از\s+\S+.*می‌?(?:خواهم|خوام).*(?:نگه|ثبت|کمک|حفظ|بمان|بیاد|بیاید|انجام)/.test(norm);
  const explicitDeception = /دروغ|بلوف|وانمود|ادعا.*(?:جعلی|غلط|کرده)|فریب|اطلاعات.*غلط|(?:بازرس|از\s*اماکن).*(?:هستم|اومدم|آمدم|بازرسی)/.test(norm);
  const explicitThreat = /اگه.*(?:نگی|نکنی)|اگر.*(?:نگویی|نکنی)|وگرنه|تهدید|گشت.*تماس|تماس.*گشت|پلیس.*(?:خبر|تماس)|بهتره.*(?:جواب|بگی)/.test(norm);
  const explicitConversation = /(?:^|[،,\s])(?:سلام|درود|خسته\s*نباشید|شب\s*بخیر|ممنون|مرسی|متشکرم)(?:$|[،,!\s])|می‌?(?:گم|گویم)|میگم|زنگ\s*می‌?زن|تماس\s*می‌?گیر|پیام\s*می‌?(?:دم|دهم)/.test(norm);
  const orderRequest = /سفارش\s*می‌?(?:دم|دهم)|(?:قهوه|اسپرسو|نوشیدنی).*(?:می‌?خوام|می‌?خواهم|بیار|لطفا)|(?:یه|یک)\s*(?:قهوه|اسپرسو).*(?:سفارش|می‌?خوام|می‌?خواهم)/.test(norm);

  // 1. Generic Primitive Extraction
  // Explicit speech framing wins over action words inside the topic.  Asking
  // Salar why he "hid" a contract is an ask, not an attempt to hide Salar.
  if (state.canonical?.currentNode === 'NODE_00' && isPlayerIdentityDeclaration(norm)) {
    primitive = 'improvise';
    confidence = 0.99;
  } else if (explicitDeception) {
    primitive = 'deceive';
  } else if (explicitThreat) {
    primitive = 'threaten';
  } else if (conversationalIntent) {
    primitive = 'inspect';
    target = 'scene_overview';
    confidence = 0.99;
  } else if (explicitPersuasion) {
    primitive = 'persuade';
  } else if (explicitQuestion || explicitConversation || orderRequest) {
    primitive = 'ask';
  } else if (hasStandaloneLexeme(norm, 'مشت') || /لگد|سیلی|حمله|می‌?زنمش|بزنمش|هلش|گلاویز|یقه.*می‌?گیر/.test(norm)) {
    primitive = 'damage';
  } else if (
    (/جلوی/.test(norm) && (mentionsDoor || /راه/.test(norm)) && /می‌?(?:کشم|گذارم|ذارم|چینم)|قرار\s*می‌?د|هل|پرت|سد|حائل|مسدود/.test(norm)) ||
    /مسدود|سد|مانع|بستن.*راه|راه.*می‌?(?:بند|گیر)|حائل/.test(norm)
  ) {
    primitive = 'block';
  } else if (/قفل|چفت/.test(norm)) {
    primitive = 'lock';
  } else if (/محافظت|حفاظت|امن.*کن|مراقب.*باش|نگهبانی|دفاع.*از/.test(norm)) {
    primitive = 'protect';
  } else if (/(?:می‌?رم|میرم|می‌?روم|برم|وارد).*(?:پشت\s*(?:کانتر|بار)|پشت\s*(?:تابلو|بوم))/.test(norm)) {
    primitive = 'move';
  } else if (/هیچ.*حرف.*نمی‌?زن|بی‌?حرف.*می‌?(?:نشین|مان)|ده\s*دقیقه.*(?:می‌?نشین|ساکت)|ساکت.*می‌?نشین/.test(norm)) {
    primitive = 'wait';
  } else if (/نوازش|ناز\s*می‌?کن|(?:دست|انگشت).*?(?:روی|به).*?(?:می‌?کشم|می‌?زنم)|با\s*انگشتم.*روی|لمس|بغل\s*می‌?کن|بغلش|می‌?بوس/.test(norm)) {
    primitive = 'touch';
  } else if (/می‌?(?:شینم|نشینم)|میشینم|بشینم|روی.*صندلی.*می‌?شین/.test(norm)) {
    primitive = 'use';
  } else if (mentionsDoor && /باز\s*می‌?کن|می‌?بندم|ببندم|بستن|پشت\s*سرم.*(?:بند|بسته)/.test(norm)) {
    primitive = 'use';
  } else if (/خاموش|قطع.*برق|کلید.*برق|نور.*(صفر|خاموش|قطع)|تاریک\s*(کردن|کنم|شدن|بشه)|تاریکی\s*(مطلق|ایجاد)/.test(norm)) {
    primitive = 'use';
  } else if (/منتشر|افشا|عمومی|خبرنگار|لایو|آپلود/.test(norm)) {
    primitive = 'reveal';
  } else if (/ضبط|صوت|ویس|رکورد/.test(norm)) {
    primitive = 'record';
  } else if (/پاره|تکه‌?تکه|خرد|سوزاندن|شکستن|تخریب|خیس‌تر|مخدوش/.test(norm)) {
    primitive = 'damage';
  } else if (/می‌?دزدم|سرقت|کشs*می‌?رم|قاپ|یواشکی.*برمی‌?دار/.test(norm)) {
    primitive = 'steal';
  } else if (/پنهان|قایم|سُر.*بدم|جاسازی|می‌?ذارم.*زیر|بذارم.*زیر|زیر.*می‌?گذارم|زیر.*بذارم|رها.*زیر|زیر.*رها\s*می‌?کن/.test(norm)) {
    primitive = 'hide';
  } else if (/(?:یک|چند)?\s*قدم.*برمی‌?دار|قدم\s*برمی‌?دار/.test(norm)) {
    primitive = 'move';
  } else if (/داخل.*کیف|توی.*جیب|بردارم|برمی‌دارم|برداشتن|بذارم.*کیف|بالا.*می‌کشم|بلند.*می‌کنم/.test(norm)) {
    primitive = 'take';
  } else if (/حواس.*پرت|پرت.*حواس/.test(norm)) {
    primitive = 'distract';
  } else if (/استفاده\s*می‌?کن|جلوی\s*نور\s*می‌?گیر|مرتب.*(?:ردیف|می‌?چین)|ردیف.*می‌?چین|صاف\s*می‌?کن|(?:روشنایی|نور|صدا|حرارت).*(?:کم|زیاد|تنظیم)\s*می‌?کن|(?:پسورد|رمز).*(?:حدس|امتحان)|خراشیدن|جدا\s*(?:می‌?کن|کن)|شیر\s*آب.*باز\s*می‌?کن|پرده.*(?:باز|بسته|کامل).*می‌?کشم/.test(norm)) {
    primitive = 'use';
  } else if (hasStandaloneLexeme(norm, 'هل') || /هلش|هل\s*می‌?|پرتش|(?:^|\s)پرت\s*(?:می‌?|کن)|حرکت\s*می‌?|جابه‌?جا|منتقل\s*می‌?کن/.test(norm)) {
    primitive = 'move';
  } else if (/دروغ|بلوف|وانمود|ادعا|فریب|اطلاعات.*غلط/.test(norm)) {
    primitive = 'deceive';
  } else if (/پیشنهاد.*پول|رشوه|معامله|می‌خرم|پول.*بدم/.test(norm)) {
    primitive = 'give';
  } else if (/قانع|متقاعد|راضی.*کن|اعتماد.*کن|همکاری.*کن|آرام.*کن/.test(norm)) {
    primitive = 'persuade';
  } else if (/بپرسم|می‌?پرسم|میپرسم|سوال|صحبت|گفتگو|درخواست|از\s+\S+.*می‌?خوام|می‌?خوام.*بده/.test(norm)) {
    primitive = 'ask';
  } else if (/استشمام|استنشاق|رایحه|بو\s*(?:می‌?کشم|می‌?کنم|کنم|بکشم)|بوی(?:ِ|\s|$)/.test(norm)) {
    primitive = 'smell';
  } else if (/نوشیدن|می‌?نوشم|بنوشم|بخورم|سر.*می‌کشم|چشیدن/.test(norm)) {
    primitive = 'taste';
  } else if (/سکوت|صبر|وایمیستم|می‌?(?:ایستم|مانم)|مستقر.*می‌?شوم|کاری.*نمی‌کنم|خیره/.test(norm)) {
    primitive = 'wait';
  } else if (/تعقیب|دنبالش|دنبال.*می‌?ر[وو]م|ردش.*می‌?گیر|کمین/.test(norm)) {
    primitive = 'follow';
  } else if (/حواس.*پرت|سرگرم.*کن|پرت.*کردن.*حواس|دست.*به.*سر/.test(norm)) {
    primitive = 'distract';
  } else if (/پشت.*کانتر|پشت.*بار|وارد|(?:از\s+(?:کافه|سالن|اتاق)\s+خارج)|(?:خارج|بیرون)\s+می‌?(?:روم|رم|شوم|زنم)|داخل.*(کافه|سالن|اتاق)|برم|می‌?رم|می‌?ر[وو]م|میرم|می‌?(?:آ|ا)م|قدم|دستگیره.*فشار/.test(norm)) {
    primitive = 'move';
  } else if (/تهدید|تحت.*فشار|فشار.*(می‌?آور|بیار)|زور/.test(norm)) {
    primitive = 'threaten';
  } else if (/متهم|دزد|تقصیر/.test(norm)) {
    primitive = 'accuse';
  } else if (/گوش\s*(?:می‌?دهم|می‌?دم|می‌?کنم|دادن|بسپار)|صدا.*(بشنوم|بشنو)|شنود|استراق|شنیدن/.test(norm)) {
    primitive = 'listen';
  } else if (/نگاه|بررسی|مشاهده|چک|دیدن|وارسی|مقایسه|تطبیق|فراخوان|باز.*(زونکن|فاکتور|پرونده|سند|گزارش|لاگ)|(زونکن|فاکتور|پرونده|سند|گزارش|لاگ).*(باز|ورق)|نور.*(بتاب|می‌?تابان|مورب|مایل|زاویه|هدایت)|می‌?خوانم|بخوان|خواندن|قرائت/.test(norm)) {
    primitive = 'inspect';
  } else {
    primitive = 'improvise';
  }

  // 2. Detect Target from World Objects & NPCs
  const worldObjects = state.worldObjects || INITIAL_WORLD_OBJECTS;
  const matchedObj = findWorldObject(norm, worldObjects);
  if (matchedObj && target !== 'scene_overview') {
    target = matchedObj.id;
  }

  // In containment sentences, the object after «زیر/پشت» is the hiding
  // place, not the item being hidden. Resolve the carried item explicitly so
  // «رسید را زیر منو می‌گذارم» cannot turn into "hide the menu under itself".
  if (primitive === 'hide') {
    if (hasStandaloneLexeme(norm, 'رسید') || /فیش|کاغذ.*خیس|برگه.*خیس/.test(norm)) {
      target = 'wet_receipt';
    } else if (/گوشی|موبایل/.test(norm)) {
      target = 'smartphone';
    }
  }

  const npcIds = ['salar', 'mani', 'yashin', 'haniyeh', 'collector', 'exiting_man'];
  const mentionedNpcs = npcIds.filter(id => {
    if (id === 'salar' && /سالار|صالحی/.test(norm)) return true;
    if (id === 'mani' && /(?:^|\s)مانی(?:$|\s|،|!|\.)/.test(norm)) return true;
    if (id === 'yashin' && /یاشین/.test(norm)) return true;
    if (id === 'haniyeh' && /حانیه/.test(norm)) return true;
    if (id === 'collector' && /کلکسیونر|خریدار/.test(norm)) return true;
    if (id === 'exiting_man' && /مرد.*(?:پالتو|دستکش)|پالتوپوش/.test(norm)) return true;
    return false;
  });
  let addressedNpc: string | undefined;
  if (/از\s+(?:خانم\s+)?حانیه|به\s+حانیه.*(?:می‌?پرسم|میپرسم|می‌?گم|میگم)|حانیه\s*جان/.test(norm)) addressedNpc = 'haniyeh';
  else if (/از\s+سالار|به\s+سالار.*(?:می‌?پرسم|میپرسم|می‌?گم|میگم|زنگ|پیام)|سالار\s*جان/.test(norm)) addressedNpc = 'salar';
  else if (/از\s+یاشین|به\s+یاشین.*(?:می‌?پرسم|میپرسم|می‌?گم|میگم)|یاشین\s*جان/.test(norm)) addressedNpc = 'yashin';
  else if (/از\s+مانی|به\s+مانی.*(?:می‌?پرسم|میپرسم|می‌?گم|میگم)|مانی\s*جان/.test(norm)) addressedNpc = 'mani';
  else if (/از\s+(?:کلکسیونر|خریدار)|به\s+(?:کلکسیونر|خریدار).*(?:می‌?پرسم|میپرسم|می‌?گم|میگم)/.test(norm)) addressedNpc = 'collector';

  if (!addressedNpc && orderRequest) {
    const present = state.scene?.activeEntityIds ?? [];
    if (present.includes('yashin')) addressedNpc = 'yashin';
    else if (present.includes('haniyeh')) addressedNpc = 'haniyeh';
    else if (present.includes('mani')) addressedNpc = 'mani';
  }

  const matchedNpc = addressedNpc ?? mentionedNpcs[0];
  if (matchedNpc) {
    const isSocialAction = ['deceive', 'ask', 'threaten', 'accuse', 'give', 'persuade', 'distract'].includes(primitive);
    if (isSocialAction || !target) {
      secondaryTarget = target ?? mentionedNpcs.find(id => id !== matchedNpc);
      target = matchedNpc;
    } else {
      secondaryTarget = matchedNpc;
    }
  }

  // Resolve colloquial pronouns/questions against a single present actor.
  // This is scene grounding, not mind-reading: ambiguous crowds remain unset.
  const needsImplicitSocialAddressee = ['ask', 'persuade', 'deceive', 'threaten', 'accuse'].includes(primitive);
  const needsImplicitDamageTarget = primitive === 'damage' && !target;
  const needsImplicitObservationTarget = primitive === 'inspect' && !target && /دست(?:‌|\s*)هاش|پالتوش|چهره(?:‌|\s*)ش|حالتش|رفتارش|خودش|واکنشش/.test(norm);
  if (!matchedNpc && (needsImplicitSocialAddressee || needsImplicitDamageTarget || needsImplicitObservationTarget)) {
    const knownNpcIds = new Set(npcIds);
    const presentNpcs = (state.scene?.activeEntityIds ?? [])
      .map(id => id.replace('_salehi', ''))
      .filter(id => knownNpcIds.has(id));
    if (presentNpcs.length === 1) {
      secondaryTarget = target;
      target = presentNpcs[0];
    }
  }

  // 3. Detect Spatial Destinations & Secondary Targets
  if (mentionsDoor) {
    if (target && target !== 'cafe_door') secondaryTarget = 'cafe_door';
    else if (!target) target = 'cafe_door';
  }
  if (/کیف|جیب/.test(norm)) secondaryTarget = 'in_bag';
  if (/زیر.*منو/.test(norm)) secondaryTarget = 'table5_menu';
  if (/زیر.*فنجان|زیر.*نعلبکی/.test(norm)) secondaryTarget = 'table5_saucer';
  if (/زیر.*میز\s*(?:۵|5|پنج)/.test(norm) && !/زیر.*(?:فنجان|نعلبکی|منو)/.test(norm)) {
    secondaryTarget = 'under_table5';
  }
  if (/پشت.*بار|پشت.*کانتر/.test(norm)) target = 'behind_counter';

  // In barrier commands the movable obstacle is the acted-on object while
  // doors, corridors, or the painting describe the line being blocked. The
  // general object matcher otherwise tends to select the narratively prominent
  // painting and then reports the nearby chair as out of reach.
  if (primitive === 'block' && /صندلی/.test(norm)) {
    target = 'wooden_chair';
    if (mentionsDoor || /راه.*(?:ورود|خروج)|از.*در.*تا/.test(norm)) {
      secondaryTarget = 'cafe_door';
    }
  }

  return {
    primitive,
    target,
    secondaryTarget,
    method,
    motive,
    rawInput: norm,
    confidence,
  };
}

/**
 * Builds a dynamic, emergent CandidateAction by delegating to the Generic Semantic Solver.
 */
export function buildEmergentCandidateAction(semantic: SemanticAction, state: RunState): CandidateAction {
  // Candidate generation is a preview operation.  The semantic solver mutates
  // world state, so running it against the live state awarded clues and trust
  // before a candidate was even selected (and often awarded them twice).
  const previewState: RunState = JSON.parse(JSON.stringify(state));
  const solverRes = solveSemanticAction(semantic, previewState);
  return {
    id: `emergent_${semantic.primitive}_${semantic.target ?? 'object'}`,
    kind: 'other',
    targetIds: semantic.target ? [semantic.target] : state.scene.visibleObjectIds,
    summary: semantic.rawInput,
    effects: solverRes.acceptedEffects,
    narrativeBeatId: 'beat_emergent_generic',
    risk: 0,
    isEmergent: true,
    emergentProse: solverRes.narrative,
  };
}

/**
 * Returns candidate actions valid for the current node/scene + player's freeform semantic action.
 */
export function generateSceneCandidates(state: RunState, playerInput: string): CandidateAction[] {
  const node = state.canonical.currentNode || 'NODE_00';
  const candidates: CandidateAction[] = [];
  const constellationResults = evaluateEpisode01Constellations(state);
  const establishedConstellations = constellationResults.filter(result => result.established);
  const historicalConstellation = constellationResults.find(
    result => result.id === 'painting_is_a_historical_breach'
  );

  const routeNamesFa: Record<string, string> = {
    chemical_behavior: 'رد شیمیایی فنجان و رفتار مرد',
    human_witnesses: 'شهادت‌های انسانی و واکنش پنتی',
    timing_records: 'ناهماهنگی زمان‌های مستقل',
    document_forensics: 'کالبدشکافی قالب و چاپ اسناد',
    system_forensics: 'رد دیجیتال صندوق و دوربین',
    social_pressure: 'تناقض شاهدها و فشار معامله',
    material_provenance: 'لایه‌شناسی و شجرهٔ مادی بوم',
    faction_leverage: 'رفتار خریدار و منطق جناح‌ها',
    causal_synthesis: 'بازسازی علّی خاموشی و انتقال',
  };

  const establishedRouteDescriptions = establishedConstellations.flatMap(result =>
    result.supportingRouteIds.map(routeId => routeNamesFa[routeId] ?? routeId)
  );
  const establishedClaims = establishedConstellations.map(result =>
    EPISODE_01_CLUE_CONSTELLATIONS.find(item => item.id === result.id)?.claimFa
  ).filter((claim): claim is string => Boolean(claim));

  // 1. Special Authored Story Mechanics & Branching Candidates Only
  switch (node) {
    case 'NODE_00':
      candidates.push(
        {
          id: 'SELECT_ROLE_ART_HISTORIAN',
          kind: 'other',
          targetIds: ['role_art_historian'],
          summary: 'انتخاب لنز تخصصی مورخ هنری',
          effects: [
            { type: 'set_flag', flag: 'ROLE_ART_HISTORIAN', value: true },
            { type: 'change_scene', sceneId: 'scene_entrance', nodeId: 'NODE_01' },
          ],
          narrativeBeatId: 'beat_role_selected_art',
          risk: 0,
        },
        {
          id: 'SELECT_ROLE_COFFEE_ALCHEMIST',
          kind: 'other',
          targetIds: ['role_coffee_alchemist'],
          summary: 'انتخاب لنز تخصصی کیمیاگر قهوه',
          effects: [
            { type: 'set_flag', flag: 'ROLE_COFFEE_ALCHEMIST', value: true },
            { type: 'change_scene', sceneId: 'scene_entrance', nodeId: 'NODE_01' },
          ],
          narrativeBeatId: 'beat_role_selected_chem',
          risk: 0,
        },
        {
          id: 'SELECT_ROLE_SYSTEMS_ANALYST',
          kind: 'other',
          targetIds: ['role_systems_analyst'],
          summary: 'انتخاب لنز تخصصی تحلیل‌گر سیستم‌ها',
          effects: [
            { type: 'set_flag', flag: 'ROLE_SYSTEMS_ANALYST', value: true },
            { type: 'change_scene', sceneId: 'scene_entrance', nodeId: 'NODE_01' },
          ],
          narrativeBeatId: 'beat_role_selected_sys',
          risk: 0,
        },
        {
          id: 'SELECT_ROLE_INVESTIGATOR',
          kind: 'other',
          targetIds: ['role_investigator'],
          summary: 'انتخاب لنز تخصصی کارآگاه اجتماعی',
          effects: [
            { type: 'set_flag', flag: 'ROLE_INVESTIGATOR', value: true },
            { type: 'change_scene', sceneId: 'scene_entrance', nodeId: 'NODE_01' },
          ],
          narrativeBeatId: 'beat_role_selected_social',
          risk: 0,
        },
        {
          id: 'SELECT_ROLE_OBSERVER',
          kind: 'other',
          targetIds: ['role_observer'],
          summary: 'پذیرفتن پیشینهٔ آزاد بازیکن بدون تحمیل تخصص جعلی',
          effects: [
            { type: 'set_flag', flag: 'ROLE_OBSERVER', value: true },
            { type: 'change_scene', sceneId: 'scene_entrance', nodeId: 'NODE_01' },
          ],
          narrativeBeatId: 'beat_role_selected_observer',
          risk: 0,
        }
      );
      break;

    case 'NODE_01':
      candidates.push({
        id: 'FOLLOW_EXITING_MAN',
        kind: 'move',
        targetIds: ['exiting_man', 'hosseini_alley'],
        summary: 'تعقیب شتاب‌زده مرد پالتوپوش در تاریکی کوچه حسینی',
        effects: [
          { type: 'modify_clock', clock: 'personalRisk', delta: 2, reason: 'تعقیب بدون آمادگی در تاریکی' },
          { type: 'change_scene', sceneId: 'scene_hosseini_alley', nodeId: 'NODE_13' },
        ],
        narrativeBeatId: 'beat_follow_man_alley',
        risk: 2,
      });
      break;

    case 'NODE_02':
      candidates.push({
        id: 'DRINK_FROM_CUP_RECKLESS',
        kind: 'use',
        targetIds: ['espresso_cup'],
        summary: 'نوشیدن بی‌پروای محتوای فنجان مشکوک',
        effects: [
          { type: 'modify_clock', clock: 'personalRisk', delta: 4, reason: 'بلعیدن حلال سمی' },
          { type: 'trigger_ending', endingId: 'BAD_ENDING_TOXIC_SHOCK', foreshadowId: 'solvent_smell', causeEventId: 'evt_drink_toxic' },
        ],
        narrativeBeatId: 'beat_drink_toxic_cup',
        risk: 4,
      });
      break;

    case 'NODE_03':
      candidates.push({
        id: 'INSULT_MANI_COFFEE',
        kind: 'pressure',
        targetIds: ['mani'],
        summary: 'توهین به کیفیت قهوه و تمیزی باریستا',
        effects: [
          { type: 'modify_trust', npcId: 'mani', delta: -2 },
          { type: 'modify_clock', clock: 'npcPanic', delta: 1, reason: 'تشنج کلامی پشت کانتر' },
          { type: 'record_memory', npcId: 'mani', memory: 'بازیکن به کیفیت قهوه توهین کرد', tag: 'insult' },
        ],
        narrativeBeatId: 'beat_insult_mani',
        risk: 1,
      });
      break;

    case 'NODE_06':
      candidates.push({
        id: 'INSPECT_BEHIND_PAINTING',
        kind: 'take',
        targetIds: ['painting_back', 'label'],
        summary: 'نگاه کردن به پشت بوم و برچسب شجره‌نامه',
        effects: [
          { type: 'change_scene', sceneId: 'scene_painting_back', nodeId: 'NODE_07' },
        ],
        narrativeBeatId: 'beat_inspect_behind_painting',
        risk: 0,
      });
      break;

    case 'NODE_11':
      // All office ledger, inquiries, and transitions resolved via generic dispatch
      break;

    case 'NODE_16':
      if (!state.canonical.canonicalFlags.includes('collector_bluff_used')) {
        candidates.push({
          id: 'BLUFF_COLLECTOR_WITH_EVIDENCE',
          kind: 'pressure',
          targetIds: ['collector'],
          summary: 'بلوف زدن به کلکسیونر با اتکا به مدارک کشف‌شده',
          requires: [
            { kind: 'evidence', targetId: 'fact_invoice_is_forged' },
            { kind: 'evidence', targetId: 'fact_underpainting_hidden_layer' },
          ],
          effects: [
            { type: 'modify_pressure', npcId: 'collector', delta: 2 },
            { type: 'add_proof_domain', domain: 'SOCIAL', points: 2 },
            { type: 'set_flag', flag: 'collector_bluff_used', value: true },
          ],
          narrativeBeatId: 'beat_bluff_collector',
          risk: 2,
          roleAffinity: ['investigator'],
        });
      }
      candidates.push(
        {
          id: 'PROCEED_TO_ARCHIVE_SYNTHESIS',
          kind: 'move',
          targetIds: ['archive_workspace'],
          summary: 'اتصال نهایی مدارک و حل زنجیره دستکاری',
          effects: [
            { type: 'change_scene', sceneId: 'scene_archive', nodeId: 'NODE_17' },
          ],
          narrativeBeatId: 'beat_proceed_archive',
          risk: 0,
          emergentProse: establishedClaims.length > 0
            ? `مذاکره را متوقف می‌کنی و هرچه واقعاً به دست آورده‌ای روی میز آرشیو می‌چینی. فعلاً ${establishedClaims.length} ادعای مستقل پشتوانه دارد؛ می‌توانی همان‌ها را به یک نظریه تبدیل کنی، چیزی را عمداً کنار بگذاری یا برای شاهد تازه برگردی.`
            : 'مذاکره را متوقف می‌کنی و با دست تقریباً خالی پشت میز آرشیو می‌نشینی. بازی جلویت را نمی‌گیرد: می‌توانی یک فرضیهٔ زودهنگام بسازی و بهای خطایش را بپذیری، یا به صحنه برگردی و برایش پشتوانه پیدا کنی.',
        }
      );
      break;

    case 'NODE_17': {
      const synthesisIsSupported = establishedConstellations.length >= 2;
      const synthesisEffects: CandidateAction['effects'] = [];
      if (synthesisIsSupported) {
        synthesisEffects.push({ type: 'add_evidence', evidenceId: 'fact_final_timeline_synthesis' });
      }
      synthesisEffects.push({ type: 'change_scene', sceneId: 'scene_underpainting', nodeId: 'NODE_18' });

      candidates.push({
        id: 'SUBMIT_ARCHIVE_SYNTHESIS',
        kind: 'other',
        targetIds: ['archive_workspace', 'timeline_board'],
        summary: 'جمع‌بندی خط زمانی و زنجیرهٔ انتقال بر اساس مدارک کشف‌شده',
        effects: synthesisEffects,
        narrativeBeatId: 'beat_archive_synthesis_complete',
        risk: 0,
        emergentProse: synthesisIsSupported
          ? `روی میز آرشیو، جواب را از یک چک‌لیست تحویل نمی‌گیری. دو رشته یا بیشتر به یک نقطه رسیده‌اند: ${establishedRouteDescriptions.join('، ')}. نتیجه‌ات این است که ${establishedClaims.join(' و ')} حالا می‌توانی لایهٔ زیرین را با یک نظریهٔ قابل‌دفاع روبه‌رو کنی—هرچند هنوز حق داری بخشی از آن را پنهان، علنی یا قربانی کنی.`
          : 'مدارک را کنار هم می‌گذاری، اما اتصال‌ها هنوز بیشتر شبیه داستان‌اند تا اثبات. با این حال تصمیم می‌گیری نظریهٔ ناقصت را کنار خود تابلو امتحان کنی. اگر زود نتیجه گرفته باشی، جهان مسیرت را نمی‌بندد؛ آدم‌ها و پایان پرونده بهایش را خواهند داد.',
      });
      break;
    }

    case 'NODE_18': {
      const canRevealHistoricalRegister = Boolean(historicalConstellation?.established) ||
        (establishedConstellations.length >= 2 && state.canonical.evidenceIds.includes('fact_final_timeline_synthesis'));
      if (!state.canonical.evidenceIds.includes('fact_florence_historical_breach') && canRevealHistoricalRegister) {
        candidates.push({
          id: 'REVEAL_HISTORICAL_BREACH_FLORENCE',
          kind: 'inspect',
          targetIds: ['florence_document', 'painting_underpainting'],
          summary: 'خراشیدن لایهٔ نهایی و کشف سند کهن کارگاه فلورانس',
          effects: [
            { type: 'add_evidence', evidenceId: 'fact_florence_historical_breach' },
            { type: 'reveal_lore', loreId: 'rg_card_stage3_florence_breach' },
            { type: 'add_proof_domain', domain: 'FACTION', points: 3 },
          ],
          narrativeBeatId: 'beat_reveal_historical_breach',
          risk: 0,
        });
      } else if (!state.canonical.evidenceIds.includes('fact_florence_historical_breach')) {
        candidates.push({
          id: 'PROBE_UNDERPAINTING_WITH_INCOMPLETE_THEORY',
          kind: 'inspect',
          targetIds: ['florence_document', 'painting_underpainting', 'central_painting'],
          summary: 'آزمودن نظریهٔ ناقص روی لایهٔ زیرین تابلو',
          effects: state.canonical.evidenceIds.includes('fact_underpainting_hidden_layer')
            ? []
            : [{ type: 'add_evidence', evidenceId: 'fact_underpainting_hidden_layer' }],
          narrativeBeatId: 'beat_probe_underpainting_incomplete',
          risk: 0,
          emergentProse: 'نور را روی لایهٔ زیرین می‌گردانی، اما نشانه‌ها هنوز فقط یک ترکیب قدیمی‌تر را ثابت می‌کنند؛ نه نام‌ها را، نه جناح‌ها را و نه معنای حذف را. نظریه‌ات شکست نخورده—یک ادعای قابل‌آزمون ساخته است. می‌توانی سراغ ماده و برچسب بروی، رفتار خریدار را بسنجی، یا همین ابهام را مبنای تصمیم نهایی قرار دهی.',
        });
      }
      candidates.push(
        {
          id: 'RESOLVE_FINAL_ENDING_DECISION',
          kind: 'other',
          targetIds: ['final_truth'],
          summary: 'ثبت جمع‌بندی نهایی و پایان اپیزود اول',
          effects: [
            { type: 'set_flag', flag: 'final_decision_requested', value: true },
          ],
          narrativeBeatId: 'beat_resolve_final_ending',
          risk: 0,
        }
      );
      break;
    }

    default:
      break;
  }

  // 2. Emergent Semantic Action Candidate
  const semantic = extractSemanticAction(playerInput, state);
  const emergentCand = buildEmergentCandidateAction(semantic, state);
  candidates.unshift(emergentCand);

  // Universal fallback candidates
  candidates.push({
    id: 'action_observe_surroundings',
    kind: 'inspect',
    targetIds: state.scene.visibleObjectIds,
    summary: 'مشاهده دقیق اطراف و اجزای صحنه جاری',
    effects: [],
    narrativeBeatId: 'beat_observe_scene',
    risk: 0,
  });

  candidates.push({
    id: 'action_leave_cafe_home',
    kind: 'leave',
    targetIds: ['cafe_door', 'home'],
    summary: 'رها کردن پرونده و رفتن به خانه برای خوابیدن',
    effects: [
      { type: 'modify_clock', clock: 'evidenceRemoval', delta: 4, reason: 'ترک پرونده توسط بازیکن و پیشروی حوادث شبانه' },
      { type: 'trigger_ending', endingId: 'BAD_ENDING_ABANDONMENT_ARSON', foreshadowId: 'salar_urgency', causeEventId: 'evt_leave_cafe' },
    ],
    narrativeBeatId: 'beat_abandon_investigation',
    risk: 4,
  });

  return candidates.filter(candidate => candidateRequirementsMet(candidate, state)).slice(0, 8);
}

export function candidateRequirementsMet(candidate: CandidateAction, state: RunState): boolean {
  if (!candidate.requires || candidate.requires.length === 0) return true;

  return candidate.requires.every(requirement => {
    switch (requirement.kind) {
      case 'evidence':
        return state.canonical.evidenceIds.includes(requirement.targetId) || state.scene.establishedFactIds.includes(requirement.targetId);
      case 'item':
        return state.canonical.inventoryIds.includes(requirement.targetId);
      case 'flag':
        return state.canonical.canonicalFlags.includes(requirement.targetId);
      case 'role':
        return state.canonical.playerClass === requirement.targetId;
      case 'min_trust':
        return (state.npcTrust?.[requirement.targetId] ?? 0) >= Number(requirement.value ?? 0);
      case 'min_pressure':
        return (state.npcPressure?.[requirement.targetId] ?? 0) >= Number(requirement.value ?? 0);
      case 'clock_below':
        return Number((state.clocks as any)?.[requirement.targetId] ?? 0) < Number(requirement.value ?? 0);
      case 'lore_stage':
        return Number(state.redGloveLoreStage ?? 0) >= Number(requirement.value ?? 0);
      default:
        return false;
    }
  });
}

export function matchCandidateDeterministically(
  playerInput: string,
  candidates: CandidateAction[],
  state?: RunState
): { candidateId: string; confidence: number; kind: CandidateActionKind; semantic?: SemanticAction } | undefined {
  let norm = playerInput.trim();
  norm = norm
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');

  // 1. Character intake in Node 00. The player may declare a profession,
  // relationship, motive, or an entirely custom background. The authored
  // class is an internal mechanical lens, not a four-keyword gate.
  if (state?.canonical.currentNode === 'NODE_00') {
    const numberedRoles: Record<string, PlayerClassId> = {
      '1': 'art_historian',
      '2': 'coffee_alchemist',
      '3': 'systems_analyst',
      '4': 'investigator',
      '5': 'observer',
    };
    const inferredRole = numberedRoles[norm] ?? (
      isPlayerIdentityDeclaration(norm) ? inferPlayerIdentity(norm).role : undefined
    );
    if (inferredRole) {
      const candidateId = roleCandidateId(inferredRole);
      const candidate = candidates.find(cand => cand.id === candidateId);
      if (candidate) return { candidateId: candidate.id, confidence: 0.99, kind: 'other' };
    }
  }

  // 2. Explicit leave intent
  if (/(?:می‌?رم|میرم|برم)\s*(?:خونه|خانه)|برم\s*بخوابم|(?:پرونده|ماجرا|این\s*کار).*(?:ولش\s*کن|بی‌?خیال).*(?:می‌?رم|میرم|برم|خواب)|(?:ولش\s*کن|بی‌?خیال).*(?:پرونده|ماجرا|این\s*کار).*(?:می‌?رم|میرم|برم|خواب)/.test(norm)) {
    const leaveCand = candidates.find(c => c.kind === 'leave');
    if (leaveCand) return { candidateId: leaveCand.id, confidence: 0.98, kind: 'leave' };
  }

  // 3. Explicit reckless drinking
  if (
    /نوشیدن|می‌?نوشم|مینوشم|بنوشم|یک‌?نفس|بخورم|سر\s*می‌?کشم/.test(norm) &&
    /فنجان|قهوه|مایع/.test(norm) &&
    !/خالی/.test(norm)
  ) {
    const drinkCand = candidates.find(c => c.id === 'DRINK_FROM_CUP_RECKLESS');
    if (drinkCand) return { candidateId: drinkCand.id, confidence: 0.98, kind: 'use' };
  }

  // 4. Insulting barista
  if (/توهین|افتضاح|گند|کثیف/.test(norm) && /مانی|قهوه/.test(norm)) {
    const insultCand = candidates.find(c => c.id === 'INSULT_MANI_COFFEE');
    if (insultCand) return { candidateId: insultCand.id, confidence: 0.98, kind: 'pressure' };
  }

  // 5. Following exiting man
  if (/دنبال|تعقیب/.test(norm) && /مرد|پالتو|حسینی|کوچه/.test(norm)) {
    const followCand = candidates.find(c => c.id === 'FOLLOW_EXITING_MAN');
    if (followCand) return { candidateId: followCand.id, confidence: 0.98, kind: 'move' };
  }

  // 6. Observing exiting man
  if (/مرد|پالتو|قدم‌ها|دستکش/.test(norm) && !/فنجان|رسید|صندلی|کلید|برق|تابلو|نقاشی|زونکن|اسناد/.test(norm)) {
    const obsCand = candidates.find(c => c.id === 'OBSERVE_EXITING_MAN');
    if (obsCand) return { candidateId: obsCand.id, confidence: 0.95, kind: 'inspect' };
  }

  // 7. Bluff Collector in Node 16
  if (/تهدید|بلوف|رسوایی|پرونده/.test(norm) && /کلکسیونر|خریدار/.test(norm)) {
    const bluffCand = candidates.find(c => c.id === 'BLUFF_COLLECTOR_NETWORK' || c.id === 'BLUFF_COLLECTOR_WITH_EVIDENCE');
    if (bluffCand) return { candidateId: bluffCand.id, confidence: 0.95, kind: 'pressure' };
  }

  // 8. Discover Historical Breach in Node 18
  if (/فلورانس|لایه‌|تاریخی|سنتز|برملا/.test(norm) && /تابلو|نقاشی|هنر/.test(norm)) {
    const histCand = candidates.find(c =>
      c.id === 'SYNTHESIS_REVEAL_HISTORICAL_BREACH' ||
      c.id === 'REVEAL_HISTORICAL_BREACH_FLORENCE' ||
      c.id === 'PROBE_UNDERPAINTING_WITH_INCOMPLETE_THEORY'
    );
    if (histCand) return { candidateId: histCand.id, confidence: 0.95, kind: 'other' };
  }

  // Authored transitions that are not generic target matches.
  if (/پشت.*(تابلو|بوم|قاب)|برچسب.*پشت/.test(norm)) {
    const behind = candidates.find(c => c.id === 'INSPECT_BEHIND_PAINTING');
    if (behind) return { candidateId: behind.id, confidence: 0.98, kind: behind.kind };
  }
  if (/آرشیو|سنتز|اتصال.*(مدرک|شواهد)|جمع.*(?:شواهد|مدارک)|جمع.?بندی|نظریه.*(?:مدرک|شواهد)/.test(norm)) {
    const archive = candidates.find(c => c.id === 'PROCEED_TO_ARCHIVE_SYNTHESIS');
    if (archive) return { candidateId: archive.id, confidence: 0.98, kind: archive.kind };
    const submit = candidates.find(c => c.id === 'SUBMIT_ARCHIVE_SYNTHESIS');
    if (submit) return { candidateId: submit.id, confidence: 0.98, kind: submit.kind };
  }
  if (/ثبت.*(نتیجه|پایان)|جمع.*بندی.*نهایی|پایان.*پرونده|پرونده.*پایان|تصمیم.*نهایی/.test(norm)) {
    const final = candidates.find(c => c.id === 'RESOLVE_FINAL_ENDING_DECISION');
    if (final) return { candidateId: final.id, confidence: 0.98, kind: final.kind };
  }

  // 9. Semantic Action Extraction
  const semantic = extractSemanticAction(norm, state || { worldObjects: {} } as any);

  // 10. Prioritize unscripted emergent action primitives (damage, hide, record, bluff, bribe, trespass, darkness, barrier, lock)
  if (/پاره|تیکه‌تیکه|قایم|پنهان|سُر.*بدم|ضبط|موبایل|گوشی.*(بده|چک)|دروغ|پیشنهاد.*پول|رشوه|اطلاعات.*غلط|پشت.*کانتر|پشت.*بار|زیر.*فنجان|زیر.*نعلبکی|تاریکی|نوری.*صفر|خیس‌تر|سد|حائل|قفل|چفت|کلید.*برق/.test(norm) || (/بلوف/.test(norm) && !/کلکسیونر|خریدار/.test(norm))) {
    const emergentCand = candidates.find(c => c.isEmergent);
    if (emergentCand) return { candidateId: emergentCand.id, confidence: 0.95, kind: emergentCand.kind, semantic };
  }

  // 11. Generic Structured Match (Primitive + Target Tokens)
  const targetTokens: string[] = [];
  if (semantic.target) targetTokens.push(semantic.target);
  if (semantic.secondaryTarget) targetTokens.push(semantic.secondaryTarget);

  if (targetTokens.includes('cat_penti')) targetTokens.push('penti');
  if (targetTokens.includes('office_ledger')) targetTokens.push('ledger', 'invoices', 'documents');
  if (targetTokens.includes('table5_cup')) targetTokens.push('espresso_cup', 'cup');
  if (targetTokens.includes('central_painting')) targetTokens.push('painting', 'canvas', 'florence_document');
  if (targetTokens.includes('cafe_door')) targetTokens.push('door');

  // Match Phase A: Action Primitive + Target Intersection
  for (const cand of candidates) {
    if (cand.kind === 'leave' || cand.isEmergent || !cand.id.startsWith('action_')) continue;

    const kindMatches = (
      (semantic.primitive === 'ask' && (cand.kind === 'ask' || cand.kind === 'pressure')) ||
      (semantic.primitive === 'move' && cand.kind === 'move') ||
      ((semantic.primitive === 'inspect' || semantic.primitive === 'smell' || semantic.primitive === 'taste') && (cand.kind === 'inspect' || cand.kind === 'take')) ||
      (semantic.primitive === 'take' && (cand.kind === 'take' || cand.kind === 'inspect')) ||
      (semantic.primitive === 'use' && cand.kind === 'use') ||
      (semantic.primitive === 'threaten' && cand.kind === 'pressure') ||
      (semantic.primitive === 'accuse' && cand.kind === 'pressure')
    );

    const targetMatches = targetTokens.some(t =>
      cand.targetIds.some(candTarget => candTarget === t || candTarget.includes(t) || t.includes(candTarget))
    );

    if (kindMatches && targetMatches) {
      return { candidateId: cand.id, confidence: 0.98, kind: cand.kind, semantic };
    }
  }

  // Match Phase B: Target-Only Match (when primitive was imprecise)
  for (const cand of candidates) {
    if (cand.kind === 'leave' || cand.isEmergent || !cand.id.startsWith('action_')) continue;
    const targetMatches = targetTokens.some(t =>
      cand.targetIds.some(candTarget => candTarget === t || candTarget.includes(t) || t.includes(candTarget))
    );
    if (targetMatches) {
      return { candidateId: cand.id, confidence: 0.90, kind: cand.kind, semantic };
    }
  }

  // 12. General surroundings look
  if (/دکوراسیون|نورپردازی|اطراف|سالن|فضا/.test(norm) && !/تابلو|بوم|نقاشی|کلید|برق|خاموش|چراغ|پنتی|زونکن/.test(norm)) {
    const lookCand = candidates.find(c => c.id === 'action_observe_surroundings' || c.id === 'action_look_around_general');
    if (lookCand) return { candidateId: lookCand.id, confidence: 0.95, kind: 'inspect', semantic };
  }

  // 13. Fallback to emergent candidate if generated
  const emergentCand = candidates.find(c => c.isEmergent);
  if (emergentCand) {
    return { candidateId: emergentCand.id, confidence: 0.90, kind: emergentCand.kind, semantic };
  }

  return undefined;
}

export function buildTurnRankerPacket(
  state: RunState,
  playerInput: string,
  candidates: CandidateAction[]
): TurnRankerPacket {
  const candidateItems: CandidateItemForRanker[] = candidates.map(c => ({
    id: c.id,
    summary: c.summary,
    kind: c.kind,
    targetIds: c.targetIds,
  }));

  const recentBeats = state.scene.recentBeats.slice(-3).map(b => b.summary);

  return {
    sceneId: state.scene.sceneId,
    role: state.canonical.playerClass ?? 'art_historian',
    playerText: playerInput,
    recentBeats,
    visibleTargets: state.scene.visibleObjectIds,
    presentNpcs: state.scene.activeEntityIds,
    candidates: candidateItems,
  };
}

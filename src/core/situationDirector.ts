import {
  INITIAL_SITUATION_NPC_INTENTIONS,
  ROLE_LEVERAGE_DEFINITIONS,
} from '../canon/episode01Situation.js';
import type {
  ActionPrimitive,
  CanonicalEffect,
  EpisodeSituationState,
  RunState,
  SituationCrisisId,
  SituationCrisisState,
  SituationFrontId,
  SituationRouteId,
} from './types.js';

export interface SituationTurnContext {
  rawInput: string;
  primitive: ActionPrimitive;
  target?: string;
  secondaryTarget?: string;
  sceneBefore: string;
  sceneAfter: string;
  acceptedEffects: CanonicalEffect[];
  actionSucceeded: boolean;
  /** False only when the engine is clarifying language, not resolving a world attempt. */
  consumesWorldTime?: boolean;
}

export interface SituationTurnOutcome {
  narrativeOverride?: string;
  narrativeAppend?: string;
  eventIds: string[];
  routesAdded: SituationRouteId[];
  leverageAdded: string[];
}

const FRONT_SEQUENCE: Record<EpisodeSituationState['pressurePattern'], SituationFrontId[]> = {
  custodian_first: ['custodian_extraction', 'redactor_cleanup', 'cafe_fracture'],
  cleanup_first: ['redactor_cleanup', 'cafe_fracture', 'custodian_extraction'],
  fracture_first: ['cafe_fracture', 'custodian_extraction', 'redactor_cleanup'],
};

const CRISIS_FOR_FRONT: Record<SituationFrontId, SituationCrisisId> = {
  custodian_extraction: 'painting_extraction',
  redactor_cleanup: 'blackout_cleanup',
  cafe_fracture: 'staff_walkout',
};

const NPC_NAMES_FA: Record<string, string> = {
  salar: 'سالار',
  mani: 'مانی',
  yashin: 'یاشین',
  haniyeh: 'حانیه',
  collector: 'نمایندهٔ خریدار',
};

function clampFront(value: number): number {
  return Math.max(0, Math.min(6, value));
}

function addUnique<T extends string>(items: T[], item: T): boolean {
  if (items.includes(item)) return false;
  items.push(item);
  return true;
}

function addCanonicalFlag(state: RunState, flag: string): void {
  if (!state.canonical.canonicalFlags.includes(flag)) {
    state.canonical.canonicalFlags.push(flag);
  }
}

function addEvidence(state: RunState, factId: string): void {
  if (!state.canonical.evidenceIds.includes(factId)) state.canonical.evidenceIds.push(factId);
  if (!state.scene.establishedFactIds.includes(factId)) state.scene.establishedFactIds.push(factId);
}

export function createInitialEpisodeSituation(
  runSeed: number,
  activatedAtTurn: number,
): EpisodeSituationState {
  const patterns: EpisodeSituationState['pressurePattern'][] = [
    'custodian_first',
    'cleanup_first',
    'fracture_first',
  ];
  const pattern = patterns[Math.abs(runSeed) % patterns.length] ?? 'custodian_first';

  return {
    schemaVersion: '2.7',
    episodeId: 'episode_01_lot_55',
    activated: true,
    activatedAtTurn,
    pulse: 0,
    pressurePattern: pattern,
    fronts: {
      custodian_extraction: { progress: 0, contained: false, lastAdvancedPulse: 0 },
      redactor_cleanup: { progress: 0, contained: false, lastAdvancedPulse: 0 },
      cafe_fracture: { progress: 0, contained: false, lastAdvancedPulse: 0 },
    },
    npcIntentions: JSON.parse(JSON.stringify(INITIAL_SITUATION_NPC_INTENTIONS)),
    routeMarks: [],
    leverage: [],
    irreversibleConsequences: [],
    openCrises: [],
    eventHistory: [],
    actionHistory: [],
  };
}

function shouldRunSituation(state: RunState): boolean {
  return !state.canonical.endingId && state.canonical.currentNode !== 'NODE_00' && state.canonical.currentNode !== 'NODE_01';
}

function classifyTopic(raw: string): string {
  if (/سفارش|(?:یه|یک)\s*(?:قهوه|اسپرسو)|(?:قهوه|اسپرسو).*(?:می‌?خوام|می‌?خواهم|بیار)/.test(raw)) return 'service_order';
  if (/پنتی|گربه/.test(raw)) return 'penti';
  if (/کجا|کجاست/.test(raw)) return 'whereabouts';
  if (/زنگ|تماس|تلفن|پیام/.test(raw) && /رسیدم|اومدم|آمدم|اینجام/.test(raw)) return 'arrival';
  if (/^(?:\s)*(?:سلام|درود|خسته\s*نباشید|شب\s*بخیر)/.test(raw)) return 'greeting';
  if (/مرد|مهمان|مشتری|دستکش/.test(raw)) return 'visitor';
  if (/فاکتور|سند|زونکن|پلاک|۵۵|55/.test(raw)) return 'invoice';
  if (/فنجان|قهوه|حلال|بو/.test(raw)) return 'cup';
  if (/دوربین|لاگ|پوز|ساعت|زمان/.test(raw)) return 'timeline';
  if (/تابلو|بوم|نقاشی|لایه|برچسب/.test(raw)) return 'painting';
  if (/امن|خطر|کمک|اعتماد|حفاظت/.test(raw)) return 'safety';
  if (/پول|بدهی|معامله|قیمت/.test(raw)) return 'money';
  return 'general';
}

function classifyRoute(context: SituationTurnContext): SituationRouteId | undefined {
  const raw = context.rawInput;
  const p = context.primitive;
  const foundEvidence = context.acceptedEffects.some(effect =>
    effect.type === 'add_evidence' || effect.type === 'add_proof_domain'
  );

  if (p === 'damage' || /بسوز|آتش|نابود|پاره|بشکن|اسید/.test(raw)) return 'destruction';
  if (p === 'deceive' || p === 'hide' || /بدل|طعمه|دام|صحنه.?سازی|جعل|گمراه|قاب بگیر|پاپوش/.test(raw)) return 'misdirection';
  if (p === 'follow' || /تعقیب|دنبال|کمین|خودرو|ماشین|کوچه/.test(raw)) return 'pursuit';
  if (p === 'protect' || p === 'block' || p === 'lock' || /محافظت|امن|مهر و موم|نگهبان|قفل|ورودی|کنار.*در.*می‌?(?:ایستم|مانم)|راه.*خروج.*زیر.*نظر/.test(raw)) return 'fortification';
  if (p === 'reveal' || p === 'record' || /منتشر|افشا|خبرنگار|پلیس|آپلود|ارسال.*نسخه|لایو/.test(raw)) return 'public_exposure';
  if (['ask', 'persuade', 'give'].includes(p) || /همکاری|اعتماد|آرام|قول|همدست|با هم/.test(raw)) return 'social_alliance';
  if (/بکاپ|پشتیبان|میرور|mirror|زمان.?مهر|کپی.*(?:لاگ|فایل|داده)/.test(raw)) return 'forensic_chain';
  if (foundEvidence || ['inspect', 'smell', 'listen', 'use', 'take'].includes(p)) return 'forensic_chain';
  return undefined;
}

function currentNpcId(context: SituationTurnContext): string | undefined {
  const direct = [context.target, context.secondaryTarget].find(id => id && NPC_NAMES_FA[id]);
  if (direct) return direct;
  const raw = context.rawInput;
  if (/سالار|صالحی/.test(raw)) return 'salar';
  if (/(?:^|\s)مانی(?:$|\s|،|!|\.)/.test(raw)) return 'mani';
  if (/یاشین/.test(raw)) return 'yashin';
  if (/حانیه/.test(raw)) return 'haniyeh';
  if (/کلکسیونر|خریدار/.test(raw)) return 'collector';
  return undefined;
}

function buildFingerprint(context: SituationTurnContext): string {
  const npcId = currentNpcId(context);
  if (npcId && ['ask', 'persuade', 'threaten', 'accuse', 'deceive'].includes(context.primitive)) {
    return `${context.primitive}:${npcId}:${classifyTopic(context.rawInput)}`;
  }
  return `${context.primitive}:${context.target ?? classifyTopic(context.rawInput)}`;
}

function repeatNpcNarrative(
  npcId: string,
  repeatCount: number,
  state: RunState,
): string {
  const situation = state.situation!;
  const intention = situation.npcIntentions[npcId];
  if (intention) {
    intention.stage += 1;
    intention.lastActedPulse = situation.pulse;
  }

  if (repeatCount >= 2) {
    switch (npcId) {
      case 'haniyeh':
        return 'حانیه این بار جواب قبلی را تکرار نمی‌کند. تبلت را قفل می‌کند و یک قدم عقب می‌رود: «یا بهم بگو با این جزئیات چه نقشه‌ای داری، یا بذار خودم پنتی رو بردارم و از اینجا برم.» حالا ادامهٔ همکاری او به رفتارت بستگی دارد، نه سؤال بعدی.';
      case 'salar':
        return 'سالار زونکن را می‌بندد و کف دستش را روی آن نگه می‌دارد: «بازجویی یک‌طرفه تموم شد. تو یک چیز واقعی از نقشه‌ات به من بگو، من هم چیزی می‌گم که توی اسناد نیست.» او معاملهٔ اطلاعات پیشنهاد داده و حاضر نیست همان پاسخ را دوباره بدهد.';
      case 'mani':
        return 'مانی دست از کار می‌کشد و بین تو و یاشین می‌ایستد: «جواب همون بود. اگر فکر می‌کنی من دروغ می‌گم، آزمایش یا شاهدت رو رو کن؛ وگرنه برادرم رو از این بازی بیرون بذار.» گفت‌وگو به یک چالش عملی تبدیل شده است.';
      case 'yashin':
        return 'یاشین رسیدها را از جلویت جمع می‌کند: «حافظهٔ من با تکرار سؤال دقیق‌تر نمی‌شه. لاگ رو با من تطبیق بده یا صریح بگو دنبال تناقض کجایی.» او به‌جای پاسخ تازه، تو را وارد یک همکاری مشروط می‌کند.';
      case 'collector':
        return 'نمایندهٔ خریدار سکوت طولانی می‌کند و بعد آرام می‌گوید: «سؤال سوم دیگر سؤال نیست؛ اعلام موضع است. قیمت، تهدید یا حقیقت—یکی را انتخاب کنید و بهایش را هم بپذیرید.» پنجرهٔ گفت‌وگوی بی‌هزینه بسته شده است.';
      default:
        break;
    }
  }

  switch (npcId) {
    case 'haniyeh':
      return 'حانیه مکث می‌کند؛ همان جمله را از نو نمی‌گوید. به صفحهٔ تبلت نگاه می‌کند و می‌پرسد: «این جزئیات قراره به نجات کسی کمک کنه یا فقط می‌خوای مطمئن شی حرفم عوض نمی‌شه؟» او حالا منتظر است نیتت را روشن کنی.';
    case 'salar':
      return 'سالار به‌جای تکرار پاسخ، فاکتور را نیمه‌کاره زیر دستش می‌پوشاند: «تو داری دور یک سؤال می‌چرخی. بگو به چه کسی شک داری تا بفهمم چقدر می‌تونم بهت اعتماد کنم.» دفاع او به یک درخواست متقابل تبدیل می‌شود.';
    case 'mani':
      return 'مانی ابرو بالا می‌اندازد: «همون چیزی که دیدم گفتم. اگر دنبال جواب تازه‌ای، سؤال تازه یا یک تست واقعی بیار.» نگاهش برای لحظه‌ای به نازل بخار می‌لغزد؛ او ترجیح می‌دهد عمل را ببیند.';
    case 'yashin':
      return 'یاشین این بار پاسخ حفظ‌شده نمی‌دهد. ساعت دستگاه و ساعت مچی‌اش را کنار هم می‌گذارد: «اگر زمان مهمه، با هم اندازه بگیریم؛ حدس من مدرک نیست.» او راه همکاری را باز کرده، اما نتیجه را مجانی تحویل نمی‌دهد.';
    case 'collector':
      return 'نمایندهٔ خریدار جواب قبلی را تکرار نمی‌کند: «هر بار که یک سؤال را دوباره می‌پرسید، ارزش اطلاعات خودتان را پایین می‌آورید. چه چیزی برای معامله دارید؟» گفت‌وگو از پرسش‌وپاسخ به چانه‌زنی تغییر می‌کند.';
    default:
      return `${NPC_NAMES_FA[npcId] ?? 'طرف مقابل'} پاسخ قبلی را تکرار نمی‌کند و از تو می‌خواهد نیت یا مدرکت را روشن کنی.`;
  }
}

function collectLeverage(
  state: RunState,
  context: SituationTurnContext,
  route: SituationRouteId | undefined,
): string[] {
  const situation = state.situation!;
  const added: string[] = [];
  if (!context.actionSucceeded) return added;
  const raw = context.rawInput;
  const role = state.canonical.playerClass ?? 'observer';

  const secureEvidence =
    context.acceptedEffects.some(effect => effect.type === 'add_inventory') ||
    (route === 'fortification' && /مدرک|فنجان|رسید|سند|تابلو|بوم/.test(raw)) ||
    (route === 'misdirection' && context.primitive === 'hide');
  if (secureEvidence && addUnique(situation.leverage, 'secured_physical_evidence')) {
    added.push('secured_physical_evidence');
  }

  const hasArtAccess = [
    'fact_painting_surface_anomaly',
    'fact_underpainting_hidden_layer',
    'fact_label_numbers_14_3_7_55',
    'fact_label_transfer_trace',
  ].some(id => state.canonical.evidenceIds.includes(id));
  if (
    role === 'art_historian' &&
    hasArtAccess &&
    /بدل|کپی|نسخه.*جعلی|شجره.*ساخت|طعمه|قاب.*اشتباه/.test(raw) &&
    addUnique(situation.leverage, ROLE_LEVERAGE_DEFINITIONS.art_historian.id)
  ) {
    added.push(ROLE_LEVERAGE_DEFINITIONS.art_historian.id);
  }

  if (
    role === 'coffee_alchemist' &&
    state.canonical.evidenceIds.includes('fact_solvent_smell_cup') &&
    /رد|مسیر|منشأ|دنبال.*بو|حلال|آلودگی/.test(raw) &&
    addUnique(situation.leverage, ROLE_LEVERAGE_DEFINITIONS.coffee_alchemist.id)
  ) {
    added.push(ROLE_LEVERAGE_DEFINITIONS.coffee_alchemist.id);
  }

  const hasSystemAccess = [
    'fact_pos_order_timestamp',
    'fact_pos_receipt_time_gap',
    'fact_camera_time_gap',
    'fact_footage_was_never_written',
  ].some(id => state.canonical.evidenceIds.includes(id));
  if (
    role === 'systems_analyst' &&
    hasSystemAccess &&
    /بکاپ|پشتیبان|کپی|میرور|mirror|خارج.*سیستم|زمان.?مهر|ارسال.*لاگ/.test(raw) &&
    /لاگ|دوربین|پوز|فایل|داده|سیستم/.test(raw) &&
    addUnique(situation.leverage, ROLE_LEVERAGE_DEFINITIONS.systems_analyst.id)
  ) {
    added.push(ROLE_LEVERAGE_DEFINITIONS.systems_analyst.id);
  }

  const npcId = currentNpcId(context);
  const attemptsAlliance = /اعتماد|همکاری|محافظت|قول|همدست|کنارم|با\s+من|شاهد|(?:کمک|پشتیبانی).*(?:کن|می‌?کنی|می‌?کنی)|نسخه.*(?:نگه|حفظ)/.test(raw);
  if (
    role === 'investigator' &&
    npcId &&
    route === 'social_alliance' &&
    attemptsAlliance &&
    ((state.npcTrust?.[npcId] ?? 0) >= 1 || context.primitive === 'persuade') &&
    addUnique(situation.leverage, ROLE_LEVERAGE_DEFINITIONS.investigator.id)
  ) {
    added.push(ROLE_LEVERAGE_DEFINITIONS.investigator.id);
  }

  const alliedNpcCount = ['salar', 'haniyeh', 'mani', 'yashin']
    .filter(id => (state.npcTrust?.[id] ?? 0) >= 1).length;
  if (alliedNpcCount >= 2 && addUnique(situation.leverage, 'staff_coalition')) {
    added.push('staff_coalition');
  }

  return added;
}

function applyPlayerPressureResponse(
  state: RunState,
  route: SituationRouteId | undefined,
): void {
  if (!route) return;
  const situation = state.situation!;
  const fronts = situation.fronts;

  if (route === 'fortification' && situation.leverage.includes('secured_physical_evidence')) {
    fronts.redactor_cleanup.progress = clampFront(fronts.redactor_cleanup.progress - 1);
  }
  if (route === 'social_alliance' && situation.leverage.includes('staff_coalition')) {
    fronts.cafe_fracture.progress = clampFront(fronts.cafe_fracture.progress - 1);
  }
  if (route === 'public_exposure') {
    fronts.redactor_cleanup.progress = clampFront(fronts.redactor_cleanup.progress - 1);
    fronts.custodian_extraction.progress = clampFront(fronts.custodian_extraction.progress + 1);
  }
  if (route === 'misdirection') {
    fronts.custodian_extraction.progress = clampFront(fronts.custodian_extraction.progress - 1);
    if (!situation.leverage.includes('staff_coalition')) {
      fronts.cafe_fracture.progress = clampFront(fronts.cafe_fracture.progress + 1);
    }
  }
  if (route === 'destruction') {
    if (
      state.canonical.canonicalFlags.includes('attempted_harm_to_penti') ||
      state.canonical.canonicalFlags.includes('assaulted_staff')
    ) {
      fronts.cafe_fracture.progress = clampFront(fronts.cafe_fracture.progress + 3);
    } else {
      fronts.custodian_extraction.progress = clampFront(fronts.custodian_extraction.progress - 1);
      fronts.redactor_cleanup.progress = clampFront(fronts.redactor_cleanup.progress + 2);
    }
  }
}

function applyStrategicCommitment(
  state: RunState,
  context: SituationTurnContext,
  route: SituationRouteId | undefined,
): { eventId: string; prose: string } | undefined {
  if (!context.actionSucceeded) return undefined;
  const raw = context.rawInput;
  const collectorContext = currentNpcId(context) === 'collector' || state.canonical.currentScene === 'scene_collector_meeting';

  if (
    collectorContext &&
    /(?:پیشنهاد|پول|معامله|قرارداد).*(?:قبول|می‌?پذیر|موافق)|(?:تابلو|بوم).*(?:می‌?فروش|واگذار)/.test(raw)
  ) {
    addCanonicalFlag(state, 'accepted_financial_offer');
    return {
      eventId: 'player_commits_to_collector_deal',
      prose: 'قبول معامله را مبهم نمی‌گذاری. نماینده زمان انتقال را ثبت می‌کند و سالار برای اولین بار نفس راحتی می‌کشد؛ این تصمیم کافه را از بدهی نجات می‌دهد و اختیار تابلو را از جمع می‌گیرد. بعداً نمی‌توانی آن را صرفاً «بلوف» بنامی.',
    };
  }

  if (
    collectorContext &&
    /(?:پیشنهاد|پول|معامله|قرارداد).*(?:رد|قبول\s*نمی|نمی‌?پذیر)|(?:تابلو|بوم).*(?:نمی‌?فروش|واگذار\s*نمی)/.test(raw)
  ) {
    addCanonicalFlag(state, 'rejected_financial_offer');
    return {
      eventId: 'player_rejects_collector_deal',
      prose: 'پیشنهاد را صریح رد می‌کنی. عدد روی میز می‌ماند و لبخند نماینده محو می‌شود؛ از این لحظه کافه بدهی‌اش را نگه می‌دارد و شبکه هم می‌فهمد با خریدن سکوتت پیش نمی‌رود.',
    };
  }

  if (/جان|آدم|پرسنل|حانیه|مانی|یاشین|پنتی/.test(raw) && /اولویت|مهم‌تر|محافظت|نجات|امن/.test(raw)) {
    addCanonicalFlag(state, 'protected_group');
  }

  if (
    route === 'destruction' &&
    /تابلو|بوم|لایه.*زیر|نقاشی/.test(raw)
  ) {
    addCanonicalFlag(state, 'sacrificed_painting_to_deny_factions');
    addCanonicalFlag(state, 'attempted_damage_to_art');
    return {
      eventId: 'player_sacrifices_painting',
      prose: 'تصمیمت صرفاً تخریب از سر خشم نیست: اثر را از دسترس هر سه جناح خارج می‌کنی. شبکه چیزی برای تصاحب ندارد، اما شاهد تاریخی هم دیگر کامل نخواهد بود. آدم‌ها ممکن است نجات پیدا کنند؛ حقیقت این بها را فراموش نمی‌کند.',
    };
  }

  if (
    route === 'misdirection' &&
    /(?:لایه|تابلو|سند|حقیقت|راز).*(?:پنهان|مخفی|دفن|نگه)|(?:پنهان|مخفی).*(?:لایه|تابلو|سند|حقیقت|راز)/.test(raw)
  ) {
    addCanonicalFlag(state, 'chose_preserver_concealment');
    return {
      eventId: 'player_commits_to_preserver_concealment',
      prose: 'حقیقت را پاک نمی‌کنی؛ برایش یک لایهٔ محافظ و محل امن می‌سازی و کلید دسترسی را از بازار و هیاهوی عمومی دور نگه می‌داری. این انتخاب ممکن است حقیقت را زنده نگه دارد، و ممکن است تو را به متولی بعدی همان راز بدل کند.',
    };
  }

  return undefined;
}

function routeCanAddressCrisis(route: SituationRouteId | undefined, crisisId: SituationCrisisId): boolean {
  if (!route) return false;
  switch (crisisId) {
    case 'painting_extraction':
      return ['fortification', 'misdirection', 'social_alliance', 'pursuit', 'public_exposure', 'destruction'].includes(route);
    case 'blackout_cleanup':
      return ['forensic_chain', 'fortification', 'pursuit', 'public_exposure', 'misdirection'].includes(route);
    case 'staff_walkout':
      return ['social_alliance', 'forensic_chain', 'misdirection'].includes(route);
  }
}

function crisisStrength(
  state: RunState,
  route: SituationRouteId,
  crisis: SituationCrisisState,
): number {
  const situation = state.situation!;
  let strength = 1;
  if (situation.leverage.includes('secured_physical_evidence') && crisis.id !== 'staff_walkout') strength += 1;
  if (situation.leverage.includes('staff_coalition') && crisis.id !== 'blackout_cleanup') strength += 1;

  const roleLeverage = ROLE_LEVERAGE_DEFINITIONS[state.canonical.playerClass ?? 'observer'].id;
  if (situation.leverage.includes(roleLeverage)) {
    if (
      (crisis.id === 'painting_extraction' && ['credible_provenance_decoy', 'turn_witness_into_ally'].includes(roleLeverage)) ||
      (crisis.id === 'blackout_cleanup' && ['trace_cleanup_solvent', 'independent_log_mirror'].includes(roleLeverage)) ||
      (crisis.id === 'staff_walkout' && roleLeverage === 'turn_witness_into_ally')
    ) strength += 1;
  }
  return strength;
}

function resolveOpenCrisis(
  state: RunState,
  route: SituationRouteId | undefined,
): { eventId: string; prose: string } | undefined {
  if (!route) return undefined;
  const situation = state.situation!;
  const crisis = situation.openCrises.find(item => item.status === 'open' && routeCanAddressCrisis(route, item.id));
  if (!crisis) return undefined;

  if (
    crisis.id === 'painting_extraction' &&
    state.canonical.canonicalFlags.includes('accepted_financial_offer')
  ) {
    crisis.status = 'resolved';
    crisis.resolutionRoute = 'social_alliance';
    situation.fronts[crisis.frontId].contained = true;
    addUnique(situation.irreversibleConsequences, 'painting_transferred_by_player_choice');
    if (state.worldObjects?.central_painting) state.worldObjects.central_painting.state.location = 'collector_custody';
    return {
      eventId: 'painting_extraction_becomes_agreed_transfer',
      prose: 'سه ضربه پشت شیشه دیگر حمله نیست؛ تحویلی است که خودت پذیرفته‌ای. محفظه وارد می‌شود، تابلو از دیوار پایین می‌آید و در برابر تسویهٔ بدهی‌ها مهر انتقال می‌خورد. بحران را حل کردی—با تغییر دادن برندهٔ آن.',
    };
  }

  const strength = crisisStrength(state, route, crisis);
  crisis.status = strength >= 2 ? 'resolved' : 'costly_success';
  crisis.resolutionRoute = route;
  situation.fronts[crisis.frontId].contained = true;
  situation.fronts[crisis.frontId].progress = strength >= 2 ? 2 : 4;

  const eventId = `${crisis.id}_${crisis.status}_${route}`;
  if (crisis.status === 'costly_success') {
    addUnique(situation.irreversibleConsequences, `${crisis.id}_price_${route}`);
  }

  switch (crisis.id) {
    case 'painting_extraction':
      addCanonicalFlag(state, 'situation_extraction_interrupted');
      if (crisis.status === 'resolved') {
        return {
          eventId,
          prose: route === 'misdirection'
            ? 'نقشه‌ات جواب می‌دهد: مرد پشت در نشانی را که عمداً در معرض دید گذاشته‌ای می‌بیند و مکثش لو می‌دهد طعمه را باور کرده. صدای قدم‌ها از در دور می‌شود؛ فعلاً آن‌ها به‌دنبال نسخهٔ اشتباه رفته‌اند، اما دروغ تو بعدها صاحب خواهد داشت.'
            : 'پیش از آن‌که دستگیره پایین برود، آدم‌های داخل کافه مطابق حرکتت موضع می‌گیرند. آن سوی شیشه، سایه دستش را پس می‌کشد. تلاش برای بردن تابلو متوقف شده؛ این بار جهان به نقشهٔ تو واکنش نشان داده، نه به تعداد سرنخ‌هایت.',
        };
      }
      return {
        eventId,
        prose: 'حرکتت انتقال را متوقف می‌کند، اما بی‌هزینه نیست: مهاجم عقب می‌کشد و هم‌زمان عکس پلاک و چهره‌ات را برای کسی می‌فرستد. تابلو می‌ماند؛ هویت تو دیگر بیرون از کافه ناشناس نیست.',
      };

    case 'blackout_cleanup':
      addCanonicalFlag(state, 'situation_cleanup_interrupted');
      if (crisis.status === 'resolved') {
        addEvidence(state, 'fact_cleanup_route_interrupted');
        return {
          eventId,
          prose: 'در تاریکی دنبال خودِ مدرک نمی‌روی؛ مسیر پاک‌کننده را می‌بندی. صدای برخورد کوتاهی از راهروی دفتر می‌آید و بعد چراغ اضطراری روشن می‌شود. کسی گریخته، اما رد حلال روی دستگیره و مسیر قدم‌های خیس حالا یک شاهد تازه ساخته است.',
        };
      }
      addEvidence(state, 'fact_cleanup_residue');
      return {
        eventId,
        prose: 'جلوی پاک‌سازی کامل را می‌گیری، اما بخشی از سند زیر ماده‌ای شفاف کدر می‌شود. متن ناقص شده؛ در عوض بوی حلال و جهت لکه، مسیر فرار عامل را لو می‌دهد. یک مدرک ضعیف‌تر شده و یک راه تعقیب تازه به وجود آمده است.',
      };

    case 'staff_walkout':
      if (crisis.status === 'resolved') {
        addCanonicalFlag(state, 'situation_staff_chose_to_stay');
        return {
          eventId,
          prose: 'به‌جای درخواست یک جواب دیگر، سهم خودت از نقشه و خطر را روی میز می‌گذاری. حانیه بند کیف را از شانه‌اش پایین می‌آورد؛ مانی هم از جلوی در کنار می‌رود. آن‌ها نمانده‌اند چون بازی منتظرشان است—مانده‌اند چون این بار تو چیزی برای اعتماد کردن ساخته‌ای.',
        };
      }
      addUnique(situation.irreversibleConsequences, 'staff_stays_but_salar_loses_authority');
      return {
        eventId,
        prose: 'جمع را از فروپاشی نجات می‌دهی، اما بهایش روشن است: حانیه فقط به شرطی می‌ماند که نسخه‌ای از هر مدرک نزد او باشد و سالار دیگر تصمیم‌گیر نهایی نباشد. اتحاد حفظ می‌شود، کنترل کافه نه.',
      };
  }
}

function missCrisis(state: RunState, crisis: SituationCrisisState): { eventId: string; prose: string } {
  const situation = state.situation!;
  crisis.status = 'missed';
  situation.fronts[crisis.frontId].contained = true;
  addUnique(situation.irreversibleConsequences, `${crisis.id}_missed`);

  switch (crisis.id) {
    case 'painting_extraction': {
      addCanonicalFlag(state, 'painting_taken_to_waiting_van');
      if (state.worldObjects?.central_painting) {
        state.worldObjects.central_painting.state.location = 'scene_hosseini_alley';
      }
      const collector = situation.npcIntentions.collector;
      collector.stage = 3;
      collector.location = 'scene_hosseini_alley';
      addUnique(situation.routeMarks, 'pursuit');
      return {
        eventId: 'painting_extraction_missed',
        prose: 'دو ضربهٔ کوتاه کافی بوده است. وقتی دوباره به دیوار گالری نگاه می‌کنی، قاب خالی آرام تاب می‌خورد و رد چرخ‌های باریک تا کوچه می‌رود. پرونده تمام نشده: تابلو حالا داخل خودرویی در حال حرکت است و معما از «اثبات» به «بازپس‌گیری یا معامله» تغییر کرده است.',
      };
    }
    case 'blackout_cleanup':
      addCanonicalFlag(state, 'office_records_partly_contaminated');
      addEvidence(state, 'fact_cleanup_residue');
      if (state.worldObjects?.office_ledger) {
        state.worldObjects.office_ledger.state.customAttributes = {
          ...(state.worldObjects.office_ledger.state.customAttributes ?? {}),
          partlyContaminated: true,
        };
      }
      return {
        eventId: 'blackout_cleanup_missed',
        prose: 'وقتی برق برمی‌گردد، چند سطر فاکتور به لکه‌ای بی‌رنگ تبدیل شده‌اند. پاک‌کننده بخشی از زنجیره را برده، اما عجله‌اش رسوبی روغنی و یک تار نخ قرمز روی کاور جا گذاشته است. مسیر اسناد سخت‌تر شد؛ مسیر شیمیایی و تعقیب بازتر.',
      };
    case 'staff_walkout': {
      addCanonicalFlag(state, 'haniyeh_left_with_photo');
      const haniyeh = situation.npcIntentions.haniyeh;
      haniyeh.stage = 3;
      haniyeh.location = 'scene_entrance';
      haniyeh.status = 'changed';
      state.scene.activeEntityIds = state.scene.activeEntityIds.filter(id => id !== 'haniyeh');
      return {
        eventId: 'staff_walkout_missed',
        prose: 'حانیه پنتی را بغل می‌کند و بدون دعوا از کافه بیرون می‌رود؛ نسخهٔ اصلی عکس هم با اوست. شاهد از بین نرفته، اما دیگر در اختیار سالار یا تو نیست. برای برگرداندنش باید دنبالش بروی، اعتماد بسازی یا حقیقت را بدون او ثابت کنی.',
      };
    }
  }
}

function resolveAftermathOpportunity(
  state: RunState,
  context: SituationTurnContext,
  route: SituationRouteId | undefined,
): { eventId: string; prose: string } | undefined {
  if (!route || !context.actionSucceeded) return undefined;
  const situation = state.situation!;
  const flags = state.canonical.canonicalFlags;

  if (flags.includes('painting_taken_to_waiting_van') && !flags.includes('painting_aftermath_resolved')) {
    if (route === 'pursuit' && !flags.includes('painting_recovery_pursuit_started')) {
      addCanonicalFlag(state, 'painting_recovery_pursuit_started');
      return {
        eventId: 'painting_recovery_pursuit_started',
        prose: 'رد چرخ‌ها را تا پیچ پایین کوچه می‌گیری. ون هنوز دور نشده؛ پشت چراغ چشمک‌زن تقاطع گیر کرده و قاب در محفظه‌ای نیمه‌باز دیده می‌شود. حالا صرفاً دنبالشان نیستی—برای متوقف کردن، فریب دادن یا علنی کردن انتقال یک فرصت واقعی داری.',
      };
    }

    const canResolveRecovery =
      flags.includes('painting_recovery_pursuit_started') &&
      ['pursuit', 'misdirection', 'fortification', 'public_exposure', 'social_alliance'].includes(route);
    if (canResolveRecovery) {
      addCanonicalFlag(state, 'painting_aftermath_resolved');
      const strongRecovery =
        situation.leverage.includes('staff_coalition') ||
        situation.leverage.includes('credible_provenance_decoy') ||
        situation.leverage.includes('trace_cleanup_solvent') ||
        situation.leverage.includes('independent_log_mirror');

      if (route === 'public_exposure') {
        addCanonicalFlag(state, 'painting_in_public_custody');
        addUnique(situation.irreversibleConsequences, 'painting_recovered_but_publicly_seized');
        if (state.worldObjects?.central_painting) state.worldObjects.central_painting.state.location = 'public_custody';
        return {
          eventId: 'painting_recovered_into_public_custody',
          prose: 'انتقال را با تصویر زنده و پلاک خودرو علنی می‌کنی. راننده تابلو را کنار خیابان رها می‌کند، اما حالا اثر مستقیماً به حافظت رسمی می‌رود. شبکه آن را نبرد؛ کافه هم دیگر اختیار کاملش را ندارد.',
        };
      }

      addCanonicalFlag(state, strongRecovery ? 'painting_recovered_cleanly' : 'painting_recovered_with_damage');
      if (!strongRecovery) addUnique(situation.irreversibleConsequences, 'painting_edge_damaged_during_recovery');
      if (state.worldObjects?.central_painting) state.worldObjects.central_painting.state.location = 'scene_gallery';
      return {
        eventId: strongRecovery ? 'painting_recovered_cleanly' : 'painting_recovered_with_cost',
        prose: strongRecovery
          ? 'نقشهٔ دوم را روی حرکت ون سوار می‌کنی. راننده به چیزی که برایش آماده کرده بودی واکنش نشان می‌دهد و همان مکث کوتاه برای پس گرفتن محفظه کافی است. تابلو به کافه برمی‌گردد؛ نه چون شکست هرگز رخ نداد، چون از شکست مسیر تازه ساختی.'
          : 'در تقاطع به محفظه می‌رسی و تابلو را پس می‌گیری، اما گوشهٔ قاب در کشمکش ترک می‌خورد و مرد دستکش‌قرمز چهره‌ات را به خاطر می‌سپارد. حقیقت نجات پیدا کرده؛ امنیت و سلامت کامل اثر نه.',
      };
    }
  }

  if (
    flags.includes('office_records_partly_contaminated') &&
    !flags.includes('contaminated_records_reconstructed') &&
    route === 'forensic_chain' &&
    /بازساز|بازیاب|رسوب|حلال|نور|اسکن|مقایسه|لکه|اثر/.test(context.rawInput)
  ) {
    addCanonicalFlag(state, 'contaminated_records_reconstructed');
    addEvidence(state, 'fact_reconstructed_transfer_fragment');
    const specialist =
      situation.leverage.includes('trace_cleanup_solvent') ||
      situation.leverage.includes('independent_log_mirror');
    if (!specialist) addUnique(situation.irreversibleConsequences, 'reconstruction_remains_contestable');
    return {
      eventId: specialist ? 'cleanup_aftermath_reconstructed' : 'cleanup_aftermath_partial_reconstruction',
      prose: specialist
        ? 'نسخهٔ سالم بیرونی و الگوی رسوب را روی هم می‌اندازی. جملهٔ پاک‌شده کامل برنمی‌گردد، اما زمان، مقصد و امضای واسطه از دو منبع مستقل بازسازی می‌شود. دشمن یک سند را زخمی کرد و ناخواسته منشأ دستکاری را هم ثبت کرد.'
        : 'با نور و مقایسهٔ فشار قلم، بخشی از نوشتهٔ محوشده را بازسازی می‌کنی. نتیجه برای ادامهٔ مسیر کافی است، ولی در یک دادگاه یا معامله هنوز قابل مناقشه خواهد بود.',
    };
  }

  if (
    flags.includes('haniyeh_left_with_photo') &&
    !flags.includes('haniyeh_aftermath_resolved') &&
    route === 'social_alliance' &&
    currentNpcId(context) === 'haniyeh' &&
    state.canonical.currentScene === 'scene_entrance'
  ) {
    addCanonicalFlag(state, 'haniyeh_aftermath_resolved');
    const haniyeh = situation.npcIntentions.haniyeh;
    haniyeh.status = 'completed';
    addEvidence(state, 'fact_haniyeh_independent_backup');
    if ((state.npcTrust?.haniyeh ?? 0) >= 1 || /نقشه|حقیقت|خطر|قول|اعتماد/.test(context.rawInput)) {
      haniyeh.location = 'scene_table5';
      addCanonicalFlag(state, 'haniyeh_returns_as_independent_ally');
      return {
        eventId: 'haniyeh_returns_as_independent_ally',
        prose: 'در باران همهٔ حقیقتی را که می‌دانی و همهٔ بخشی را که هنوز نمی‌دانی می‌گویی. حانیه برنمی‌گردد تا مطیع سالار باشد؛ برمی‌گردد چون نسخهٔ مستقل عکس دست خودش می‌ماند و از این لحظه یک همدست صاحب‌اختیار است.',
      };
    }
    return {
      eventId: 'haniyeh_stays_safe_but_shares_backup',
      prose: 'حانیه به داخل برنمی‌گردد، اما یک نسخهٔ رمزدار از عکس را برایت می‌فرستد. شاهد را کنترل نکرده‌ای؛ رضایتش را برای یک همکاری محدود به دست آورده‌ای.',
    };
  }

  return undefined;
}

function advanceFront(state: RunState): { eventId: string; prose: string } | undefined {
  const situation = state.situation!;
  if (situation.pulse < 3 || (situation.pulse - 3) % 2 !== 0) return undefined;

  const sequence = FRONT_SEQUENCE[situation.pressurePattern];
  const startIndex = Math.floor((situation.pulse - 3) / 2) % sequence.length;
  let frontId: SituationFrontId | undefined;
  for (let offset = 0; offset < sequence.length; offset += 1) {
    const candidate = sequence[(startIndex + offset) % sequence.length];
    if (!situation.fronts[candidate].contained) {
      frontId = candidate;
      break;
    }
  }
  if (!frontId) return undefined;

  const front = situation.fronts[frontId];
  front.progress = clampFront(front.progress + 2);
  front.lastAdvancedPulse = situation.pulse;

  if (front.progress >= 6) {
    const crisisId = CRISIS_FOR_FRONT[frontId];
    const existing = situation.openCrises.find(item => item.id === crisisId && item.status === 'open');
    if (!existing) {
      situation.openCrises.push({
        id: crisisId,
        frontId,
        openedAtPulse: situation.pulse,
        deadlinePulse: situation.pulse + 2,
        status: 'open',
      });
    }
    switch (crisisId) {
      case 'painting_extraction':
        return {
          eventId: 'crisis_painting_extraction_opened',
          prose: 'سه ضربهٔ آهسته و منظم به شیشه می‌خورد. مردی پشت در ایستاده، اما نگاهش به تو نیست—فاصلهٔ در تا تابلو را اندازه می‌گیرد. هم‌زمان گوشی سالار روشن می‌شود: «تحویل همین حالا.» دست مرد هنوز روی دستگیره نرفته؛ چند لحظه برای تغییر صحنه داری.',
        };
      case 'blackout_cleanup':
        return {
          eventId: 'crisis_blackout_cleanup_opened',
          prose: 'تمام چراغ‌ها با هم خاموش می‌شوند؛ نه مثل زدن یک کلید، مثل قطع شدن یک مدار مشخص. در تاریکی، صدای باز شدن آرام درِ دفتر و بوی کوتاه حلال از راهرو می‌آید. کسی برای حمله به آدم‌ها نیامده—برای عوض کردن چیزی در اسناد آمده است.',
        };
      case 'staff_walkout':
        return {
          eventId: 'crisis_staff_walkout_opened',
          prose: 'حانیه تبلت را داخل کیف می‌گذارد و پنتی را صدا می‌زند. مانی بی‌آن‌که به تو نگاه کند راه خروج را باز می‌کند: «تا وقتی سالار نصف حقیقت رو می‌گه و از ما انتظار اعتماد داره، کسی اینجا امن نیست.» این یک بحث تزئینی نیست؛ جمع در آستانهٔ شکستن است.',
        };
    }
  }

  if (frontId === 'custodian_extraction') {
    const collector = situation.npcIntentions.collector;
    const deadlineSeen = situation.eventHistory.some(event => event.eventId === 'custodian_deadline_call');
    const arrivalSeen = situation.eventHistory.some(event => event.eventId === 'custodian_arrival_signal');
    if (front.progress >= 2 && !deadlineSeen) {
      collector.stage += 1;
      collector.lastActedPulse = situation.pulse;
      const salar = situation.npcIntentions.salar;
      salar.stage += 1;
      salar.lastActedPulse = situation.pulse;
      addCanonicalFlag(state, 'collector_deadline_received');
      return {
        eventId: 'custodian_deadline_call',
        prose: 'گوشی سالار روی میز می‌لرزد. او تماس را رد می‌کند، اما پیش‌نمایش پیام یک لحظه دیده می‌شود: «دوازده دقیقه. بعدش بندِ بازگشت فعال می‌شود.» سالار فوراً صفحه را برمی‌گرداند؛ بیرون از کافه کسی منتظر حل معما نیست.',
      };
    }
    if (front.progress >= 4 && !arrivalSeen) {
      collector.stage += 1;
      collector.lastActedPulse = situation.pulse;
      addCanonicalFlag(state, 'collector_contact_open');
      collector.location = 'nearby';
      return {
        eventId: 'custodian_arrival_signal',
        prose: 'خودروی خاموش کنار کوچه چند متر جلو می‌آید. تماس این بار روی بلندگوی گوشی سالار می‌افتد و صدایی شمرده می‌گوید: «اگر مدرکی دارید، معامله می‌کنیم؛ اگر ندارید، مالکیت از قبل تعیین شده.» راه گفت‌وگو باز شده، اما دیگر پشت یک درِ قفل‌شدهٔ چهارسرنخی نیست.',
      };
    }
    return undefined;
  }

  if (frontId === 'redactor_cleanup') {
    const courier = situation.npcIntentions.red_glove_courier;
    const probeSeen = situation.eventHistory.some(event => event.eventId === 'redactor_remote_probe');
    const doorSeen = situation.eventHistory.some(event => event.eventId === 'redactor_at_the_door');
    if (front.progress >= 2 && !probeSeen) {
      courier.stage += 1;
      courier.lastActedPulse = situation.pulse;
      return {
        eventId: 'redactor_remote_probe',
        prose: 'تصویر یکی از دوربین‌ها برای نیم‌ثانیه برفکی می‌شود. هم‌زمان تبلت حانیه پیام «همگام‌سازی ناموفق» می‌دهد، با اینکه وای‌فای قطع نشده. کسی در حال آزمودن این است که کدام نسخه از امشب هنوز قابل پاک کردن است.',
      };
    }
    if (front.progress >= 4 && !doorSeen) {
      courier.stage += 1;
      courier.lastActedPulse = situation.pulse;
      courier.location = 'scene_entrance';
      return {
        eventId: 'redactor_at_the_door',
        prose: 'از سمت ورودی بوی خیلی کم همان حلال فنجان می‌آید. روی شیشه، جای یک کف دست تازه شکل می‌گیرد و محو می‌شود؛ کسی بیرون، مسیر در تا دفتر را بررسی کرده و هنوز وارد نشده است.',
      };
    }
    return undefined;
  }

  const haniyeh = situation.npcIntentions.haniyeh;
  const fractureSeen = situation.eventHistory.some(event => event.eventId === 'cafe_first_fracture');
  const salarSeen = situation.eventHistory.some(event => event.eventId === 'cafe_hanieh_hears_salar');
  if (front.progress >= 2 && !fractureSeen) {
    haniyeh.stage += 1;
    haniyeh.lastActedPulse = situation.pulse;
    for (const npcId of ['mani', 'yashin']) {
      const intention = situation.npcIntentions[npcId];
      intention.stage += 1;
      intention.lastActedPulse = situation.pulse;
    }
    return {
      eventId: 'cafe_first_fracture',
      prose: 'صدای بحث کوتاه یاشین و مانی از پشت بار بالا می‌رود. یاشین می‌گوید ساعت‌ها باید همین حالا ثبت شوند؛ مانی جواب می‌دهد اول باید فهمید چه کسی قرار است تاوانشان را بدهد. آن‌ها سرنخ تولید نمی‌کنند—دارند دربارهٔ وفاداری تصمیم می‌گیرند.',
    };
  }
  if (front.progress >= 4 && !salarSeen) {
    haniyeh.stage += 1;
    haniyeh.lastActedPulse = situation.pulse;
    return {
      eventId: 'cafe_hanieh_hears_salar',
      prose: 'حانیه از جلوی دفتر برمی‌گردد؛ رنگ صورتش عوض شده. شنیده سالار از کسی خواسته «عکس میز پنج فعلاً جایی نرود». او چیزی نمی‌پرسد، فقط کیف تبلت را می‌بندد. اگر توضیحی نگیرد، خودش دربارهٔ امن‌ترین راه تصمیم خواهد گرفت.',
    };
  }
  return undefined;
}

function leverageProse(leverageId: string): string | undefined {
  switch (leverageId) {
    case 'credible_provenance_decoy':
      return 'از چینش برچسب‌ها و زبان بازار می‌فهمی می‌توان یک شجره‌نامهٔ بدلِ باورپذیر ساخت—نه برای گرفتن سرنخ مجانی، برای واداشتن خریدار به حرکت روی طعمه‌ای که تو انتخاب می‌کنی.';
    case 'trace_cleanup_solvent':
      return 'امضای بویایی حلال در ذهنت کامل می‌شود. از این به بعد اگر عامل پاک‌سازی حرکت کند، می‌توانی مسیرش را از آلودگی متقاطع دنبال کنی؛ این یک ابزار تعقیب است، نه پاسخ معما.';
    case 'independent_log_mirror':
      return 'نسخهٔ زمان‌مهرشده بیرون از سامانهٔ کافه ثبت می‌شود. حالا پاک کردن دستگاه محلی حقیقت را از بین نمی‌برد و می‌توانی از این نسخه به‌عنوان اهرم یا طعمه استفاده کنی.';
    case 'turn_witness_into_ally':
      return 'واکنش طرف مقابل فقط یک پاسخ نیست؛ نشانه‌ای است که می‌توانی با آن یک شاهد منفعل را وارد نقشه کنی. اگر اعتماد را خرج کنی، او می‌تواند خارج از میدان دید تو عمل کند.';
    default:
      return undefined;
  }
}

export function advanceEpisodeSituation(
  state: RunState,
  context: SituationTurnContext,
): SituationTurnOutcome {
  const outcome: SituationTurnOutcome = {
    eventIds: [],
    routesAdded: [],
    leverageAdded: [],
  };
  if (!shouldRunSituation(state)) return outcome;
  if (context.consumesWorldTime === false) return outcome;

  if (!state.situation || state.situation.schemaVersion !== '2.7') {
    state.situation = createInitialEpisodeSituation(state.runSeed || 42, state.scene.turn);
  }
  const situation = state.situation;
  situation.pulse += 1;

  const route = classifyRoute(context);
  if (route && addUnique(situation.routeMarks, route)) outcome.routesAdded.push(route);

  outcome.leverageAdded = collectLeverage(state, context, route);
  const commitment = applyStrategicCommitment(state, context, route);
  if (context.actionSucceeded) applyPlayerPressureResponse(state, route);

  const fingerprint = buildFingerprint(context);
  const previousMatches = situation.actionHistory.filter(item => item.fingerprint === fingerprint).length;
  const npcId = currentNpcId(context);
  if (
    context.actionSucceeded &&
    npcId &&
    previousMatches > 0 &&
    ['ask', 'persuade', 'threaten', 'accuse', 'deceive'].includes(context.primitive)
  ) {
    outcome.narrativeOverride = repeatNpcNarrative(npcId, previousMatches, state);
  }

  if (context.actionSucceeded) {
    situation.actionHistory.push({ fingerprint, pulse: situation.pulse });
    if (situation.actionHistory.length > 24) situation.actionHistory.shift();
  }

  const crisisResolution = context.actionSucceeded ? resolveOpenCrisis(state, route) : undefined;
  if (crisisResolution) {
    outcome.eventIds.push(crisisResolution.eventId);
    outcome.narrativeAppend = crisisResolution.prose;
  } else {
    const expired = situation.openCrises.find(
      crisis => crisis.status === 'open' && situation.pulse >= crisis.deadlinePulse
    );
    if (expired) {
      const missed = missCrisis(state, expired);
      outcome.eventIds.push(missed.eventId);
      outcome.narrativeAppend = missed.prose;
    } else {
      const aftermath = resolveAftermathOpportunity(state, context, route);
      if (aftermath) {
        outcome.eventIds.push(aftermath.eventId);
        outcome.narrativeAppend = aftermath.prose;
      } else {
        if (commitment) {
          outcome.eventIds.push(commitment.eventId);
          outcome.narrativeAppend = commitment.prose;
        } else {
          const frontBeat = advanceFront(state);
          if (frontBeat) {
            outcome.eventIds.push(frontBeat.eventId);
            outcome.narrativeAppend = frontBeat.prose;
          }
        }
      }
    }
  }

  if (!outcome.narrativeAppend) {
    const roleLeverage = outcome.leverageAdded.find(id =>
      id === ROLE_LEVERAGE_DEFINITIONS[state.canonical.playerClass ?? 'observer'].id
    );
    const prose = roleLeverage ? leverageProse(roleLeverage) : undefined;
    if (prose) outcome.narrativeAppend = prose;
  }

  for (const eventId of outcome.eventIds) {
    const carriesConsequence = eventId.includes('costly_success') || eventId.endsWith('_missed');
    situation.eventHistory.push({
      eventId,
      pulse: situation.pulse,
      consequence: carriesConsequence ? situation.irreversibleConsequences.at(-1) : undefined,
    });
  }

  return outcome;
}

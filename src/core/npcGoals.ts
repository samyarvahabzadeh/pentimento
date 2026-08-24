import type { ActionPrimitive, NpcGoalProfile, RunState } from './types.js';
import { NPC_ROUTE_CARDS } from '../canon/characterBible.js';

export const INITIAL_NPC_GOAL_PROFILES: Record<string, NpcGoalProfile> = {
  salar: {
    id: 'salar',
    nameFa: 'سالار صالحی',
    goals: ['حفظ کافه از بدهی', 'پنهان کردن قرارداد پلاک ۵۵', 'جلوگیری از ورود پلیس'],
    fears: ['ورود پلیس و پلمب کافه', 'رسوایی عمومی', 'لو رفتن جعل فاکتور'],
    loyalties: ['کافه پنتیمنتو', 'خانواده و پرسنل'],
    currentKnowledge: ['lot55_buyer_contact', 'invoice_lot55_seal'],
    suspicion: 25,
    trust: 0,
    pressureThresholds: { fluster: 2, breakdown: 4 },
    behavioralTendencies: ['تحت فشار به بدهی‌ها اشاره می‌کند', 'در برابر تهدید پلیس حالت دفاعی می‌گیرد'],
  },
  mani: {
    id: 'mani',
    nameFa: 'مانی (باریستای ارشد)',
    goals: ['محافظت از بار و برادرش یاشین', 'حفظ کیفیت کار', 'دوری از دردسرهای تهران/کرج'],
    fears: ['خشونت فیزیکی', 'پلیس', 'از دست دادن کار و آبرو'],
    loyalties: ['یاشین', 'سالار'],
    currentKnowledge: ['fact_solvent_smell_cup'],
    suspicion: 20,
    trust: 0,
    pressureThresholds: { fluster: 2, breakdown: 3 },
    behavioralTendencies: ['از حریم پشت بار دفاع فیزیکی می‌کند', 'به خاموشی یا بسته شدن در سریع واکنش نشان می‌دهد'],
  },
  yashin: {
    id: 'yashin',
    nameFa: 'یاشین (باریستا و صندوق‌دار)',
    goals: ['ثبت دقیق ساعت‌ها و حساب‌ها', 'آرامش سالن', 'حمایت از سالار'],
    fears: ['اتهام دزدی یا بی‌نظمی', 'بی‌نظمی در سالن'],
    loyalties: ['سالار', 'مانی'],
    currentKnowledge: ['fact_time_0017', 'fact_pos_order_timestamp'],
    suspicion: 15,
    trust: 0,
    pressureThresholds: { fluster: 2, breakdown: 4 },
    behavioralTendencies: ['در برابر پرسش‌های زمانی دقیق پاسخ می‌دهد', 'از متهم شدن بدون سند آشفته می‌شود'],
  },
  haniyeh: {
    id: 'haniyeh',
    nameFa: 'حانیه (سفارش‌گیرنده و عکاس شیفت)',
    goals: ['ثبت دقیق رفتارها در تبلت', 'مراقبت از پنتی', 'فهمیدن راز مهمان میز ۵'],
    fears: ['سرزنش شدن', 'خطر ناشناخته'],
    loyalties: ['بی‌طرف و کنجکاو'],
    currentKnowledge: ['fact_guest_hesitation'],
    suspicion: 10,
    trust: 0,
    pressureThresholds: { fluster: 1, breakdown: 3 },
    behavioralTendencies: ['به تناقض‌ها واکنش شگفت‌زده نشان می‌دهد', 'با لحن صمیمانه همکاری می‌کند'],
  },
  collector: {
    id: 'collector',
    nameFa: 'کلکسیونر پلاک ۵۵',
    goals: ['تصاحب پنل پنتیمنتو', 'حفظ انحصار اسناد تاریخی'],
    fears: ['افشای شبکه دستکش قرمز', 'از دست رفتن شجره‌نامه بوم'],
    loyalties: ['Custodians شبکه دستکش قرمز'],
    currentKnowledge: ['fact_collector_settlement_motive', 'fact_florence_historical_breach'],
    suspicion: 50,
    trust: -10,
    pressureThresholds: { fluster: 2, breakdown: 4 },
    behavioralTendencies: ['با پیشنهادات مالی مذاکره می‌کند', 'در برابر بلوف مستند سکوت می‌کند'],
  },
};

export function createInitialNpcGoalProfiles(): Record<string, NpcGoalProfile> {
  return JSON.parse(JSON.stringify(INITIAL_NPC_GOAL_PROFILES));
}

export function evaluateNpcReaction(
  npcId: string,
  primitive: ActionPrimitive,
  target: string | undefined,
  method: string | undefined,
  state: RunState
): { responseProse: string; suspicionDelta: number; trustDelta: number; clockDelta?: { clock: any; delta: number }; revealedFactIds?: string[]; proofPoints?: number; setFlags?: string[] } {
  const profile = state.npcGoalProfiles?.[npcId] ?? INITIAL_NPC_GOAL_PROFILES[npcId];
  if (!profile) {
    return { responseProse: 'شخص مقابل با سکوت نگاهت می‌کند.', suspicionDelta: 0, trustDelta: 0 };
  }

  // 1. Deception / Bluffing
  if (primitive === 'deceive') {
    if (npcId === 'salar') {
      return {
        responseProse: `سالار صالحی برای یک ثانیه قلم را روی میز متوقف می‌کند. چشمانش تیز می‌شوند و نفسش را بیرون می‌دهد:
«پلیس؟ اگر پای مأمور به این کافه باز بشه، تنها چیزی که حل نمی‌شه همین پروندست. شما دقیقاً دنبال چی هستید؟»`,
        suspicionDelta: 20,
        trustDelta: -1,
        clockDelta: { clock: 'policeAttention', delta: 1 },
      };
    }
    if (npcId === 'haniyeh') {
      return {
        responseProse: `حانیه با تعجب نگاهت می‌کند و تبلت را به سینه‌اش می‌فشارد: «اما این اطلاعات با مشاهدات من جور درنمیاد... چرا این حرف رو می‌زنید؟»`,
        suspicionDelta: 15,
        trustDelta: -1,
      };
    }
  }

  // 2. Asking for private phone / personal belongings
  if (primitive === 'ask' && (/phone|گوشی|موبایل/.test(target || '') || /phone|گوشی|موبایل/.test(method || '') || /phone|گوشی|موبایل/.test(state.scene.recentBeats.slice(-1)[0]?.playerInput || ''))) {
    return {
      responseProse: `${profile.nameFa} دستش را روی وسایل شخصی‌اش می‌گذارد و با اخم می‌گوید:
«وسایل شخصی و موبایل من مدرک جرم نیست. سؤالی از پرونده داری بپرس، به حریم خصوصی دیگران کاری نداشته باش.»`,
      suspicionDelta: 15,
      trustDelta: -1,
    };
  }

  // 3. Environmental disruption (door blocked or lights out)
  if (primitive === 'block' || primitive === 'lock' || (primitive === 'use' && target === 'lights')) {
    return {
      responseProse: `${profile.nameFa} با هوشیاری قدمی به عقب برمی‌دارد و با لحن محتاط می‌گوید:
«چرا فضا رو به هم می‌ریزی؟ اگر چیزی می‌خوای شفاف بگو.»`,
      suspicionDelta: 20,
      trustDelta: -1,
      clockDelta: { clock: 'npcPanic', delta: 1 },
    };
  }

  // 4. Offering bribe / money
  if (primitive === 'give' && /پول|رشوه|خرید/.test(method || '')) {
    if (npcId === 'collector') {
      return {
        responseProse: `صدای خندهٔ ملایم و سرد کلکسیونر شنیده می‌شود:
«پیشنهاد جالبیه، ولی ارزش اون چیزی که زیر لایه‌های این قاب خوابیده، با ارقام معمول تسویه نمی‌شه.»`,
        suspicionDelta: 20,
        trustDelta: 0,
      };
    }
    return {
      responseProse: `${profile.nameFa} با اخم عقب می‌کشد: «فکر کردی این ماجرا با پول حل می‌شه؟»`,
      suspicionDelta: 15,
      trustDelta: -2,
    };
  }

  // 5. Inquiries & Social Conversation (Knowledge-card dispatch)
  if (primitive === 'ask' || primitive === 'persuade') {
    const raw = (method || target || '').toLowerCase();
    const route = NPC_ROUTE_CARDS[npcId];
    if (!route) {
      return { responseProse: `${profile.nameFa} با دقت به حرفت گوش می‌دهد.`, suspicionDelta: 0, trustDelta: 0 };
    }

    if (!state.environmentState) state.environmentState = {};
    if (!state.environmentState.revealedNpcKnowledge) state.environmentState.revealedNpcKnowledge = {};
    if (!state.environmentState.npcTopicHistory) state.environmentState.npcTopicHistory = {};

    // Requests about safety, backups, and division of responsibility are
    // character decisions, not failed clue queries. They can create a durable
    // alliance action without handing the player a secret for choosing the
    // socially "correct" sentence.
    const asksForIndependentBackup = /(?:نسخه|عکس|بکاپ|پشتیبان).*(?:مستقل|جدا|نگه|حفظ)|(?:مستقل|جدا).*(?:نسخه|عکس|ثبت)/.test(raw);
    if (npcId === 'haniyeh' && primitive === 'persuade' && asksForIndependentBackup) {
      const flag = 'haniyeh_independent_backup_agreed';
      const firstCommitment = !state.canonical.canonicalFlags.includes(flag);
      return {
        responseProse: 'حانیه چند لحظه نگاهت می‌کند و بعد تبلت را به کیف خودش می‌برد: «قبول؛ یک نسخه بیرون از سیستم کافه می‌مونه، ولی کلیدش دست خودم. اگر سالار یا تو خواستید پاکش کنید، بدون رضایت من نمی‌شه.» او مطیع نقشه نشده؛ با اختیار خودش وارد آن شده است.',
        suspicionDelta: firstCommitment ? -5 : 0,
        trustDelta: firstCommitment ? 1 : 0,
        setFlags: firstCommitment ? [flag] : [],
      };
    }

    const asksForOfflineTimeline = /(?:زمان|ساعت|لاگ|ثبت).*(?:کاغذ|مستقل|آفلاین|جدا)|(?:کاغذ|مستقل|آفلاین).*(?:زمان|ساعت|ثبت)/.test(raw);
    if (npcId === 'yashin' && primitive === 'persuade' && asksForOfflineTimeline) {
      const flag = 'yashin_offline_timeline_started';
      const firstCommitment = !state.canonical.canonicalFlags.includes(flag);
      return {
        responseProse: 'یاشین یک رول کاغذ صندوق را بیرون می‌کشد و ساعت گوشی، پوز و مانیتور را در سه ستون جدا می‌نویسد: «این نسخه به هیچ حساب کاربری وصل نیست. اگر دستگاه‌ها پاک بشن، اختلاف ساعت‌ها می‌مونه—اما امضای من هم پایش می‌مونه.» کمکش واقعی است و برای خودش خطر دارد.',
        suspicionDelta: 0,
        trustDelta: firstCommitment ? 1 : 0,
        setFlags: firstCommitment ? [flag] : [],
      };
    }

    if (/امن|خطر|نجات|محافظت|اولویت|اعتماد/.test(raw)) {
      const safetyResponses: Record<string, string> = {
        haniyeh: 'حانیه بی‌درنگ به زیر صندلی نگاه می‌کند: «اول پنتی رو از شیشه و دود دور می‌کنم. بعد عکس رو جایی می‌فرستم که با سوختن یا پاک شدن اینجا از بین نره. برای موندنم باید بدونم تو آدم‌ها رو سپر مدرک نمی‌کنی.»',
        mani: 'مانی نگاهش را به یاشین می‌دوزد: «اول برادرم و مشتری‌ها از در بیرون می‌رن. بعد اگر راه امنی بود، برای تابلو برمی‌گردم. از من نخواه برای یک قاب، آدم نگه دارم.»',
        yashin: 'یاشین می‌گوید: «اول زمان و اسم آدم‌ها رو ثبت می‌کنم، بعد خروج امن. چیزی که فقط توی دستگاه باشه با یک خاموشی می‌میره؛ چیزی که فقط توی حافظه باشه با ترس عوض می‌شه.»',
        salar: 'سالار نگاهش را از زونکن می‌دزدد: «می‌خوام کافه و آدم‌هاش هر دو بمونن؛ ولی بدهی انتخاب‌های تمیز نمی‌ذاره. اگر نقشه‌ات واقعاً حفاظت از آدم‌هاست، بگو چه بخشی از کنترل رو باید واگذار کنم.»',
        collector: 'نمایندهٔ خریدار آرام جواب می‌دهد: «امنیت واژه‌ای است که مالک برای کنترل و شاهد برای فرار به کار می‌برد. روشن کنید می‌خواهید چه کسی امن بماند و چه کسی اختیارش را از دست بدهد.»',
      };
      return {
        responseProse: safetyResponses[npcId] ?? `${profile.nameFa} از تو می‌خواهد اولویت و بهای نقشه‌ات را روشن کنی.`,
        suspicionDelta: 0,
        trustDelta: 0,
      };
    }

    const topicPatterns: Record<string, RegExp> = {
      salar: /تابلو|نقاشی|فاکتور|سند|پلاک|۵۵|55|خریدار|تاریخ|مالکیت/,
      yashin: /ساعت|زمان|میز\s*(۵|5|پنج)|مهمان|مرد|خروج|فیش|پوز|سفارش/,
      mani: /بو|حلال|تینر|شیمیایی|فنجان|قهوه|شوینده|نازل/,
      haniyeh: /مرد|مهمان|مشتری|میز\s*(۵|5|پنج)|فنجان|پنتی|رفتار|رفت/,
      collector: /پلاک|۵۵|55|تابلو|نقاشی|خریدار|قیمت|انگیزه|مالکیت/,
    };
    const isKnowledgeTopic = topicPatterns[npcId]?.test(raw) ?? false;
    const card = isKnowledgeTopic ? route.knowledgeCards[0] : undefined;

    const trust = state.npcTrust?.[npcId] ?? 0;
    const pressure = state.npcPressure?.[npcId] ?? 0;
    const role = state.canonical.playerClass ?? 'observer';
    const sceneAllowed = card ? card.allowedScenes.includes(state.canonical.currentNode) : false;
    const thresholdMet = card
      ? trust >= (card.minTrust ?? Number.NEGATIVE_INFINITY) && pressure >= (card.minPressure ?? Number.NEGATIVE_INFINITY)
      : false;
    const evidenceMet = card?.requiresEvidence?.every(id => state.canonical.evidenceIds.includes(id)) ?? true;
    const disclosureRuleMet = card
      ? route.disclosureRules
          .filter(rule => rule.revealsKnowledgeCardId === card.id)
          .some(rule => evaluateDisclosureCondition(rule.condition, trust, pressure, role, state))
      : false;
    const canReveal = Boolean(card && sceneAllowed && evidenceMet && (thresholdMet || disclosureRuleMet));

    if (card && canReveal) {
      const revealed = state.environmentState.revealedNpcKnowledge[npcId] ?? [];
      const firstReveal = !revealed.includes(card.id);
      if (firstReveal) revealed.push(card.id);
      state.environmentState.revealedNpcKnowledge[npcId] = revealed;
      const investigatorTell = firstReveal && role === 'investigator' && npcId === 'haniyeh'
        ? '\n\nهنگام گفتن «دست راست»، نگاه حانیه ناخودآگاه به سمت در خروجی می‌پرد. این واکنش نشان می‌دهد جزئیات دستکش را واقعاً دیده، نه اینکه بعداً از دیگری شنیده باشد.'
        : '';
      const roleFacts = investigatorTell ? ['fact_haniyeh_behavioral_tell'] : [];
      return {
        responseProse: `${card.dialogueVariants.cooperative}${investigatorTell}`,
        suspicionDelta: firstReveal ? -5 : 0,
        trustDelta: firstReveal ? 1 : 0,
        revealedFactIds: firstReveal ? [...card.factIds, ...roleFacts] : [],
        proofPoints: firstReveal ? (role === 'investigator' ? 2 : 1) : 0,
      };
    }

    if (card) {
      return {
        responseProse: card.dialogueVariants.guarded,
        suspicionDelta: 0,
        trustDelta: 0,
      };
    }

    const topicKey = classifyPublicTopic(raw);
    const history = state.environmentState.npcTopicHistory[npcId] ?? [];
    const firstTopic = !history.includes(topicKey);
    if (firstTopic) history.push(topicKey);
    state.environmentState.npcTopicHistory[npcId] = history;
    const affinity = route.roleAffinities[role] ?? 0;
    const publicResponses: Record<string, string> = {
      haniyeh: 'حانیه تبلت را پایین می‌آورد: «اگر فقط دنبال جواب پرونده‌ای، سؤال دقیق بپرس. اگر می‌خوای من هم کاری بکنم، بگو چه خطری را قبول می‌کنی و چه اختیاری برای من می‌ماند.»',
      mani: 'مانی دستمال را روی شانه می‌اندازد: «من دستگاه پاسخ‌گویی نیستم. یک کار مشخص یا آزمایش منصفانه پیشنهاد بده؛ بعد می‌بینی طرف چه کسی می‌ایستم.»',
      yashin: 'یاشین خودکار را بین انگشت‌هایش می‌چرخاند: «حدس را می‌شنوم، ولی اگر از من همکاری می‌خواهی بگو چه چیزی را مستقل ثبت کنم و چه کسی مسئول نتیجه است.»',
      salar: 'سالار درِ زونکن را نیمه‌باز نگه می‌دارد: «من می‌تونم جواب بدم، معامله کنم یا کنترل رو واگذار کنم. تو باید روشن کنی کدام را از من می‌خواهی.»',
      collector: 'نمایندهٔ خریدار می‌گوید: «پرسش عمومی پاسخ عمومی دارد. یک خواسته، تهدید یا دارایی مشخص روی میز بگذارید.»',
    };
    return {
      responseProse: publicResponses[npcId] ?? `${profile.nameFa} از تو می‌خواهد خواسته یا مدرکت را دقیق‌تر روی میز بگذاری.`,
      suspicionDelta: 0,
      trustDelta: firstTopic && affinity > 0 ? 1 : 0,
    };
  }

  // Default reaction
  return {
    responseProse: `${profile.nameFa} رفتارت را زیر نظر دارد و موقعیت را می‌سنجد.`,
    suspicionDelta: 0,
    trustDelta: 0,
  };
}

function classifyPublicTopic(raw: string): string {
  if (/کمک|امن|حفاظت|نگران/.test(raw)) return 'safety';
  if (/کافه|کار|شیفت|حال/.test(raw)) return 'work';
  return 'general';
}

function evaluateDisclosureCondition(
  condition: string,
  trust: number,
  pressure: number,
  role: string,
  state: RunState
): boolean {
  return condition.split('||').some(rawClause => {
    const clause = rawClause.trim();
    const trustMatch = clause.match(/^trust\s*>=\s*(-?\d+)$/);
    if (trustMatch) return trust >= Number(trustMatch[1]);
    const pressureMatch = clause.match(/^pressure\s*>=\s*(-?\d+)$/);
    if (pressureMatch) return pressure >= Number(pressureMatch[1]);
    const evidenceMatch = clause.match(/^has_evidence:(.+)$/);
    if (evidenceMatch) return state.canonical.evidenceIds.includes(evidenceMatch[1]);
    const roleMatch = clause.match(/^role\s*==\s*([a-z_]+)$/);
    if (roleMatch) return role === roleMatch[1];
    return false;
  });
}

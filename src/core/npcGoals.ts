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
    behavioralTendencies: [
      'سلام را با «درود بر شما» آغاز می‌کند',
      'دانستنی‌ها را با «شما می‌دونستید...» قاب می‌گیرد',
      'اصلاح را با «خیر» شروع می‌کند و بعد نسخهٔ خودش را می‌گوید',
      'در فیفا با اعتمادبه‌نفس اغراق می‌کند',
      'فقط در دانش قهوه و ثبت مستقیم شیفت واقعاً قابل اتکاست',
    ],
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

type NpcReactionResult = {
  responseProse: string;
  suspicionDelta: number;
  trustDelta: number;
  clockDelta?: { clock: any; delta: number };
  revealedFactIds?: string[];
  proofPoints?: number;
  setFlags?: string[];
};

function firstFlag(state: RunState, flag: string): string[] {
  return state.canonical.canonicalFlags.includes(flag) ? [] : [flag];
}

/**
 * Yashin's real-world mannerisms are executable dialogue policy, not flavour
 * prose in a bible.  Only coffee expertise and things he directly registered
 * during the shift may become evidence; FIFA boasts and general-knowledge
 * claims are explicitly framed as character claims.
 */
function evaluateYashinPersonalVoice(raw: string, state: RunState): NpcReactionResult | undefined {
  if (/فیفا|fifa|پلی\s*استیشن|پلی‌استیشن|کنسول|بازی\s*فوتبال/.test(raw)) {
    return {
      responseProse: 'یاشین لبخند مطمئنی می‌زند و آستینش را صاف می‌کند: «خیر. سؤال درست این نیست که من توی فیفا خوبم یا نه؛ سؤال اینه که شما تا دقیقهٔ چند می‌تونید جلوی من نتیجه رو نگه دارید. مانی هنوز باخت قبلیش رو گردنِ لگ می‌اندازه.» این فقط ادعای خود یاشین دربارهٔ خودش است؛ هیچ چیزی از پرونده را ثابت نمی‌کند.',
      suspicionDelta: 0,
      trustDelta: 0,
      setFlags: firstFlag(state, 'yashin_fifa_boast_heard'),
    };
  }

  const coffeeTechnique = /(?:قهوه|اسپرسو|رست|دان|عصاره|آسیاب|کرما|اسیدیته|دم‌آوری|اروپرس|کمکس|v60|وی\s*شصت).*(?:چطور|چجوری|چرا|بهتر|درست|نسبت|دما|زمان|چی|تاریخ|می‌?دون)|(?:نسبت|دما|آسیاب|عصاره|رست).*(?:قهوه|اسپرسو)/.test(raw);
  if (coffeeTechnique) {
    return {
      responseProse: 'یاشین بی‌اختیار جدی‌تر می‌ایستد: «شما می‌دونستید نسبتِ حدود یک‌به‌دو برای اسپرسو فقط نقطهٔ شروعه؟ دوز، خروجی، زمان، دما و درجهٔ آسیاب باید با رست و مزه‌ای که واقعاً توی فنجون می‌گیری تنظیم بشه؛ عدد ثابت جای چشیدن رو نمی‌گیره.» این بار لحن مطمئنش پشتوانه دارد؛ دربارهٔ قهوه با احتیاط میان قاعده و متغیر فرق می‌گذارد.',
      suspicionDelta: 0,
      trustDelta: 1,
      setFlags: firstFlag(state, 'yashin_coffee_expertise_witnessed'),
    };
  }

  if (/تاریخ|رنسانس|فلورانس|روم|یونان|زئوس|قاجار|صفوی|پادشاه|جنگ|دانستنی|اطلاعات\s*عمومی/.test(raw)) {
    return {
      responseProse: 'یاشین بدون مکث جواب می‌دهد: «خیر. نسخه‌ای که معمولاً تعریف می‌کنن زیادی کتابیه؛ اصل ماجرا این بود که بانکدارها رنسانس رو راه انداختن و هنرمندها بعداً براش اسم ساختن.» جمله را چنان قطعی می‌گوید که انگار پاورقی‌اش را حفظ است، اما منبعی ندارد و چند دوره و علت متفاوت را در یک نتیجهٔ خوش‌صدا فشرده کرده؛ این ادعا سرنخ پرونده نیست.',
      suspicionDelta: 0,
      trustDelta: 0,
      setFlags: firstFlag(state, 'yashin_outside_domain_claim_heard'),
    };
  }

  const directCorrection = /(?:یاشین.*(?:فکر\s*می‌?کنم|به\s*نظرم|اشتباه|درست\s*نیست)|(?:به|از)\s*یاشین.*(?:می‌?گم|می‌?گویم).*(?:که|فکر)|تو\s*گفتی|مگه\s*نه)/.test(raw);
  if (directCorrection) {
    return {
      responseProse: 'یاشین قبل از تمام شدن جمله‌ات آرام می‌گوید: «خیر.» بعد نسخهٔ خودش را با همان اعتمادبه‌نفس مرتب می‌کند و در پایان اضافه می‌کند: «اگر دربارهٔ قهوه یا چیزی که خودم امشب ثبت کردم حرف می‌زنیم، عدد و شاهد می‌ذارم؛ بقیه‌ش برداشت منه.» برای نخستین بار مرز دانسته و ادعایش را—هرچند با اکراه—روشن می‌کند.',
      suspicionDelta: 0,
      trustDelta: 0,
      setFlags: firstFlag(state, 'yashin_correction_tic_heard'),
    };
  }

  return undefined;
}

export function evaluateNpcReaction(
  npcId: string,
  primitive: ActionPrimitive,
  target: string | undefined,
  method: string | undefined,
  state: RunState
): NpcReactionResult {
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
    if (npcId === 'collector') {
      return {
        responseProse: 'صدای نمایندهٔ خریدار برای لحظه‌ای قطع می‌شود، بعد آرام‌تر برمی‌گردد: «تحویل پلیس؟ پس یک شمارهٔ ثبت یا تصویری از رسیدش بفرستید. اگر ندارید، دفعهٔ بعد بلوف را با چیزی خرج کنید که بتواند زنده بماند.» ادعایت او را وادار به عقب‌نشینی نمی‌کند؛ فقط شبکه را هوشیارتر می‌سازد.',
        suspicionDelta: 15,
        trustDelta: -1,
        clockDelta: { clock: 'factionPressure', delta: 1 },
      };
    }
    return {
      responseProse: `${profile.nameFa} چند ثانیه ساکت می‌ماند و بعد جزئیات قابل‌بررسی ادعایت را می‌خواهد. بدون نشانه‌ای مستقل، داستانت را نمی‌پذیرد و از این پس حرف‌هایت را محتاطانه‌تر می‌سنجد.`,
      suspicionDelta: 10,
      trustDelta: -1,
    };
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

    if (/^(?:\s)*(?:سلام|درود|خسته\s*نباشید|شب\s*بخیر)(?:[،,!\s]|$)/.test(raw)) {
      const greetings: Record<string, string> = {
        haniyeh: 'حانیه با وجود نگرانی لبخند کوتاهی می‌زند: «سلام. ببخش اگه اوضاع عادی نیست؛ امشب میز پنج همه‌مون رو به‌هم ریخته.»',
        yashin: 'یاشین دست از مرتب‌کردن فنجان‌ها می‌کشد و با وقار کوتاهی سر خم می‌کند: «درود بر شما.» بعد انگار همین سلام هم مقدمهٔ یک آزمون است، نگاهش را منتظر نگه می‌دارد.',
        mani: 'مانی با تکان سر جواب می‌دهد: «سلام رفیق. پشت بار شلوغه، ولی صدات رو می‌شنوم.»',
        salar: state.canonical.canonicalFlags.includes('player_salar_old_friend')
          ? 'سالار نگاهش را بالا می‌آورد؛ برای یک لحظه اضطراب جایش را به آشنایی قدیمی می‌دهد: «سلام... ممنون که واقعاً اومدی. باید قبل از اینکه دیر بشه باهات حرف بزنم.»'
          : 'سالار از پشت میز بلند می‌شود: «سلام. ممنون که این وقت شب اومدی؛ توضیح بده از کجا شروع کنیم.»',
        collector: 'صدای نمایندهٔ خریدار آرام جواب می‌دهد: «شب بخیر. امیدوارم گفت‌وگویی دقیق‌تر از شایعات امشب داشته باشیم.»',
      };
      return { responseProse: greetings[npcId] ?? `${profile.nameFa} سلام کوتاهی می‌کند.`, suspicionDelta: 0, trustDelta: 0 };
    }

    const isDrinkOrder = /سفارش|(?:یه|یک)\s*(?:قهوه|اسپرسو)|(?:قهوه|اسپرسو).*(?:می‌?خوام|می‌?خواهم|بیار)/.test(raw);
    if (isDrinkOrder && ['haniyeh', 'yashin', 'mani'].includes(npcId)) {
      const orderResponses: Record<string, string> = {
        haniyeh: 'حانیه سفارش را روی تبلت ثبت می‌کند: «یه اسپرسو؛ چشم. فقط اون فنجون روی میز پنج سفارش تو نیست—بهش دست نزن تا یاشین سفارشت رو بیاره.» بعد یک نعلبکی تمیز را کنار دست راستت می‌گذارد تا دو سفارش با هم قاطی نشوند.',
        yashin: 'یاشین یک فنجان تمیز از گرم‌کن برمی‌دارد: «درود بر شما. یک اسپرسوی تازه می‌زنم؛ فنجون میز پنج رو با این قاطی نکنید، اون از قبل اینجا مونده.» قبل از چرخاندن آسیاب اضافه می‌کند: «شما می‌دونستید گرم‌کردن فنجون برای ثبات دماست، نه داغ‌کردن بی‌دلیل نوشیدنی؟»',
        mani: 'مانی سر تکان می‌دهد و پرتافیلتر تمیزی را جا می‌زند: «باشه رفیق؛ این یکی جلوی چشم خودت آماده می‌شه.»',
      };
      return {
        responseProse: orderResponses[npcId],
        suspicionDelta: 0,
        trustDelta: 0,
        setFlags: state.canonical.canonicalFlags.includes('player_ordered_espresso') ? [] : ['player_ordered_espresso'],
      };
    }

    if (npcId === 'salar' && /زنگ|تماس|تلفن|پیام/.test(raw) && /رسیدم|اومدم|آمدم|اینجام|جلوی\s*کافه/.test(raw)) {
      const sceneId = state.canonical.currentScene || state.scene.sceneId;
      let responseProse: string;
      if (sceneId === 'scene_entrance') {
        responseProse = 'سالار تقریباً بی‌درنگ جواب می‌دهد؛ صدایش پایین است: «از دوربین ورودی دیدمت. مستقیم بیا دفتر—ولی اگر مرد پالتویی هنوز دور نشده، مجبور نیستی از کنارش بی‌تفاوت رد بشی.» پشت صدایش، خش‌خش ورق‌زدن سریع کاغذ می‌آید.';
      } else if (sceneId === 'scene_office') {
        responseProse = 'گوشی سالار روی میز شروع به لرزیدن می‌کند. نگاهش را از صفحه به تو می‌دهد و تماس را قطع می‌کند: «همین‌جایی. در رو ببند؛ چیزی هست که پشت تلفن نگفتم.»';
      } else if (sceneId === 'scene_hosseini_alley') {
        responseProse = 'سالار فوری جواب می‌دهد: «صدات از بیرون میاد—از ورودی دور شدی؟ اگر دنبال اون مرد رفتی، فاصله‌ات رو نگه دار و بگو کدوم سمت رفت.» صدای کشیده‌شدن صندلی از اتاقش می‌آید؛ آماده شده از پشت میز بلند شود.';
      } else {
        responseProse = 'سالار فوری جواب می‌دهد؛ همان لحظه صدای زنگ گوشی از سمت در نیمه‌باز حسابداری هم شنیده می‌شود. «فهمیدم داخل شدی. مستقیم بیا دفتر. اگر مرد پالتویی رو بیرون دیدی، قبل از اینکه چیزی جابه‌جا کنی باید حرف بزنیم.»';
      }
      return {
        responseProse,
        suspicionDelta: 0,
        trustDelta: 0,
      };
    }

    if (
      npcId === 'salar' &&
      /(?:مرد|پالتو|بیرون).*(?:بازرس|اماکن|هویت|گشت|پلیس|تهدید)|(?:بازرس|اماکن|هویت|گشت|پلیس|تهدید).*(?:مرد|پالتو|بیرون)/.test(raw)
    ) {
      const courierReportObserved = state.situation?.eventHistory.some(
        event => event.eventId.startsWith('opening_courier_reports_'),
      ) ?? false;
      const networkAlreadyReacted = courierReportObserved ||
        state.canonical.canonicalFlags.includes('collector_deadline_received');
      return {
        responseProse: networkAlreadyReacted
          ? 'سالار دست از جابه‌جا کردن کاغذها می‌کشد: «پس اون حرکت روی گوشی، گزارش تو بوده. ادعای بازرسی و اسم گشت حالا بخشی از مذاکره‌ست؛ یا براش پشتوانه می‌سازیم، یا کاری می‌کنیم تماس بعدی رو مسیرِ خودمون بیفته.» زونکن را می‌بندد و منتظر می‌ماند بگویی کدام خطر را قبول می‌کنی.'
          : 'سالار دست از جابه‌جا کردن کاغذها می‌کشد: «اگر قبل از ورودت اسم و صورتت رو فرستاده باشه، تماس بعدی غافلگیرمون می‌کنه. دقیق بگو چی شنید و از کدوم سمت رفت.» قلم را کنار می‌گذارد؛ این بار حرفت را مثل گزارش ثبت می‌کند، نه درد دل.',
        suspicionDelta: 0,
        trustDelta: 1,
        setFlags: state.canonical.canonicalFlags.includes('salar_warned_about_courier_contact')
          ? []
          : ['salar_warned_about_courier_contact'],
      };
    }

    if (npcId === 'haniyeh' && /سالار.*کجا|کجاست.*سالار/.test(raw)) {
      return {
        responseProse: 'حانیه با چانه به راهروی کنار سالن اشاره می‌کند: «اتاق حسابداریه، پشت همون در نیمه‌باز. از وقتی زنگ زد به تو، هی زونکن‌ها رو جابه‌جا می‌کنه.»',
        suspicionDelta: 0,
        trustDelta: 0,
      };
    }

    if (npcId === 'haniyeh' && /(?:قهوه|فنجان).*(?:مال|برای).*(?:کی|چه\s*کسی)|(?:مال|برای).*(?:کی|چه\s*کسی).*(?:قهوه|فنجان)/.test(raw)) {
      return {
        responseProse: 'حانیه به میز پنج نگاه می‌کند: «برای همون مرد پالتوپوش بود. سفارش داد، ولی تقریباً دست‌نخورده گذاشت و رفت.» انگشتش چند سانتی‌متر مانده به دستهٔ فنجان متوقف می‌شود. «چرا رفت رو نمی‌دونم؛ حتی ندیدم یه جرعه بخوره.»',
        suspicionDelta: 0,
        trustDelta: 0,
      };
    }

    if (npcId === 'haniyeh' && /پنتی|گربه/.test(raw)) {
      return {
        responseProse: 'حانیه کنار صندلی خم می‌شود: «از وقتی اون مرد کنار میز پنج بود، پنتی به فنجون نزدیک نمی‌شه. نمی‌دونم از بو ترسیده، از حرکتش، یا از یه چیز دیگه.» پنتی با شنیدن صدای برخورد قاشق به همان نعلبکی، دوباره گوش‌هایش را عقب می‌برد.',
        suspicionDelta: 0,
        trustDelta: 0,
      };
    }

    const route = NPC_ROUTE_CARDS[npcId];
    if (!route) {
      return { responseProse: `${profile.nameFa} با دقت به حرفت گوش می‌دهد.`, suspicionDelta: 0, trustDelta: 0 };
    }

    if (!state.environmentState) state.environmentState = {};
    if (!state.environmentState.revealedNpcKnowledge) state.environmentState.revealedNpcKnowledge = {};
    if (!state.environmentState.npcTopicHistory) state.environmentState.npcTopicHistory = {};

    if (npcId === 'yashin') {
      const personalVoice = evaluateYashinPersonalVoice(raw, state);
      if (personalVoice) return personalVoice;
    }

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
      yashin: 'یاشین خودکار را بین انگشت‌هایش می‌چرخاند: «خیر. حدس با ثبت فرق داره؛ اگر از من همکاری می‌خواید بگید چه چیزی رو مستقل ثبت کنم و چه کسی مسئول نتیجه‌ست.» پاسخ را طوری می‌بندد که انگار صورت سؤال از اول اشتباه بوده است.',
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

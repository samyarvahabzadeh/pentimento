import type {
  CanonicalEffect,
  RunState,
  SemanticAction,
  TurnResolution,
  WorldObject,
} from './types.js';
import { createInitialWorldObjects, findWorldObject } from './worldAffordances.js';
import { evaluateNpcReaction, INITIAL_NPC_GOAL_PROFILES } from './npcGoals.js';
import { tickClock } from './consequenceClocks.js';
import { addProofPoints } from './proofDomains.js';
import { isWorldObjectAccessible, resolveLayeredInspection } from './evidenceGating.js';

export interface SemanticSolverResult {
  narrative: string;
  acceptedEffects: CanonicalEffect[];
  isSuccess: boolean;
  reasonIfFailed?: string;
}

/**
 * Generic World Physics, Affordance, and Social Simulator.
 * Resolves (Primitive × Target × Method × WorldState).
 */
export function solveSemanticAction(
  action: SemanticAction,
  state: RunState
): SemanticSolverResult {
  const p = action.primitive;
  const targetKey = action.target ?? '';
  const secTargetKey = action.secondaryTarget ?? '';
  const method = action.method ?? action.rawInput;

  // Initialize runtime world state structures if absent
  if (!state.worldObjects || Object.keys(state.worldObjects).length === 0) {
    state.worldObjects = createInitialWorldObjects();
  }
  if (!state.environmentState) {
    state.environmentState = {};
  }
  if (!state.npcTrust) {
    state.npcTrust = {};
  }
  if (!state.npcPressure) {
    state.npcPressure = {};
  }
  if (!state.clocks) {
    state.clocks = {
      evidenceRemoval: 0,
      factionPressure: 0,
      npcPanic: 0,
      policeAttention: 0,
      personalRisk: 0,
    };
  }

  const impossibleLeap = /(?:با\s*)?یک\s*پرش.*از\s*سقف.*(?:خیابان|کوچه)|از\s*سقف.*می‌?پرم/.test(action.rawInput);
  if (impossibleLeap || /ذهن.*(?:بخوان|بخون|می‌?خوان|می‌?خون)|فکر(?:ش|شان).*بفهم|تلپورت|نامرئی.*(?:شوم|بشم)|پرواز.*(?:کنم|می‌?کنم)/.test(action.rawInput)) {
    return {
      narrative: impossibleLeap
        ? 'تا لبهٔ مسیر دسترسی سقف را برانداز می‌کنی: خیابان پشتی چند متر پایین‌تر است و هیچ پاگرد یا سایبانی برای شکستن سقوط وجود ندارد. چنین پرشی فرود کنترل‌شده نیست؛ می‌توانی از راه‌پله، پنجرهٔ امن یا مسیر پشتی پایین بروی.'
        : 'این کنش در توان انسانی و قواعد این جهان نیست. نمی‌توانی ذهن کسی را مستقیم بخوانی؛ می‌توانی به مکث، جهت نگاه، تناقض حرف‌ها یا چیزی که از دستش پنهان می‌کند تکیه کنی.',
      acceptedEffects: [],
      isSuccess: false,
      reasonIfFailed: 'impossible_action',
    };
  }

  const effects: CanonicalEffect[] = [];
  const targetObj = findWorldObject(targetKey, state.worldObjects);
  const secObj = findWorldObject(secTargetKey, state.worldObjects);

  // 1. Social Interactions with NPCs
  const npcIds = ['salar', 'mani', 'yashin', 'haniyeh', 'collector', 'exiting_man'];
  const matchedNpc = npcIds.find(id => targetKey.includes(id) || method.includes(id) || action.rawInput.includes(id));

  if (matchedNpc) {
    if (p === 'distract') {
      if (!state.environmentState.customDistractions) state.environmentState.customDistractions = [];
      state.environmentState.customDistractions.push(method.slice(0, 180));
      effects.push({
        type: 'modify_environment',
        key: 'customDistractions',
        value: state.environmentState.customDistractions,
      });
      const name = INITIAL_NPC_GOAL_PROFILES[matchedNpc]?.nameFa ?? 'طرف مقابل';
      return {
        narrative: `${name} را با موضوعی که انتخاب کرده‌ای وارد گفت‌وگو می‌کنی. نگاهش برای چند لحظه از نقطهٔ اصلی صحنه جدا می‌شود؛ این فقط یک فرصت کوتاه می‌سازد و تضمین نمی‌کند حرکت بعدی را نبیند.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }

    if (p === 'inspect') {
      const observations: Record<string, string> = {
        mani: 'مانی در ظاهر به بحث ادامه می‌دهد، اما انگشت‌هایش روی لبهٔ دستمال ثابت مانده و نگاهش هر چند ثانیه به میز پنج برمی‌گردد. این تنش قابل‌دیدن است، نه اثبات اینکه حرکت پنهانی تو را دیده یا علت ماجرا را می‌داند.',
        yashin: 'یاشین وزنش را روی یک پا انداخته و خودکار را آهسته میان انگشت‌ها می‌چرخاند. چشمش بین صندوق و مانی جابه‌جا می‌شود؛ رفتارش احتیاط را نشان می‌دهد، نه اعتراف را.',
        haniyeh: 'حانیه تبلت را نزدیک سینه نگه داشته و هر بار نام میز پنج می‌آید شانه‌هایش کمی جمع می‌شود. می‌توانی اضطراب را ببینی، اما موضوع دقیقش هنوز روشن نیست.',
        salar: 'سالار هنگام بستن زونکن فشار بیشتری از حد لازم به گیره وارد می‌کند. لرزش کوتاه دستش واقعی است، اما از روی آن نمی‌شود میان ترس، خستگی و پنهان‌کاری یکی را قطعی دانست.',
        collector: 'نمایندهٔ خریدار واکنش چهره‌اش را مهار می‌کند و پیش از هر پاسخ مکثی هم‌اندازه دارد. کنترلش حرفه‌ای است؛ آنچه پنهان می‌کند از مشاهدهٔ صرف معلوم نمی‌شود.',
        exiting_man: 'مرد پالتوپوش بدنش را نیم‌رخ نگه داشته تا هم در و هم کوچه را ببیند. این جای‌گیری مسیر فرار را حفظ می‌کند، اما نیتش را ثابت نمی‌کند.',
      };
      return {
        narrative: observations[matchedNpc] ?? 'رفتار ظاهری طرف مقابل را می‌سنجی، اما مشاهده را با خواندن ذهن او اشتباه نمی‌گیری.',
        acceptedEffects: effects,
        isSuccess: true,
      };
    }

    if (matchedNpc === 'exiting_man') {
      if (p === 'ask' || p === 'persuade') {
        if (/ممنون|مرسی|متشکرم|تشکر/.test(method)) {
          return {
            narrative: 'مرد پالتوپوش سرش را فقط به اندازهٔ یک تأیید کوتاه خم می‌کند. «برای تو باز نگه نداشتم.» دستش را از در پس می‌کشد و هوای سرد میان‌تان می‌افتد؛ پاسخ بی‌ادبانه نیست، اما دعوت هم نیست.',
            acceptedEffects: [],
            isSuccess: true,
          };
        }
        if (/چرا.*(?:باز|هنوز)|هنوز.*باز|اینجا.*(?:چه|چی)|چه\s*جور\s*جایی/.test(method)) {
          return {
            narrative: 'مرد نگاه کوتاهی به نور پشت شیشه می‌اندازد: «من نگفتم برای مشتری‌ها بازه.» انگشت پوشیده‌اش از لبهٔ در جدا می‌شود. «گفتم هنوز بازه—برای کسی که باید چیزی را پس بگیره.» پیش از آن‌که بپرسی چه چیزی، نیم‌قدم به سمت کوچه عقب می‌رود.',
            acceptedEffects: [],
            isSuccess: true,
          };
        }
        if (/اسم|کی\s*هستی|کیستی|اسمت|نامت/.test(method)) {
          return {
            narrative: 'مرد پالتوپوش نیم‌قدم عقب می‌رود، طوری که نور کافه فقط لبهٔ دستکش را بگیرد: «اسم من چیزی را عوض نمی‌کند. اگر می‌خواهی بدانی چرا اینجا بودم، از کسی بپرس که حاضر شد چیزی را که مالش نبود پس بدهد.» بعد نگاه کوتاهی به رسید خیس می‌اندازد.',
            acceptedEffects: [],
            isSuccess: true,
          };
        }
        if (/چرا.*(?:می‌?ری|میری|می‌?روی|داری.*می‌?ری)|تو\s*خودت.*چرا|این\s*سرما/.test(method)) {
          return {
            narrative: 'مرد یقهٔ پالتو را بالاتر می‌کشد و نگاهش را به انتهای کوچه می‌دوزد: «چون چیزی که باید تحویل می‌گرفتم اینجا نبود. موندن، فقط به کسی که جابه‌جاش کرده وقت می‌ده.» نمی‌گوید دنبال چه بوده یا از کجا می‌داند جابه‌جا شده است.',
            acceptedEffects: [],
            isSuccess: true,
          };
        }
        return {
          narrative: 'مرد پالتوپوش نیم‌قدم عقب می‌رود، طوری که نور کافه فقط لبهٔ دستکش را بگیرد: «اسم من چیزی را عوض نمی‌کند. اگر می‌خواهی بدانی چرا اینجا بودم، از کسی بپرس که حاضر شد چیزی را که مالش نبود پس بدهد.» نگاه کوتاهی به رسید خیس می‌اندازد و شانه‌اش را به سمت پیچ کوچه می‌چرخاند؛ فاصله‌اش با تو بیشتر می‌شود.',
          acceptedEffects: [],
          isSuccess: true,
        };
      }
      if (p === 'deceive' || p === 'threaten' || p === 'accuse') {
        const risk = tickClock(state.clocks, 'personalRisk', 1, 'رویارویی مستقیم با پیک دستکش قرمز');
        state.clocks = risk.updatedClocks;
        effects.push({ type: 'modify_clock', clock: 'personalRisk', delta: 1, reason: 'رویارویی مستقیم با پیک دستکش قرمز' });
        const encounterFlag = p === 'deceive'
          ? 'exiting_man_bluffed'
          : p === 'threaten'
            ? 'exiting_man_threatened'
            : 'exiting_man_accused';
        if (!state.canonical.canonicalFlags.includes(encounterFlag)) {
          state.canonical.canonicalFlags.push(encounterFlag);
          effects.push({ type: 'set_flag', flag: encounterFlag, value: true });
        }
        return {
          narrative: p === 'deceive'
            ? 'مرد نگاهش را از صورتت به دست‌ها و جیب کتت می‌برد، دنبال کارت یا نشانی که ادعایت را پشتیبانی کند. «بازرس بدون معرفی‌نامه، فقط یک مشتریه که دیر رسیده.» گوشی داخل جیب پالتویش یک‌بار می‌لرزد؛ بی‌آن‌که صفحه را بیرون بیاورد، انگشت شستش را روی دکمه‌ای نگه می‌دارد.'
            : 'مرد نه تهدیدت را تأیید می‌کند و نه عقب می‌نشیند. وزن بدنش را روی پای عقب می‌اندازد و مسیر فرار را باز نگه می‌دارد: «تهدیدی که پشتش مدرک نیست فقط زمان صاحبش را می‌سوزاند.» پیش از برگشتن به سمت کوچه، نگاهش یک لحظه روی صورتت ثابت می‌ماند.',
          acceptedEffects: effects,
          isSuccess: true,
        };
      }
    }

    if (p === 'damage') {
      state.canonical.threat = Math.min(100, state.canonical.threat + 10);
      state.canonical.stress = Math.min(100, state.canonical.stress + 5);
      const panic = tickClock(state.clocks, 'npcPanic', 2, 'حملهٔ فیزیکی به فرد حاضر');
      state.clocks = panic.updatedClocks;
      const police = tickClock(state.clocks, 'policeAttention', 2, 'درگیری فیزیکی در کافه');
      state.clocks = police.updatedClocks;
      effects.push({ type: 'modify_clock', clock: 'npcPanic', delta: 2, reason: 'حملهٔ فیزیکی به فرد حاضر' });
      effects.push({ type: 'modify_clock', clock: 'policeAttention', delta: 2, reason: 'درگیری فیزیکی در کافه' });
      const flag = matchedNpc === 'exiting_man' ? 'attacked_exiting_man' : 'assaulted_staff';
      if (!state.canonical.canonicalFlags.includes(flag)) state.canonical.canonicalFlags.push(flag);
      effects.push({ type: 'set_flag', flag, value: true });
      return {
        narrative: matchedNpc === 'exiting_man'
          ? 'مشتت هنوز کامل باز نشده که مرد مچت را منحرف می‌کند و با یک چرخش کوتاه از خط حمله بیرون می‌رود. ضربه به هدف نمی‌خورد؛ او فاصله می‌گیرد و شمارهٔ پلاکی را زیر لب تکرار می‌کند، انگار هویتت حالا بخشی از گزارش اوست.'
          : `${INITIAL_NPC_GOAL_PROFILES[matchedNpc]?.nameFa ?? 'طرف مقابل'} از مسیر ضربه کنار می‌رود و صدای برخورد صندلی‌ها سالن را پر می‌کند. مانی میان شما می‌ایستد و یاشین دستش را سمت تلفن می‌برد؛ انگشتش روی شماره‌گیر آماده می‌ماند.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }

    const reaction = evaluateNpcReaction(matchedNpc, p, targetKey, method, state);
    if (reaction.trustDelta !== 0) {
      state.npcTrust[matchedNpc] = (state.npcTrust[matchedNpc] ?? 0) + reaction.trustDelta;
      effects.push({ type: 'modify_trust', npcId: matchedNpc, delta: reaction.trustDelta });
    }

    if (reaction.suspicionDelta > 0) {
      state.npcPressure[matchedNpc] = (state.npcPressure[matchedNpc] ?? 0) + 1;
      effects.push({ type: 'modify_pressure', npcId: matchedNpc, delta: 1 });
    }

    if (reaction.clockDelta) {
      const res = tickClock(state.clocks, reaction.clockDelta.clock, reaction.clockDelta.delta, 'واکنش اجتماعی NPC');
      state.clocks = res.updatedClocks;
      effects.push({ type: 'modify_clock', clock: reaction.clockDelta.clock, delta: reaction.clockDelta.delta, reason: 'واکنش اجتماعی NPC' });
    }

    if (
      matchedNpc === 'collector' &&
      p === 'give' &&
      !state.canonical.canonicalFlags.includes('collector_evidence_given')
    ) {
      if (!state.proofDomains) {
        state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
      }
      state.proofDomains = addProofPoints(state.proofDomains, 'SOCIAL', 1);
      effects.push({ type: 'add_proof_domain', domain: 'SOCIAL', points: 1 });
      state.canonical.canonicalFlags.push('collector_evidence_given');
      effects.push({ type: 'set_flag', flag: 'collector_evidence_given', value: true });
    }

    for (const factId of reaction.revealedFactIds ?? []) {
      if (!state.canonical.evidenceIds.includes(factId)) {
        state.canonical.evidenceIds.push(factId);
        effects.push({ type: 'add_evidence', evidenceId: factId });
      }
      if (!state.scene.establishedFactIds.includes(factId)) {
        state.scene.establishedFactIds.push(factId);
      }
    }
    if ((reaction.proofPoints ?? 0) > 0) {
      if (!state.proofDomains) {
        state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
      }
      state.proofDomains = addProofPoints(state.proofDomains, 'SOCIAL', reaction.proofPoints ?? 0);
      effects.push({ type: 'add_proof_domain', domain: 'SOCIAL', points: reaction.proofPoints ?? 0 });
    }
    for (const flag of reaction.setFlags ?? []) {
      if (!state.canonical.canonicalFlags.includes(flag)) {
        state.canonical.canonicalFlags.push(flag);
        effects.push({ type: 'set_flag', flag, value: true });
      }
    }

    return {
      narrative: reaction.responseProse,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // A door connects its two adjacent scenes. Closing it from just inside the
  // cafe must not fail merely because the object's anchor is scene_entrance.
  if (p === 'use' && targetObj?.id === 'cafe_door' && /باز|بند|بسته/.test(method)) {
    const closing = /بند|بسته/.test(method) && !/باز/.test(method);
    targetObj.state.isOpen = !closing;
    state.environmentState.entranceDoorOpen = !closing;
    effects.push({ type: 'modify_environment', key: 'entranceDoorOpen', value: !closing });
    return {
      narrative: closing
        ? 'درِ شیشه‌ای را آرام پشت سرت می‌بندی. صدای باران ضعیف‌تر می‌شود، اما قفل را نمی‌اندازی و راه خروج همچنان باز است.'
        : 'درِ شیشه‌ای را باز می‌کنی. هوای سرد و صدای باران برای لحظه‌ای وارد سالن می‌شود و مسیر رفت‌وآمد باز می‌ماند.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (
    targetObj?.inspectionProfile &&
    !['follow', 'move'].includes(p) &&
    !isWorldObjectAccessible(targetObj, state)
  ) {
    return {
      narrative: targetObj.inspectionProfile.inaccessibleObservation ?? 'این شیء در موقعیت فعلی در دسترس یا در میدان دید دقیق تو نیست؛ اول باید به محل آن بروی.',
      acceptedEffects: [],
      isSuccess: false,
      reasonIfFailed: 'object_out_of_reach',
    };
  }

  // Authored object profiles are the single source of truth for inspection.
  // This also covers direct calls from the multi-action engine, preventing the
  // legacy solver branches below from bypassing discovery gates.
  if (targetObj && ['inspect', 'smell', 'take'].includes(p) && targetObj.inspectionProfile) {
    const inspection = resolveLayeredInspection(targetObj, action, state);
    effects.push(...inspection.effects);

    if (p === 'take' && inspection.accessible && targetObj.properties.includes('movable')) {
      const inventoryId = targetObj.id === 'wet_receipt'
        ? 'item_wet_receipt'
        : targetObj.id === 'table5_cup'
          ? 'item_sample_cup'
          : targetObj.id;
      if (!state.canonical.inventoryIds.includes(inventoryId)) {
        state.canonical.inventoryIds.push(inventoryId);
        effects.push({ type: 'add_inventory', itemId: inventoryId });
        targetObj.state.location = 'in_bag';
        if (!/برمی‌?دار|داخل\s*(?:کیف|جیب)|درون\s*(?:کیف|جیب)/.test(inspection.narrative)) {
          inspection.narrative = `${inspection.narrative}\n\n${targetObj.nameFa} را از جای خود برمی‌داری و در کیفت می‌گذاری. شیء همراه توست و دیگر در محل قبلی دیده نمی‌شود.`;
        }
      }
    }

    return {
      narrative: inspection.narrative,
      acceptedEffects: effects,
      isSuccess: inspection.accessible,
      reasonIfFailed: inspection.accessible ? undefined : 'object_out_of_reach',
    };
  }

  if (p === 'touch' && targetObj) {
    if (targetObj.id === 'cat_penti') {
      const firstComfort = !state.canonical.canonicalFlags.includes('penti_comforted');
      if (firstComfort) {
        state.canonical.canonicalFlags.push('penti_comforted');
        effects.push({ type: 'set_flag', flag: 'penti_comforted', value: true });
        if (state.scene.activeEntityIds.includes('haniyeh')) {
          state.npcTrust.haniyeh = (state.npcTrust.haniyeh ?? 0) + 1;
          effects.push({ type: 'modify_trust', npcId: 'haniyeh', delta: 1 });
        }
      }
      return {
        narrative: 'آرام کنار صندلی زانو می‌زنی و پشت گردن پنتی را نوازش می‌کنی. برای لحظه‌ای خودش را به انگشت‌هایت تکیه می‌دهد، اما گوش‌هایش با نزدیک شدن فنجان دوباره عقب می‌روند. حانیه این احتیاطت را می‌بیند.',
        acceptedEffects: effects,
        isSuccess: true,
      };
    }

    return {
      narrative: `دستت را با احتیاط روی ${targetObj.nameFa} می‌گذاری. دما، زبری سطح و مقدار حرکتی که زیر فشار انگشت دارد حالا برایت روشن است.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && targetObj?.id === 'wooden_chair' && /شین|نشین/.test(method)) {
    state.environmentState.playerPosture = 'seated_at_table5';
    effects.push({ type: 'modify_environment', key: 'playerPosture', value: 'seated_at_table5' });
    return {
      narrative: 'صندلی چوبی را کمی عقب می‌کشی و کنار میز پنج می‌نشینی. حالا لبهٔ فنجان، دست‌های حانیه و واکنش پنتی هم‌زمان در میدان دیدت‌اند؛ در عوض راه خروج پشت شانه‌ات می‌افتد و حانیه برای حرف‌زدن ناچار نیست صدایش را بلند کند.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // Manipulating familiar scenery changes the world without manufacturing a
  // clue. These branches describe observable physics and preserve uncertainty.
  if (['use', 'move'].includes(p) && targetObj?.id === 'curtain' && /پرده|دید.*کوچه|می‌?کشم/.test(method)) {
    const closing = /کامل|بسته|کور|می‌?کشم/.test(method) && !/باز\s*می‌?کن/.test(method);
    targetObj.state.isOpen = !closing;
    if (!targetObj.state.customAttributes) targetObj.state.customAttributes = {};
    targetObj.state.customAttributes.coverage = closing ? 'closed' : 'open';
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.curtain = closing ? 'closed_over_window' : 'opened_from_window';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: closing
        ? 'پردهٔ سنگین را روی ریل تا انتها می‌کشی. بازتاب کوچه و دید مستقیم از بیرون قطع می‌شود؛ در عوض خودت هم دیگر خیابان و خودروی روبه‌رو را نمی‌بینی. صدای حلقه‌های فلزی چند نگاه را به پنجره می‌کشاند.'
        : 'پرده را کنار می‌زنی و شیشهٔ باران‌خورده دوباره پیدا می‌شود. میدان دید دوطرفه باز می‌گردد؛ هر کس بیرون باشد نیز روشنایی داخل را بهتر می‌بیند.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && targetObj?.id === 'pos_terminal' && /روشنایی|نور.*نمایشگر|دکمه.*کنار|کم\s*می‌?کن/.test(method)) {
    if (!targetObj.state.customAttributes) targetObj.state.customAttributes = {};
    targetObj.state.customAttributes.displayBrightness = 'dim';
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.pos_terminal = 'display_dimmed';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'با دکمهٔ کناری، نور نمایشگر پوز را پایین می‌آوری. ارقام هنوز از روبه‌رو خوانا هستند اما انعکاس صفحه روی شیشه و صورت آدم‌های پشت کانتر ضعیف‌تر می‌شود؛ داده‌ای در صندوق تغییر نکرده است.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && /(?:پسورد|رمز).*(?:حدس|امتحان)|(?:حدس|امتحان).*(?:پسورد|رمز)/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects[targetObj?.id ?? 'security_login'] = 'one_failed_login_attempt';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'یک ترکیب را امتحان می‌کنی. سامانه آن را رد می‌کند و شمارندهٔ تلاش ناموفق از صفر به یک می‌رود؛ حدس کور نه دسترسی می‌دهد و نه رمز واقعی را لو می‌دهد، و تکرارش می‌تواند حساب را موقتاً قفل کند.',
      acceptedEffects: effects,
      isSuccess: false,
      reasonIfFailed: 'credential_guess_failed',
    };
  }

  if (['use', 'take', 'touch'].includes(p) && targetObj?.id === 'painting_back_label' && /جدا|کندن|بکن|یک‌?تکه/.test(method)) {
    return {
      narrative: 'کاغذ و چسبِ پیرِ برچسب به الیاف پشت بوم جوش خورده‌اند. گوشه‌ای که می‌گیری فوراً ریش‌ریش می‌شود؛ ادامه دادن بدون کاردک و تثبیت‌کننده نوشته را نابود می‌کند، پس برچسب یک‌تکه جدا نمی‌شود.',
      acceptedEffects: [],
      isSuccess: false,
      reasonIfFailed: 'fragile_label_requires_tools',
    };
  }

  if (p === 'use' && targetObj?.id === 'table5_saucer' && /جلوی\s*نور|بازتاب|روی\s*دیوار/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.table5_saucer = 'used_as_light_reflector';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'نعلبکی را جلوی چراغ می‌چرخانی. لعاب سفید یک لکهٔ نور کدر روی دیوار می‌اندازد و رد قرمز در آن کشیده و کم‌رنگ می‌شود؛ این بازتاب شکل لکه را بزرگ می‌کند، اما جنس یا منشأ آن را ثابت نمی‌کند.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && targetObj?.id === 'table5_saucer' && /خراش|لبه.*(?:فیش|رسید|کاغذ)/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.table5_saucer = 'paper_edge_tested_on_stain';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'لبهٔ فیش را روی بخش کوچکی از لکه می‌کشی. کاغذ نم‌خورده پیش از لکه خم و ریش‌ریش می‌شود و فقط گرد بسیار کمی روی لبه‌اش می‌ماند؛ با این ابزار نمی‌توانی میان رنگ، جوهر یا لعاب فرق قطعی بگذاری.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && /لیوان.*(?:مرتب|ردیف|می‌?چین)/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.counter_cups = 'aligned_in_one_row';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'لیوان‌های یک‌بارمصرف را از دسته‌های نامنظم جدا می‌کنی و در یک ردیف روی کانتر می‌چینی. فضای کار مرتب‌تر می‌شود، اما مانی با ابروی بالا آمده جابه‌جایی وسایل محدودهٔ کارش را زیر نظر می‌گیرد.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && /پادری/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.entrance_doormat = 'flattened';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'گوشهٔ تاخوردهٔ پادری را با کف پا صاف می‌کنی. آب جمع‌شده زیر آن به شکل هلال باریکی بیرون می‌زند و مسیر ورودی هموار می‌شود؛ چیزی پنهان زیر پادری نیست.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && /شیر\s*آب|سینک/.test(method) && /باز/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects.counter_sink = 'tap_running';
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'شیر سینک را باز می‌کنی. صدای پیوستهٔ آب بخشی از زمزمه‌های سالن را می‌پوشاند و مانی فوراً متوجه مصرف بی‌دلیل آب می‌شود؛ این پوشش صوتی واقعی است، اما نامرئی نیست.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2. Physical & Spatial Interactions with Objects
  // 2a. Attempting action on heavy / immovable target
  if ((p === 'move' || p === 'take') && targetObj && (targetObj.properties.includes('immovable') || targetObj.properties.includes('heavy')) && !targetKey.includes('door') && !targetKey.includes('behind')) {
    return {
      narrative: `${targetObj.nameFa} بیش از حد سنگین و به زمین یا پیشخوان متصل است؛ بلند کردن یا جابه‌جا کردن آن ممکن نیست.`,
      acceptedEffects: [],
      isSuccess: false,
      reasonIfFailed: 'object_immovable',
    };
  }

  // 2b. Attempting to open locked container
  if ((p === 'use' || p === 'take' || method.includes('باز')) && targetObj && targetObj.properties.includes('lockable') && targetObj.state.isLocked) {
    return {
      narrative: `${targetObj.nameFa} با یک قفل برنجی محکم بسته شده و بدون کلید باز نمی‌شود.`,
      acceptedEffects: [],
      isSuccess: false,
      reasonIfFailed: 'object_locked',
    };
  }

  // 2c. Inspecting living entities (Cat Penti)
  if (
    ['inspect', 'touch'].includes(p) &&
    (targetKey.includes('penti') || targetKey.includes('cat') || method.includes('پنتی') || method.includes('گربه'))
  ) {
    if (!state.canonical.evidenceIds.includes('fact_penti_agitation')) {
      state.canonical.evidenceIds.push('fact_penti_agitation');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_penti_agitation' });
    }
    return {
      narrative: `پنتی زیر صندلی کز کرده، گوش‌هایش عقب رفته و با چشمانی گرد و مضطرب از میز پنج و فنجان قهوه فاصله گرفته است.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2d. Inspecting / Examining Office Ledger and Financial Invoices
  if (targetKey.includes('ledger') || method.includes('زونکن') || method.includes('اسناد') || method.includes('دفتر.*حسابداری') || (method.includes('فاکتور') && !method.includes('رسید.*خیس'))) {
    if (!state.canonical.evidenceIds.includes('fact_ledger_workshop_seal')) {
      state.canonical.evidenceIds.push('fact_ledger_workshop_seal');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_ledger_workshop_seal' });
    }
    if (!state.proofDomains) {
      state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
    }
    state.proofDomains = addProofPoints(state.proofDomains, 'SYS', 2);
    effects.push({ type: 'add_proof_domain', domain: 'SYS', points: 2 });
    return {
      narrative: `زونکن خاکستری اسناد را روی میز سالار باز می‌کنی. فاکتور مربوط به پلاک ۵۵ و بستهٔ سفارشی دارای مهری با چهار نماد است: دست، پنجره، فنجان و سایه.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // A movable prop can be repositioned inside the current scene even when the
  // sentence also names its source table. Object-manipulation verbs win over
  // room aliases; otherwise «منو را از میز پنج منتقل می‌کنم» teleports the
  // player to table five and leaves the menu untouched.
  if (
    p === 'move' &&
    targetObj?.properties.includes('movable') &&
    /منتقل|جابه‌?جا|هل|پرت|سُر|می‌?کشم|بکشم|می‌?برم/.test(method)
  ) {
    const placement = /میز\s*(?:شماره\s*)?(۱|1|یک)/.test(method)
      ? 'table_1'
      : /کنار\s*در|جلوی\s*در/.test(method)
        ? 'near_entrance'
        : 'repositioned_in_scene';
    if (!targetObj.state.customAttributes) targetObj.state.customAttributes = {};
    targetObj.state.customAttributes.placement = placement;
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects[targetObj.id] = `moved:${placement}`;
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    const destination = placement === 'table_1' ? 'روی میز شمارهٔ ۱' : 'در جای تازه‌ای در همین صحنه';
    return {
      narrative: `${targetObj.nameFa} را برمی‌داری و ${destination} می‌گذاری. جای قبلی‌اش خالی می‌ماند و آدم‌های حاضر مسیر دستت را دنبال می‌کنند.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2e. Spatial Movement (Move / Walk to areas)
  if (p === 'move') {
    if (targetKey.includes('gallery') || method.includes('گالری') || method.includes('تابلو') || method.includes('نقاشی')) {
      effects.push({ type: 'change_scene', sceneId: 'scene_gallery', nodeId: 'NODE_06' });
      return {
        narrative: `به سمت انتهای سالن و دیوار گالری حرکت می‌کنی. تابلوی نقاشی پنتیمنتو در پرتو ملایم هالوژن‌های دیواری در برابرت قرار می‌گیرد.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }
    if (targetKey.includes('office') || method.includes('دفتر') || method.includes('حسابداری') || method.includes('سالار')) {
      effects.push({ type: 'change_scene', sceneId: 'scene_office', nodeId: 'NODE_11' });
      return {
        narrative: `وارد اتاق حسابداری می‌شوی. سالار صالحی پشت میز کار چوبی نشسته و با نگاهی نگران به ورودت چشم می‌دوزد.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }
    if (targetKey !== 'behind_counter' && !/پشت.*(کانتر|بار)/.test(method) && (targetKey.includes('counter') || method.includes('کانتر') || method.includes('پیشخوان'))) {
      effects.push({ type: 'change_scene', sceneId: 'scene_counter', nodeId: 'NODE_03' });
      return {
        narrative: `کنار پیشخوان چوبی صیقلی کافه می‌ایستی. یاشین با پیراهن آراسته و مانی پشت دستگاه اسپرسو متوجه حضورت می‌شوند.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }
    if (targetKey.includes('table5') || method.includes('میز ۵') || method.includes('میز پنج')) {
      effects.push({ type: 'change_scene', sceneId: 'scene_table5', nodeId: 'NODE_02' });
      return {
        narrative: `به سمت میز شماره ۵ بازمی‌گردی. فنجان رهاشده و نعلبکی سرامیکی همچنان روی میز قرار دارند.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }
  }

  // Movable props also accept novel repositioning language with no named
  // source/destination alias.
  if (p === 'move' && targetObj?.properties.includes('movable')) {
    const placement = /میز\s*(?:شماره\s*)?(۱|1|یک)/.test(method)
      ? 'table_1'
      : /کنار\s*در|جلوی\s*در/.test(method)
        ? 'near_entrance'
        : 'repositioned_in_scene';
    if (!targetObj.state.customAttributes) targetObj.state.customAttributes = {};
    targetObj.state.customAttributes.placement = placement;
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects[targetObj.id] = `moved:${placement}`;
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    const destination = placement === 'table_1' ? 'روی میز شمارهٔ ۱' : 'در جای تازه‌ای در همین صحنه';
    return {
      narrative: `${targetObj.nameFa} را برمی‌داری و ${destination} می‌گذاری. جای قبلی‌اش خالی می‌ماند و آدم‌های حاضر مسیر دستت را دنبال می‌کنند.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2f. Smelling or Tasting Cup Chemical (Generic Chemical Affordance)
  if ((p === 'smell' || p === 'taste' || method.includes('بو')) && (targetKey.includes('cup') || targetKey.includes('فنجان') || method.includes('فنجان'))) {
    if (!state.canonical.evidenceIds.includes('fact_solvent_smell_cup')) {
      state.canonical.evidenceIds.push('fact_solvent_smell_cup');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_solvent_smell_cup' });
    }
    if (!state.proofDomains) {
      state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
    }
    state.proofDomains = addProofPoints(state.proofDomains, 'CHEM', 2);
    effects.push({ type: 'add_proof_domain', domain: 'CHEM', points: 2 });
    return {
      narrative: `فنجان را با احتیاط بالا می‌آوری و بو می‌کنی. بوی تند و نفتی یک حلال شیمیایی فرّار مشامت را می‌زند؛ ماده‌ای که برای پاک کردن رنگ یا محو کردن اثر انگشت به کار می‌رود.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2g. Packing / Sampling Cup (Generic Container Affordance)
  if (p === 'take' && (targetKey.includes('cup') || targetKey.includes('فنجان') || method.includes('کیف'))) {
    if (!state.canonical.inventoryIds.includes('item_sample_cup')) {
      state.canonical.inventoryIds.push('item_sample_cup');
      effects.push({ type: 'add_inventory', itemId: 'item_sample_cup' });
    }
    if (!state.canonical.evidenceIds.includes('fact_solvent_smell_cup')) {
      state.canonical.evidenceIds.push('fact_solvent_smell_cup');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_solvent_smell_cup' });
    }
    return {
      narrative: `فنجان را با احتیاط از روی میز برمی‌داری و درون کیفت قرار می‌دهی تا نمونه مایع برای آزمایش حفظ شود.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2h. Inspecting Painting Surface & Underpainting (Generic Art Affordance)
  if (p === 'inspect' && (targetKey.includes('painting') || targetKey.includes('تابلو') || method.includes('بوم') || method.includes('نور'))) {
    if (!state.canonical.evidenceIds.includes('fact_underpainting_hidden_layer')) {
      state.canonical.evidenceIds.push('fact_underpainting_hidden_layer');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_underpainting_hidden_layer' });
    }
    if (!state.proofDomains) {
      state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
    }
    state.proofDomains = addProofPoints(state.proofDomains, 'ART', 2);
    effects.push({ type: 'add_proof_domain', domain: 'ART', points: 2 });
    return {
      narrative: `روبروی تابلوی دیواری می‌ایستی و نور زاویه‌دار به سطح بوم می‌تابانی. زیر لایهٔ شفاف روغن، بافت برجسته‌ای از یک لایهٔ مخفی کهن (Pentimento) آشکار می‌شود.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2i. Taking or Examining Wet Receipt from Entrance
  if ((p === 'take' || p === 'inspect') && (targetKey === 'wet_receipt' || method.includes('رسید.*خیس') || method.includes('سنگ‌فرش'))) {
    if (!state.canonical.inventoryIds.includes('item_wet_receipt')) {
      state.canonical.inventoryIds.push('item_wet_receipt');
      effects.push({ type: 'add_inventory', itemId: 'item_wet_receipt' });
    }
    if (!state.canonical.evidenceIds.includes('fact_wet_receipt')) {
      state.canonical.evidenceIds.push('fact_wet_receipt');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_wet_receipt' });
    }
    return {
      narrative: `روی سنگ‌فرش سرد کوچه خم می‌شوی و برگهٔ کاغذی خیس را برمی‌داری. یک فیش سفارش با مبلغ و ساعت دقیق ۰۰:۱۷ است که گوشه‌اش لکهٔ جوهر عجیبی دارد.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2f. Blocking door / corridor with movable object (Generic Affordance)
  if (p === 'block' || (p === 'move' && (secTargetKey.includes('door') || method.includes('در') || method.includes('ورود') || method.includes('مدخل')))) {
    const obstacle = targetObj || secObj;
    state.environmentState.doorBlocked = true;
    effects.push({ type: 'modify_environment', key: 'doorBlocked', value: true });

    const tick = tickClock(state.clocks, 'npcPanic', 1, 'مسدودسازی فیزیکی راه خروج');
    state.clocks = tick.updatedClocks;
    effects.push({ type: 'modify_clock', clock: 'npcPanic', delta: 1, reason: 'مسدودسازی فیزیکی راه خروج' });

    const objName = obstacle ? obstacle.nameFa : 'صندلی سنگین';
    return {
      narrative: `${objName} را با صدای خراش تندی روی زمین می‌کشی و جلوی در قرار می‌دهی.
مانی دستمالش را روی کانتر رها می‌کند و یاشین با تعجب به این مانع‌تراشی ناگهانی نگاه می‌کند.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2g. Toggling electrical / lights
  if (p === 'use' && (targetKey.includes('light') || method.includes('برق') || method.includes('چراغ') || method.includes('خاموش') || method.includes('نوری.*صفر')) && !method.includes('پنجره')) {
    const isOff = !state.environmentState.lightsOff;
    state.environmentState.lightsOff = isOff;
    effects.push({ type: 'modify_environment', key: 'lightsOff', value: isOff });

    if (isOff) {
      const tick = tickClock(state.clocks, 'npcPanic', 1, 'خاموش شدن ناگهانی برق سالن');
      state.clocks = tick.updatedClocks;
      effects.push({ type: 'modify_clock', clock: 'npcPanic', delta: 1, reason: 'خاموش شدن ناگهانی برق سالن' });
      return {
        narrative: `کلید برق را می‌زنی. لوسترهای گرم سالن خاموش می‌شوند و تاریکی همراه با بازتاب نور خیابان فضا را پر می‌کند.
صدای اعتراض مانی از پشت بار بلند می‌شود: «کی دست زد به فیوز؟»`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    } else {
      return {
        narrative: `کلید برق را دوباره می‌زنی و روشنایی آرام سالن بازمی‌گردد.`,
        acceptedEffects: effects,
        isSuccess: true,
      };
    }
  }

  // 2h. Inspecting Window / Outside Surveillance
  if (p === 'inspect' && (targetKey.includes('window') || method.includes('پنجره'))) {
    if (!state.canonical.evidenceIds.includes('fact_parked_car_sighting')) {
      state.canonical.evidenceIds.push('fact_parked_car_sighting');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_parked_car_sighting' });
    }
    if (!state.proofDomains) {
      state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
    }
    state.proofDomains = addProofPoints(state.proofDomains, 'SYS', 1);
    effects.push({ type: 'add_proof_domain', domain: 'SYS', points: 1 });
    return {
      narrative: `روبروی شیشهٔ پنجره قدی رو به کوچه حسینی می‌ایستی. در تاریکی کوچه، سایهٔ یک خودروی سواری ناشناس با چراغ‌های خاموش دیده می‌شود که گویی کوچه را زیر نظر دارد.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2i. Locking Door
  if (p === 'lock' || method.includes('قفل')) {
    state.environmentState.doorBlocked = true;
    effects.push({ type: 'modify_environment', key: 'doorBlocked', value: true });
    return {
      narrative: `چفت زبانهٔ در ورودی را می‌اندازی. قفل برنجی با صدایی نرم بسته می‌شود و جریان هوای سرد کوچه قطع می‌گردد.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2j. Trespassing Behind Counter
  if (p === 'move' && (targetKey === 'behind_counter' || method.includes('پشت کانتر') || method.includes('پشت بار'))) {
    state.npcTrust.mani = (state.npcTrust.mani ?? 0) - 1;
    state.npcTrust.yashin = (state.npcTrust.yashin ?? 0) - 1;
    effects.push({ type: 'modify_trust', npcId: 'mani', delta: -1 });
    effects.push({ type: 'modify_trust', npcId: 'yashin', delta: -1 });
    return {
      narrative: `بدون اجازه از مرز پیشخوان عبور می‌کنی و پا به محدودهٔ کار باریستا می‌گذاری.
مانی دستمالش را روی سینک می‌کوبد و یاشین با لحنی هشداردهنده می‌گوید: «رفیق، ورود به پشت بار ممنوعه!»`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2k. Hiding object under/behind another object (Generic Containment)
  if (p === 'hide' || (p === 'take' && method.includes('زیر'))) {
    if (!targetObj) {
      return {
        narrative: 'محل پنهان‌کردن را می‌فهمم، اما شیئی که باید آنجا بماند در جمله یا دست تو مشخص نیست. جهان چیزی را از خودش انتخاب و جابه‌جا نمی‌کند.',
        acceptedEffects: [],
        isSuccess: false,
        reasonIfFailed: 'hide_item_ambiguous',
      };
    }
    if (!state.environmentState.hiddenItems) {
      state.environmentState.hiddenItems = {};
    }
    const hiddenId = targetObj.id === 'wet_receipt' ? 'item_wet_receipt' : targetObj.id;
    const hideSpotId = secObj?.id ?? (
      secTargetKey === 'under_table5' || /زیر.*میز\s*(?:۵|5|پنج)/.test(method)
        ? 'under_table5'
        : /منو/.test(method)
          ? 'table5_menu'
          : /نعلبکی|فنجان/.test(method)
            ? 'table5_saucer'
            : 'concealed_in_current_scene'
    );
    state.environmentState.hiddenItems[hiddenId] = hideSpotId;
    if (!targetObj.state.customAttributes) targetObj.state.customAttributes = {};
    targetObj.state.customAttributes.hiddenAt = hideSpotId;
    targetObj.state.location = state.canonical.currentScene || state.scene.sceneId;
    effects.push({ type: 'modify_environment', key: 'hiddenItems', value: state.environmentState.hiddenItems });

    const hideSpotName = secObj?.nameFa ?? (
      hideSpotId === 'under_table5'
        ? 'میز شمارهٔ ۵'
        : hideSpotId === 'table5_menu'
          ? 'پایهٔ منو'
          : hideSpotId === 'table5_saucer'
            ? 'نعلبکی'
            : 'نقطه‌ای دور از دید مستقیم'
    );
    return {
      narrative: `${targetObj.nameFa} را زیر ${hideSpotName} می‌گذاری. از خط دید معمول پنهان می‌شود، اما جابه‌جایی‌اش واقعی است: اگر کسی محل قبلی را بررسی کند یا زیر آنجا را ببیند، می‌تواند پیدایش کند.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // Generic concrete use: persist the manipulation itself, not an invented
  // discovery or guaranteed social outcome. Specific devices and props are
  // handled above; this is the affordance-level safety net for novel methods.
  if (p === 'use' && targetObj) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    state.environmentState.modifiedObjects[targetObj.id] = `used:${method.slice(0, 100)}`;
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: `از ${targetObj.nameFa} به روشی که توصیف کرده‌ای استفاده می‌کنی. وضعیت و جای تماس روی همان شیء باقی می‌ماند و افراد نزدیک می‌توانند حرکتت را ببینند؛ نتیجه‌ای فراتر از اثر فیزیکی این کار بدون شاهد یا آزمایش ساخته نمی‌شود.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  if (p === 'use' && /مرتب|می‌?چین|صاف\s*می‌?کن|تنظیم\s*می‌?کن|باز\s*می‌?کن/.test(method)) {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    const sceneKey = `scene_setup:${state.canonical.currentScene || state.scene.sceneId}`;
    state.environmentState.modifiedObjects[sceneKey] = method.slice(0, 120);
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });
    return {
      narrative: 'تغییر فیزیکی را همان‌طور که گفتی در صحنه انجام می‌دهی. چیدمان تازه باقی می‌ماند و ممکن است روی دید، صدا یا واکنش بعدی اثر بگذارد؛ اما خودش مدرک یا موفقیت پنهانی تضمین‌شده نمی‌سازد.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2l. Damaging or tearing an object (Generic Degradation).  Damage is
  // applied to the grounded target; an ambiguous punch can no longer tear the
  // wet receipt by accident.
  if (p === 'damage' || method.includes('پاره') || method.includes('خیس')) {
    if (!targetObj) {
      return {
        narrative: 'حرکت تهاجمی را شروع می‌کنی، اما هدف روشنی برای آن مشخص نشده است. در این شلوغی جهان به‌جای تو انتخاب نمی‌کند که چه کسی یا چه چیزی ضربه بخورد.',
        acceptedEffects: [],
        isSuccess: false,
        reasonIfFailed: 'damage_target_ambiguous',
      };
    }

    if (targetObj.properties.includes('living')) {
      const panic = tickClock(state.clocks, 'npcPanic', 2, 'تلاش برای آسیب زدن به موجود زنده');
      state.clocks = panic.updatedClocks;
      const police = tickClock(state.clocks, 'policeAttention', 2, 'خشونت در سالن کافه');
      state.clocks = police.updatedClocks;
      effects.push({ type: 'modify_clock', clock: 'npcPanic', delta: 2, reason: 'تلاش برای آسیب زدن به موجود زنده' });
      effects.push({ type: 'modify_clock', clock: 'policeAttention', delta: 2, reason: 'خشونت در سالن کافه' });
      const flag = targetObj.id === 'cat_penti' ? 'attempted_harm_to_penti' : 'attacked_living_target';
      if (!state.canonical.canonicalFlags.includes(flag)) state.canonical.canonicalFlags.push(flag);
      effects.push({ type: 'set_flag', flag, value: true });
      return {
        narrative: targetObj.id === 'cat_penti'
          ? 'پیش از آن‌که دستت به پنتی برسد، حانیه او را بغل می‌کند و مانی بازویت را عقب می‌کشد. آسیبی به گربه نمی‌رسد، اما امنیت جمع فرو می‌ریزد و یاشین شمارهٔ پلیس را آماده می‌کند.'
          : 'هدف زنده از مسیر ضربه کنار می‌رود و آدم‌های حاضر میان شما فاصله می‌اندازند. یکی از صندلی‌ها روی کف کشیده می‌شود و چند دست آمادهٔ مهارکردنت بالا می‌آید.',
        acceptedEffects: effects,
        isSuccess: true,
      };
    }

    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    const targetId = targetObj.id === 'wet_receipt' ? 'item_wet_receipt' : targetObj.id;
    const stateKey = method.includes('پاره')
      ? 'torn'
      : method.includes('خیس')
        ? 'soaked'
        : method.includes('سوز')
          ? 'burned'
          : 'damaged';
    state.environmentState.modifiedObjects[targetId] = stateKey;
    targetObj.state.isDamaged = true;
    if (typeof targetObj.state.durability === 'number') {
      targetObj.state.durability = Math.max(0, targetObj.state.durability - 35);
    }
    effects.push({ type: 'modify_environment', key: 'modifiedObjects', value: state.environmentState.modifiedObjects });

    if (targetObj.properties.includes('readable') || targetObj.properties.includes('layered')) {
      const tick = tickClock(state.clocks, 'evidenceRemoval', 1, 'تغییر فیزیکی یا تخریب ساختار مدرک');
      state.clocks = tick.updatedClocks;
      effects.push({ type: 'modify_clock', clock: 'evidenceRemoval', delta: 1, reason: 'تغییر فیزیکی مدرک' });
    }

    return {
      narrative: targetObj.id === 'wet_receipt'
        ? 'ساختار کاغذ رسید تغییر می‌کند؛ الیاف و بخشی از نوشته مخدوش می‌شوند، اما اثر کم‌رنگ مهر هنوز کاملاً از بین نرفته است.'
        : `به ${targetObj.nameFa} آسیب می‌زنی. تغییر روی خود شیء باقی می‌ماند و هر اطلاعات یا رابطه‌ای که به آن وابسته بود از این پس با همین خسارت ادامه پیدا می‌کند.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2g. Audio Recording
  if (p === 'record' || method.includes('ضبط') || method.includes('صدا')) {
    state.environmentState.recordingActive = true;
    effects.push({ type: 'modify_environment', key: 'recordingActive', value: true });
    return {
      narrative: 'ضبط صدای گوشی را فعال می‌کنی. موج سبز میکروفن با صدای باران، دستگاه قهوه و حرف‌های نزدیک تکان می‌خورد؛ صداهای دورتر در نویز سالن گم می‌شوند و فایل برای شنیدن دوباره باقی می‌ماند.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2h. Protecting an object/person/place creates a real preparation state.
  // It does not award a clue; the situation director decides whether that
  // preparation is enough when opposition acts.
  if (p === 'protect') {
    if (!state.environmentState.modifiedObjects) state.environmentState.modifiedObjects = {};
    const protectedId = targetObj?.id ?? (targetKey || 'current_scene');
    state.environmentState.modifiedObjects[`protected:${protectedId}`] = 'player_secured';
    effects.push({
      type: 'modify_environment',
      key: 'modifiedObjects',
      value: state.environmentState.modifiedObjects,
    });
    const targetLabel = targetObj?.nameFa ?? (targetKey || 'این بخش کافه');
    return {
      narrative: `برای محافظت از ${targetLabel} فقط اعلام آمادگی نمی‌کنی؛ جای ایستادن، راه نزدیک شدن و چیزی را که باید اول جابه‌جا شود مشخص می‌کنی. این موضع اگر خطری برسد، روی نتیجه اثر خواهد گذاشت.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2i. Public release is a strategic move with a persistent cost, not a
  // dialogue flourish. Preparing a copy is reversible; publishing is not.
  if (p === 'reveal') {
    state.environmentState.recordingActive = true;
    effects.push({ type: 'modify_environment', key: 'recordingActive', value: true });
    const isActuallyPublished = /منتشر|آپلود|لایو|عمومی.*می‌?کن|برای.*خبرنگار.*می‌?فرست/.test(method);
    const flag = isActuallyPublished ? 'leaked_evidence_publicly' : 'evidence_release_prepared';
    if (!state.canonical.canonicalFlags.includes(flag)) state.canonical.canonicalFlags.push(flag);
    effects.push({ type: 'set_flag', flag, value: true });
    return {
      narrative: isActuallyPublished
        ? 'نسخه‌ای از مدارک موجود را با زمان و منشأ فعلی منتشر می‌کنی. از این لحظه پاک کردن همهٔ نسخه‌ها دشوارتر است، اما روایت ناقص هم دیگر کاملاً تحت کنترل تو نیست.'
        : 'یک بستهٔ قابل‌انتشار از مدارک فعلی آماده و بیرون از دستگاه‌های کافه ذخیره می‌کنی. هنوز منتشر نشده؛ حالا افشا یک اهرم واقعی است که می‌توانی خرجش کنی.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2j. Following a moving threat changes the field of play. Failure later is
  // allowed, but the verb itself is never collapsed into a generic inspection.
  if (p === 'follow') {
    state.canonical.currentScene = 'scene_hosseini_alley';
    state.canonical.currentNode = 'NODE_13';
    state.scene.sceneId = 'scene_hosseini_alley';
    state.scene.nodeId = 'NODE_13';
    state.scene.activeEntityIds = [];
    state.scene.visibleObjectIds = [];
    effects.push({ type: 'change_scene', sceneId: 'scene_hosseini_alley', nodeId: 'NODE_13' });
    const tick = tickClock(state.clocks, 'personalRisk', 1, 'تعقیب هدف متحرک در کوچه');
    state.clocks = tick.updatedClocks;
    effects.push({ type: 'modify_clock', clock: 'personalRisk', delta: 1, reason: 'تعقیب هدف متحرک در کوچه' });
    return {
      narrative: 'فاصله را حفظ می‌کنی و به‌جای دویدن مستقیم، از بازتاب شیشه‌ها و صدای قدم‌ها برای دنبال کردن هدف در کوچه استفاده می‌کنی. کافه پشت سرت می‌ماند و خطر حالا در میدان بازتری حرکت می‌کند.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2k. A distraction becomes a stored setup which a later action or crisis can
  // consume. It is intentionally open-ended and does not dictate the player's plan.
  if (p === 'distract') {
    if (!state.environmentState.customDistractions) state.environmentState.customDistractions = [];
    state.environmentState.customDistractions.push(method.slice(0, 180));
    effects.push({
      type: 'modify_environment',
      key: 'customDistractions',
      value: state.environmentState.customDistractions,
    });
    return {
      narrative: 'حواس افراد حاضر را با روشی که انتخاب کرده‌ای از نقطهٔ اصلی منحرف می‌کنی. چند نگاه و بدن به سمت طعمه می‌چرخد؛ هنوز کسی صحنه را ترک نکرده و این مکث کوتاه می‌تواند هر لحظه تمام شود.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2l. Theft respects physical properties and leaves a social footprint.
  if (p === 'steal') {
    if (!targetObj || !targetObj.properties.includes('movable')) {
      return {
        narrative: 'هدفی که می‌خواهی بی‌سروصدا ببری یا مشخص نیست یا به‌سادگی قابل‌حمل نیست. تلاش را شروع می‌کنی، اما پیش از ساختن یک نتیجهٔ خیالی متوقف می‌شوی.',
        acceptedEffects: [],
        isSuccess: false,
        reasonIfFailed: 'target_not_stealable',
      };
    }
    const inventoryId = targetObj.id === 'wet_receipt' ? 'item_wet_receipt' : targetObj.id;
    if (!state.canonical.inventoryIds.includes(inventoryId)) state.canonical.inventoryIds.push(inventoryId);
    targetObj.state.location = 'in_bag';
    effects.push({ type: 'add_inventory', itemId: inventoryId });
    const panic = tickClock(state.clocks, 'npcPanic', 1, 'ناپدید شدن پنهانی یک شیء از صحنه');
    state.clocks = panic.updatedClocks;
    effects.push({ type: 'modify_clock', clock: 'npcPanic', delta: 1, reason: 'ناپدید شدن پنهانی یک شیء از صحنه' });
    return {
      narrative: `${targetObj.nameFa} را بی‌سروصدا از جای خود برمی‌داری و پنهان می‌کنی. فعلاً کسی مانعت نشده، اما خالی شدن محل آن می‌تواند بعداً اعتماد و رفتار آدم‌ها را تغییر دهد.`,
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2m. Open-ended preparations are accepted when the player describes a
  // concrete setup.  Unsupported declarations do not silently become success.
  if (p === 'improvise') {
    const hasConcreteSetup = /می‌?ساز|درست.*می‌?کن|ترکیب.*می‌?کن|تله|دام|طعمه|نقشه.*می‌?چین|نسخه.*می‌?گیر|بکاپ|پشتیبان/.test(method);
    if (hasConcreteSetup) {
      if (!state.environmentState.customDistractions) state.environmentState.customDistractions = [];
      state.environmentState.customDistractions.push(method.slice(0, 180));
      effects.push({
        type: 'modify_environment',
        key: 'customDistractions',
        value: state.environmentState.customDistractions,
      });
      return {
        narrative: 'طرحی که توصیف کرده‌ای را به یک آماده‌سازی واقعی تبدیل می‌کنی: ابزار، طعمه و نقطهٔ اجرای آن مشخص می‌شوند. هنوز معلوم نیست طرف مقابل گول می‌خورد؛ اما وقتی واکنش نشان دهد، این setup در محاسبهٔ نتیجه حضور دارد.',
        acceptedEffects: effects,
        isSuccess: true,
      };
    }
    return {
      narrative: 'نیتت قابل فهم است، اما هنوز کنش اجرایی روشنی ندارد. بگو از چه ابزار، شخص یا بخش صحنه استفاده می‌کنی تا جهان بتواند نتیجه و هزینه‌اش را تعیین کند.',
      acceptedEffects: [],
      isSuccess: false,
      reasonIfFailed: 'improvisation_needs_concrete_method',
    };
  }

  // 2n. Waiting in silence / observation
  if (p === 'wait' || method.includes('سکوت') || method.includes('صبر')) {
    if (/کنار.*(?:در|ورودی).*می‌?(?:ایستم|مانم)|راه.*خروج.*(?:می‌?پایم|زیر.*نظر)/.test(method)) {
      state.environmentState.guardingEntrance = true;
      effects.push({ type: 'modify_environment', key: 'guardingEntrance', value: true });
      return {
        narrative: 'کنار ورودی، جایی می‌ایستی که هم دستگیره و هم مسیر مستقیم تا گالری در دیدت باشد. راه را نبسته‌ای و کسی را زندانی نکرده‌ای؛ اما عبور بی‌صدا از این خط دیگر آسان نیست. جای‌گیری تو به یک آمادگی واقعی برای اتفاق بعدی تبدیل می‌شود.',
        acceptedEffects: effects,
        isSuccess: true,
      };
    }

    const canObserveVisitor =
      state.canonical.currentScene === 'scene_entrance' &&
      state.scene.activeEntityIds.includes('exiting_man');
    if (canObserveVisitor && !state.canonical.evidenceIds.includes('fact_guest_hesitation')) {
      state.canonical.evidenceIds.push('fact_guest_hesitation');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_guest_hesitation' });
    }
    return {
      narrative: canObserveVisitor
        ? 'چند ثانیه دخالت نمی‌کنی. مرد پیش از دور شدن یک بار وزن جیب داخلی پالتویش را می‌سنجد و نگاهش نه به فنجان، که به مسیر بازگشت تا کافه می‌افتد. مکث او مشاهده است، نه اعتراف.'
        : 'دقایقی در سکوت می‌ایستی و ریتم طبیعی محیط را تماشا می‌کنی. یاشین فنجان‌ها را جابه‌جا می‌کند، حانیه چند بار ساعت را نگاه می‌کند و بیرون از شیشه نور خودرویی یک‌بار روی دیوار می‌لغزد.',
      acceptedEffects: effects,
      isSuccess: true,
    };
  }

  // 2i. Default Grounded Diegetic Interaction
  const targetLabel = targetObj ? targetObj.nameFa : (targetKey || 'محیط اطراف');
  return {
    narrative: `با دقت ${targetLabel} را بررسی می‌کنی و وضعیت صحنه را زیر نظر می‌گیری. نشانه‌های کلیدی با دقت بیشتری در ذهنت ثبت می‌شوند.`,
    acceptedEffects: effects,
    isSuccess: true,
  };
}

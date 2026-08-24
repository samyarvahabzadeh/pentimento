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

  if (/ذهن.*(?:بخوان|می‌?خوان)|فکر(?:ش|شان).*بفهم|تلپورت|نامرئی.*(?:شوم|بشم)|پرواز.*(?:کنم|می‌?کنم)/.test(action.rawInput)) {
    return {
      narrative: 'این کنش در توان انسانی و قواعد این جهان نیست. نمی‌توانی ذهن کسی را مستقیم بخوانی؛ می‌توانی به مکث، جهت نگاه، تناقض حرف‌ها یا چیزی که از دستش پنهان می‌کند تکیه کنی.',
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
    if (matchedNpc === 'exiting_man') {
      if (p === 'ask' || p === 'persuade') {
        return {
          narrative: 'مرد پالتوپوش نیم‌قدم عقب می‌رود، طوری که نور کافه فقط لبهٔ دستکش را بگیرد: «اسم من چیزی را عوض نمی‌کند. اگر می‌خواهی بدانی چرا اینجا بودم، از کسی بپرس که حاضر شد چیزی را که مالش نبود پس بدهد.» بعد نگاه کوتاهی به رسید خیس می‌اندازد. او جواب کامل نداده؛ عمداً انتخاب بعدی را بین تعقیب و حفظ صحنه گذاشته است.',
          acceptedEffects: [],
          isSuccess: true,
        };
      }
      if (p === 'deceive' || p === 'threaten' || p === 'accuse') {
        const risk = tickClock(state.clocks, 'personalRisk', 1, 'رویارویی مستقیم با پیک دستکش قرمز');
        state.clocks = risk.updatedClocks;
        effects.push({ type: 'modify_clock', clock: 'personalRisk', delta: 1, reason: 'رویارویی مستقیم با پیک دستکش قرمز' });
        return {
          narrative: 'مرد نه ادعایت را تأیید می‌کند و نه عقب می‌نشیند. وزن بدنش را روی پای عقب می‌اندازد و مسیر فرار را باز نگه می‌دارد: «تهدیدی که پشتش مدرک نیست فقط زمان صاحبش را می‌سوزاند.» حالا می‌داند تو ممکن است وارد بازی شبکه شوی.',
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
          : `${INITIAL_NPC_GOAL_PROFILES[matchedNpc]?.nameFa ?? 'طرف مقابل'} از مسیر ضربه کنار می‌رود و صدای برخورد صندلی‌ها سالن را پر می‌کند. مانی میان شما می‌ایستد و یاشین دستش را سمت تلفن می‌برد. حمله بی‌پیامد یا پیروزی تضمینی نبود؛ صحنه اکنون در آستانهٔ مداخلهٔ پلیس است.`,
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
      }
    }

    return {
      narrative: inspection.narrative,
      acceptedEffects: effects,
      isSuccess: inspection.accessible,
      reasonIfFailed: inspection.accessible ? undefined : 'object_out_of_reach',
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
    if (!state.environmentState.hiddenItems) {
      state.environmentState.hiddenItems = {};
    }
    state.environmentState.hiddenItems['item_wet_receipt'] = 'under_cup';
    effects.push({ type: 'modify_environment', key: 'hiddenItems', value: state.environmentState.hiddenItems });

    const hideSpotName = secObj ? secObj.nameFa : (method.includes('منو') ? 'پایه منو' : 'نعلبکی سرامیکی فنجان');
    return {
      narrative: `با یک حرکت سریع و بدون جلب توجه، مدرک را زیر ${hideSpotName} سُر می‌دهی تا از دید مستقیم پنهان بماند.`,
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
          : 'هدف زنده از مسیر ضربه کنار می‌رود و آدم‌های حاضر میان شما فاصله می‌اندازند. قصد خشونت ثبت شده، اما نتیجهٔ بدنی دلخواهت خودکار اتفاق نمی‌افتد.',
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
    let discoveredAudioEvidence = false;
    if (!state.canonical.evidenceIds.includes('fact_acoustic_distant_motorcycle')) {
      state.canonical.evidenceIds.push('fact_acoustic_distant_motorcycle');
      effects.push({ type: 'add_evidence', evidenceId: 'fact_acoustic_distant_motorcycle' });
      discoveredAudioEvidence = true;
    }
    if (discoveredAudioEvidence && !state.proofDomains) {
      state.proofDomains = { ART: 0, CHEM: 0, SYS: 0, SOCIAL: 0, FACTION: 0 };
    }
    if (discoveredAudioEvidence && state.proofDomains) {
      state.proofDomains = addProofPoints(state.proofDomains, 'SYS', 1);
      effects.push({ type: 'add_proof_domain', domain: 'SYS', points: 1 });
    }

    return {
      narrative: `دستگاه ضبط صدای گوشی را فعال می‌کنی. نویز محیطی کافه، صدای باران و زمزمه‌های بم دوردست با وضوح بالا ذخیره می‌شوند.`,
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
      narrative: 'حواس افراد حاضر را با روشی که انتخاب کرده‌ای از نقطهٔ اصلی منحرف می‌کنی. چند نگاه و بدن به سمت طعمه می‌چرخد؛ یک پنجرهٔ کوتاه برای حرکت بعدی ساخته شده، نه یک موفقیت خودکار.',
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
        : 'دقایقی در سکوت می‌ایستی و ریتم طبیعی محیط را تماشا می‌کنی. آدم‌ها کار خودشان را ادامه می‌دهند و زمانِ بی‌عمل هم به جبهه‌های بیرون فرصت حرکت می‌دهد؛ سکوت به‌تنهایی سرنخ تازه تولید نمی‌کند.',
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

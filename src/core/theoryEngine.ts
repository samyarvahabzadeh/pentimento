import type { RunState, PlayerTheory, TheoryCategory, DirectorOutput } from './types.js';

export function detectTheoryCategory(input: string): TheoryCategory | undefined {
  if (/دنبال.*(تابلو|نقاشی)|تابلو.*رو.*می‌خواد|هدفش.*تابلو|تابلو.*می‌خواد/.test(input)) {
    return 'collector_wants_painting';
  }
  if (/دنبال.*Lot|Lot.*55.*رو.*می‌خواد|قضیه.*Lot|هدفش.*Lot/.test(input)) {
    return 'collector_wants_lot55';
  }
  if (/پنهان.*(کردن|شدن).*اصالت|اصالت.*تابلو|تاریخچه.*(رو.*پاک|پنهان)|رد.*گم/.test(input)) {
    return 'collector_wants_provenance_hidden';
  }
  if (/پیگیری.*نکنیم|دست.*بکشیم|تحقیق.*متوقف|کافه.*دخالت.*نکنه|ادامه.*ندیم/.test(input)) {
    return 'collector_wants_cafe_to_stop_investigating';
  }
  if (/فقط.*خریدار|دشمن.*نیست|خریدار.*واقعی|واسطه|خریدار.*است/.test(input)) {
    return 'collector_is_buyer_not_enemy';
  }
  if (/اختلاف.*(ساعت|زمان)|تفاوت.*(ساعت|زمان)|زمان.*(متفاوته|اشتباهه)|همخوانی.*ندارن|دو.*لحظه.*متفاوت|تایمینگ.*اشتباه/.test(input)) {
    return 'time_mismatch_explains_route_conflict';
  }
  if (/یکیشون.*(دروغ|دروغگو)|یکی.*دروغ.*می‌گه|دروغ.*می‌گن|یکیتون.*دروغ/.test(input)) {
    return 'one_witness_is_lying';
  }
  if (/شاهد.*(مسیر.*پشتی|عقب).*اشتباه|مسیر.*پشتی.*اشتباهه/.test(input)) {
    return 'rear_witness_is_wrong';
  }
  if (/شاهد.*(درب.*اصلی|جلو).*اشتباه|درب.*اصلی.*اشتباهه/.test(input)) {
    return 'main_door_witness_is_wrong';
  }
  if (/هر.*دو.*مسیر|دو.*بار.*(رفته|اومده|خارج)|هر.*دو.*طرف.*رفته/.test(input)) {
    return 'unknown_man_used_both_routes_at_different_times';
  }
  if (/ماشین.*(انجمن|دشمن)|خودروی.*انجمن/.test(input)) {
    return 'car_belongs_to_association';
  }
  if (/ماشین.*(تعقیب|می‌پاد|جاسوس|مشکوک|مراقبت|زیر.*نظر|تعقیبمون)/.test(input)) {
    return 'car_is_surveillance';
  }
  if (/ماشین.*(عادی|اتفاقی|تصادفی|ربطی.*نداره)|پارک.*عادی/.test(input)) {
    return 'car_is_coincidence';
  }
  if (/دوربین.*(عمداً|عمدی)|قطع.*عمدی|دستکاری.*دوربین|شکاف.*عمدی/.test(input)) {
    return 'camera_gap_was_deliberate';
  }
  if (/خرابی.*فنی|نقص.*سیستم|قطعی.*فنی|خرابی.*دوربین|نقص.*فنی/.test(input)) {
    return 'camera_gap_was_technical_failure';
  }
  if (/محیط.*اطلاعاتی.*دستکاری|دستکاری.*اطلاعات|فیلتر.*اطلاعات|هدایت.*دیدگاه|چیزهای.*خاصی.*(ببینیم|ثبت.*نشن)/.test(input)) {
    return 'information_environment_may_be_manipulated';
  }
  if (/هیچ‌وقت.*نوشته.*نشده|نوشته.*نشده|اصلاً.*ثبت.*نشده|ثبت.*نشده.*بود/.test(input)) {
    return 'footage_never_written';
  }
  if (/فیلم.*(پاک|حذف|دیلیت).*شده|پاکش.*کردن|حذفش.*کردن|ویدیو.*پاک.*شده/.test(input)) {
    return 'footage_deleted';
  }
  if (/عمداً.*(گذاشتن|کاشتن|گذاشته|ایجاد.*کرده)|مدرک.*جعلی.*(کاشتن|گذاشتن)|کسی.*عمداً.*گذاشته|هدایت.*ما.*به.*Lot|هدایت.*به.*Lot/.test(input)) {
    return 'planted_evidence';
  }
  if (/محیط.*(دیگه|دیگری|متفاوت)|جای.*دیگه|بیرون.*کافه|منشأ.*خارجی|از.*بیرون.*(اومده|آوردن)/.test(input)) {
    return 'object_from_different_environment';
  }
  if (/تازه.*جایگزین|تازه.*آورده|چیزی.*جاش|عوض.*شده|تعویض.*جعبه|جعبه.*جدید/.test(input)) {
    return 'box_replacement';
  }
  if (/حتماً.*(انجمن|دستکش|شبکه)|کار.*(دستکش|انجمن)|توطئه.*(دستکش|انجمن)|سازمان.*مخفی|فرقه.*دستکش/.test(input)) {
    return 'unsupported_conspiracy';
  }
  if (/رمز.*گاوصندوق|کد.*گاوصندوق|ترکیب.*رمز|رمز.*(چهار|۴)|رمز.*چرخشی/.test(input)) {
    return 'safe_combination';
  }
  if (/تاریخ|سال|ماه|روز|تقویم|میلادی|شمسی/.test(input)) {
    return 'date';
  }
  if (/کد.*اموال|شماره.*اموال|انبار|فهرست.*اموال|ثبت.*دفتر|کد.*ثبتی/.test(input)) {
    return 'inventory_reference';
  }
  if (/آدرس|موقعیت|پلاک|مختصات|کوچه|خیابان/.test(input)) {
    return 'address_or_location';
  }
  if (/شاید|احتمالاً|به نظرم|تئوری|فرضیه|حدس|معنی.*اعداد/.test(input)) {
    return 'other';
  }
  return undefined;
}

export function registerTheory(
  state: RunState,
  proposition: string,
  category: TheoryCategory,
  proposedBy: 'player' | 'npc' = 'player',
  sourceNpcId?: string
): PlayerTheory {
  if (!state.theories) {
    state.theories = {};
  }

  const id = `theory_${category}_${Object.keys(state.theories).length + 1}`;

  // Check if same category already exists
  const existing = Object.values(state.theories).find(t => t.category === category && t.proposedBy === proposedBy);
  if (existing) {
    existing.proposition = proposition;
    syncTheoryWithEvidence(state, existing);
    return existing;
  }

  const supportingEvidenceIds: string[] = [];
  const contradictingEvidenceIds: string[] = [];
  let status: PlayerTheory['status'] = 'OPEN';
  let confidence: PlayerTheory['confidence'] = 'low';

  if (category === 'time_mismatch_explains_route_conflict') {
    if (state.canonical.evidenceIds.includes('fact_witness_clock_discrepancy') || state.scene.establishedFactIds.includes('fact_witness_clock_discrepancy')) {
      supportingEvidenceIds.push('fact_witness_clock_discrepancy');
      status = 'SUPPORTED';
      confidence = 'medium';
    }
  } else if (category === 'planted_evidence') {
    if (state.canonical.evidenceIds.includes('invoice_is_forged')) {
      supportingEvidenceIds.push('invoice_is_forged');
      status = 'SUPPORTED';
      confidence = 'medium';
    }
  } else if (category === 'footage_deleted') {
    if (state.canonical.evidenceIds.includes('footage_was_never_written')) {
      contradictingEvidenceIds.push('footage_was_never_written');
      status = 'REFUTED';
      confidence = 'high';
    } else if (state.canonical.evidenceIds.includes('seven_minute_camera_gap')) {
      supportingEvidenceIds.push('seven_minute_camera_gap');
      status = 'OPEN';
      confidence = 'low';
    }
  } else if (category === 'footage_never_written') {
    if (state.canonical.evidenceIds.includes('footage_was_never_written')) {
      supportingEvidenceIds.push('footage_was_never_written');
      if (state.canonical.evidenceIds.includes('seven_minute_camera_gap')) {
        supportingEvidenceIds.push('seven_minute_camera_gap');
      }
      status = 'CONFIRMED';
      confidence = 'high';
    }
  } else if (category === 'information_environment_may_be_manipulated') {
    if (state.canonical.evidenceIds.includes('invoice_is_forged')) {
      supportingEvidenceIds.push('invoice_is_forged');
    }
    if (state.canonical.evidenceIds.includes('footage_was_never_written')) {
      supportingEvidenceIds.push('footage_was_never_written');
    }
    status = 'OPEN';
    confidence = supportingEvidenceIds.length >= 2 ? 'medium' : 'low';
  } else if (category === 'car_is_surveillance') {
    const inv = state.redHerringInvestment?.['parked_car'] || 0;
    status = inv >= 2 ? 'WEAKENED' : 'OPEN';
    confidence = 'low';
  } else if (category === 'object_from_different_environment') {
    if (state.canonical.evidenceIds.includes('object_has_different_cleaner_smell')) {
      supportingEvidenceIds.push('object_has_different_cleaner_smell');
    }
    if (state.canonical.evidenceIds.includes('penti_avoids_new_object')) {
      supportingEvidenceIds.push('penti_avoids_new_object');
    }
    status = supportingEvidenceIds.length > 0 ? 'SUPPORTED' : 'OPEN';
    confidence = supportingEvidenceIds.length > 0 ? 'medium' : 'low';
  } else if (category === 'box_replacement' && state.canonical.evidenceIds.includes('unusually_clean_box')) {
    supportingEvidenceIds.push('unusually_clean_box');
  } else if (state.canonical.evidenceIds.includes('label_numbers_14_3_7_55')) {
    supportingEvidenceIds.push('label_numbers_14_3_7_55');
  }

  const theory: PlayerTheory = {
    id,
    proposition,
    category,
    supportingEvidenceIds,
    contradictingEvidenceIds,
    confidence,
    status,
    proposedBy,
    sourceNpcId,
    createdAtTurn: state.scene.turn,
  };

  state.theories[id] = theory;
  return theory;
}

function syncTheoryWithEvidence(state: RunState, theory: PlayerTheory): void {
  const ev = state.canonical.evidenceIds;
  const sceneFacts = state.scene.establishedFactIds;

  if (theory.category === 'time_mismatch_explains_route_conflict') {
    if (ev.includes('fact_witness_clock_discrepancy') || sceneFacts.includes('fact_witness_clock_discrepancy')) {
      theory.status = 'SUPPORTED';
      theory.confidence = 'medium';
      if (!theory.supportingEvidenceIds.includes('fact_witness_clock_discrepancy')) {
        theory.supportingEvidenceIds.push('fact_witness_clock_discrepancy');
      }
    }
  } else if (theory.category === 'footage_deleted') {
    if (ev.includes('footage_was_never_written')) {
      theory.status = 'REFUTED';
      theory.confidence = 'high';
      if (!theory.contradictingEvidenceIds.includes('footage_was_never_written')) {
        theory.contradictingEvidenceIds.push('footage_was_never_written');
      }
    }
  } else if (theory.category === 'footage_never_written') {
    if (ev.includes('footage_was_never_written')) {
      theory.status = 'CONFIRMED';
      theory.confidence = 'high';
      if (!theory.supportingEvidenceIds.includes('footage_was_never_written')) {
        theory.supportingEvidenceIds.push('footage_was_never_written');
      }
    }
  } else if (theory.category === 'planted_evidence') {
    if (ev.includes('invoice_is_forged')) {
      theory.status = 'SUPPORTED';
      theory.confidence = 'medium';
      if (!theory.supportingEvidenceIds.includes('invoice_is_forged')) {
        theory.supportingEvidenceIds.push('invoice_is_forged');
      }
    }
  } else if (theory.category === 'car_is_surveillance') {
    const inv = state.redHerringInvestment?.['parked_car'] || 0;
    if (inv >= 2 && theory.status === 'OPEN') {
      theory.status = 'WEAKENED';
    }
  } else if (theory.category === 'information_environment_may_be_manipulated') {
    if (ev.includes('invoice_is_forged') && !theory.supportingEvidenceIds.includes('invoice_is_forged')) {
      theory.supportingEvidenceIds.push('invoice_is_forged');
    }
    if (ev.includes('footage_was_never_written') && !theory.supportingEvidenceIds.includes('footage_was_never_written')) {
      theory.supportingEvidenceIds.push('footage_was_never_written');
    }
  }
}

export function processTurnTheories(
  state: RunState,
  playerInput: string,
  directorOutput?: DirectorOutput
): void {
  if (!state.theories) {
    state.theories = {};
  }

  // 0. Check for Player Theory Retraction / Voluntary Abandonment
  if (/پس.*می‌گیرم|اشتباه.*فکر.*می‌کردم|نظرم.*عوض.*شد|این.*نظریه.*رو.*رد.*می‌کنم|اشتباه.*می‌کردم/.test(playerInput)) {
    for (const theory of Object.values(state.theories)) {
      if (theory.status !== 'ABANDONED') {
        if (
          (playerInput.includes('مهری') && theory.proposition.includes('مهری')) ||
          (playerInput.includes('یاشین') && theory.proposition.includes('یاشین')) ||
          (playerInput.includes('ماشین') && theory.category.includes('car')) ||
          (playerInput.includes('ساعت') && theory.category.includes('clock')) ||
          (!playerInput.includes('مهری') && !playerInput.includes('یاشین') && !playerInput.includes('ماشین'))
        ) {
          theory.status = 'ABANDONED';
        }
      }
    }
  }

  // 1. Process explicit Director proposals if any
  if (directorOutput?.proposedTheories && directorOutput.proposedTheories.length > 0) {
    for (const pt of directorOutput.proposedTheories) {
      registerTheory(state, pt.proposition, pt.category, 'player');
    }
  }

  // 2. Deterministic Player Theory Detection from input
  const detectedCategory = detectTheoryCategory(playerInput);
  if (detectedCategory) {
    registerTheory(state, playerInput, detectedCategory, 'player');
  }

  // 3. NPC Speculation Handling
  if (/مانی.*(می‌گه|گفت|نظرت|چیه)|یاشین.*(می‌گه|گفت|نظرت|چیه)|حانیه.*(می‌گه|گفت|نظرت|چیه)|صالحی.*(می‌گه|گفت|نظرت|چیه)|مهری.*(می‌گه|گفت|نظرت|چیه)|گرشاسبی.*(می‌گه|گفت|نظرت|چیه)/.test(playerInput) && !detectedCategory) {
    if (playerInput.includes('صالحی')) {
      registerTheory(state, 'دیدگاه مالی آقای صالحی: فاکتور با فرآیند رسمی و سربرگ‌های کافه تطابق ندارد', 'other', 'npc', 'salar_salehi');
    } else if (playerInput.includes('مهری')) {
      registerTheory(state, 'دیدگاه سیستمی آرین مهری: لاگ‌های دیسک نشان می‌دهند دیتا هرگز ثبت نشده، نه اینکه پاک شده باشد', 'footage_never_written', 'npc', 'arian_mehri');
    } else if (playerInput.includes('گرشاسبی')) {
      registerTheory(state, 'گمانه‌زنی آرین گرشاسبی: شاید بد نباشه کوچه رو زیر نظر بگیریم', 'other', 'npc', 'arian_garshasbi');
    }
  }

  // 4. Update and sync all existing theories against updated evidence
  for (const theory of Object.values(state.theories)) {
    if (theory.status !== 'ABANDONED') {
      syncTheoryWithEvidence(state, theory);
    }
  }
}

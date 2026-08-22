import type {
  RunState,
  InvestigationTargetState,
  InvestigationResult,
  ObservationFocus,
} from './types.js';

export function detectObservationFocus(input: string, actionId?: string): ObservationFocus {
  if (/تراش|پاره|چاقو|خراش|تیغ|بکنم|ناخن.*(بکشم|می‌کشم)|آسیب|سوراخ|بشکافم/.test(input) || actionId === 'TOUCH_OR_SCRAPE_PAINTING') {
    return 'destructive_scrape';
  }
  if (/ساعت|زمان|چه.*ساعتی|ساعتت|مبنای.*زمانی|کی.*دیدیش|ساعت.*چند|ساعت.*رو.*از.*کجا/.test(input) || actionId === 'INTERROGATE_WITNESS_TIME_REFERENCE') {
    return 'clock_reference';
  }
  if (/مسیر.*(پشتی|اصلی|خروج|حیاط)|از.*کجا.*رفت|کدوم.*طرف|کدام.*سمت|شهادت|ادعا|حرف.*(مانی|حانیه|یاشین)|تناقض/.test(input) || actionId === 'ASK_WITNESS_ABOUT_REAR_ROUTE' || actionId === 'ASK_WITNESS_ABOUT_MAIN_ROUTE' || actionId === 'COMPARE_WITNESS_STATEMENTS') {
    return 'witness_statement';
  }
  if (/موتور.*(دوردست|صدای)|صدای.*موتور|گوش.*(می‌دم|می‌سپرم|بسپارم)|خیابان.*دور/.test(input) || actionId === 'LISTEN_DISTANT_MOTORCYCLE') {
    return 'acoustic_distant';
  }
  if (/شیشه|داخل.*(ماشین|خودرو|کابین)|صندلی|سرنشین|توی.*(ماشین|خودرو)|کابین/.test(input) || actionId === 'CHECK_CAR_WINDOWS_OR_INTERIOR') {
    return 'vehicle_interior';
  }
  if (/پلاک|بدنه|چراغ|لاستیک|کاپوت|اطراف.*(ماشین|خودرو)|برانداز.*(ماشین|خودرو)/.test(input) || actionId === 'CHECK_CAR_LICENSE_PLATE' || actionId === 'EXAMINE_PARKED_CAR' || actionId === 'OBSERVE_SECOND_CAR_SIGHTING') {
    return 'vehicle_exterior';
  }
  if (/لاگ|رویداد|بافر|دیسک|هارد|ذخیره|نوشتن|تایم‌لاین|تایم.*لاین|رد.*حذف|ثبت.*شده/.test(input) || actionId === 'INSPECT_CAMERA_LOGS' || actionId === 'ANALYZE_WRITE_EVENTS') {
    return 'system_logs';
  }
  if (/فونت|قلم|حروف|چاپ|مقایسه.*(فاکتور|اسناد|برگه)|تفاوت.*(فاکتور|نوشته|چاپ)|شکل.*حروف/.test(input) || actionId === 'COMPARE_OFFICE_INVOICES') {
    return 'font_comparison';
  }
  if (/فاکتور|زونکن|سند.*مالی|حسابداری|دفتر.*کل|برگه.*مالی/.test(input) || actionId === 'EXAMINE_INVOICE_RG_LOT55') {
    return 'financial_ledger';
  }
  if (/بو.*(می‌کشم|می‌کنم|کنم|بکشم)|بوی.*(شیء|وسیله|جعبه|شوینده|تمیزکننده)|بویش|رایحه|استشمام/.test(input) || actionId === 'SMELL_PENTI_NEW_OBJECT' || actionId === 'ASK_YASHIN_TO_SMELL_OBJECT') {
    return 'sensory_smell';
  }
  if (/رفتار.*پنتی|حرکت.*پنتی|واکنش.*پنتی|نگاه.*پنتی|نسبت.*به.*(وسایل|وسایلش|اشیا)|فاصله.*(می‌گیره|می‌کشه)|دوری.*(می‌کنه|کنه)|مسیر.*(کج|عوض)/.test(input) || actionId === 'OBSERVE_PENTI_BEHAVIOR') {
    return 'penti_behavior';
  }
  if (/مقایسه|تفاوت|کدوم.*(فرق|با بقیه)|کدام.*(فرق|با بقیه)|گرد.*و.*خاک|تمیز|غبار|یکدست|تک.*تک.*کارتن/.test(input) || actionId === 'COMPARE_STORAGE_BOXES') {
    return 'comparative_storage';
  }
  if (/نور.*زاویه‌|نور.*گوشی|نور.*مایل|از.*کنار|زاویه.*نور|روشنایی.*مایل|نور.*تند|نور.*کنار|مورب/.test(input) || actionId === 'EXAMINE_PAINTING_ANGLED_LIGHT') {
    return 'lighting_angle';
  }
  if (/نزدیک|سطح.*رنگ|بافت|ضخامت|لایه.*رنگ|برجستگی|لایه.*روغن|برق.*رنگ|زبری|ناهمواری/.test(input) || actionId === 'EXAMINE_PAINTING_CLOSE_SURFACE') {
    return 'surface_texture';
  }
  if (/لبه|قاب|گوشه|چهارچوب|حاشیه|مرز.*بوم|اتصال.*قاب/.test(input)) {
    return 'edges_framing';
  }
  if (/تکنیک.*نقاشی|روش.*اجرا|قلم‌مو|زیرسازی|مرمت|تاروپود|آنالیز.*هنری|بررسی.*سبک/.test(input) || actionId === 'ANALYZE_PAINTING_ART_HISTORIAN') {
    return 'art_historical_analysis';
  }
  if (/عقب|فاصله|دور|کل.*تابلو|نمای.*کلی|چند.*قدم.*عقب/.test(input)) {
    return 'distance_perspective';
  }
  return 'general';
}

export function processInvestigationDepth(
  state: RunState,
  targetId: string,
  actionId?: string,
  playerInput: string = ''
): InvestigationResult {
  if (!state.investigationTargets) {
    state.investigationTargets = {};
  }

  const isStorage = targetId === 'storage_area';
  const isPentiArea = targetId === 'penti_area' || targetId === 'penti';
  const isOfficeInvoice = targetId === 'office_invoice' || targetId === 'invoice_rg_lot55';
  const isCameraSystem = targetId === 'camera_system' || targetId === 'nvr_system';
  const isParkedCar = targetId === 'parked_car' || targetId === 'parked_car_exterior';
  const isWitnessConflict = targetId === 'witness_conflict' || targetId === 'route_conflict';

  const maxDepth = (isStorage || isCameraSystem || isParkedCar || isWitnessConflict) ? 2 : 3;

  if (!state.investigationTargets[targetId]) {
    state.investigationTargets[targetId] = {
      targetId,
      depth: 0,
      maxDepth,
      observedAspects: [],
      unlockedFactIds: [],
    };
  }

  const target = state.investigationTargets[targetId];
  const depthBefore = target.depth;
  const focus = detectObservationFocus(playerInput, actionId);
  const isArtHistorian = state.canonical.playerClass === 'art_historian';
  const isCoffeeAlchemist = state.canonical.playerClass === 'coffee_alchemist';
  const isSystemsAnalyst = state.canonical.playerClass === 'systems_analyst';
  const isInvestigator = state.canonical.playerClass === 'investigator';

  // 1. Destructive Attempt Handling
  if (focus === 'destructive_scrape') {
    return {
      targetId,
      depthBefore,
      depthAfter: depthBefore,
      observationQuality: 'destructive',
      focus,
      newlyUnlockedFactIds: [],
    };
  }

  // 2. Repetitive Observation Check
  const isRepetitiveGeneral = focus === 'general' && target.observedAspects.includes('general');
  const isDuplicateFocus = target.observedAspects.includes(focus) && target.lastObservationFocus === focus;

  if (isRepetitiveGeneral || isDuplicateFocus) {
    return {
      targetId,
      depthBefore,
      depthAfter: depthBefore,
      observationQuality: 'repetitive',
      focus,
      newlyUnlockedFactIds: [],
    };
  }

  // 3. Meaningful Observation Progress
  let depthIncrement = 1;
  if (isStorage) {
    if (focus === 'comparative_storage' || actionId === 'COMPARE_STORAGE_BOXES' || isCoffeeAlchemist) {
      depthIncrement = 2;
    } else {
      depthIncrement = 1;
    }
  } else if (isPentiArea) {
    if (focus === 'sensory_smell' || actionId === 'SMELL_PENTI_NEW_OBJECT' || actionId === 'ASK_YASHIN_TO_SMELL_OBJECT' || isCoffeeAlchemist) {
      depthIncrement = Math.max(2, 3 - depthBefore);
    } else if (focus === 'penti_behavior' || actionId === 'OBSERVE_PENTI_BEHAVIOR') {
      depthIncrement = Math.max(1, 2 - depthBefore);
    } else {
      depthIncrement = 1;
    }
  } else if (isOfficeInvoice) {
    if (actionId === 'ANALYZE_INVOICE_FORGERY' || actionId === 'ASK_SALAR_ABOUT_INVOICE' || (isInvestigator && focus === 'font_comparison')) {
      depthIncrement = Math.max(2, 3 - depthBefore);
    } else if (focus === 'font_comparison' || actionId === 'COMPARE_OFFICE_INVOICES' || isInvestigator) {
      depthIncrement = Math.max(1, 2 - depthBefore);
    } else {
      depthIncrement = 1;
    }
  } else if (isCameraSystem) {
    if (focus === 'system_logs' || actionId === 'INSPECT_CAMERA_LOGS' || actionId === 'ASK_MEHRI_ABOUT_CAMERAS' || actionId === 'ANALYZE_WRITE_EVENTS' || isSystemsAnalyst) {
      depthIncrement = Math.max(1, 2 - depthBefore);
    } else {
      depthIncrement = 1;
    }
  } else if (isParkedCar) {
    if (focus === 'vehicle_interior' || actionId === 'CHECK_CAR_WINDOWS_OR_INTERIOR') {
      depthIncrement = Math.max(1, 2 - depthBefore);
    } else {
      depthIncrement = 1;
    }
  } else if (isWitnessConflict) {
    if (focus === 'clock_reference' || actionId === 'INTERROGATE_WITNESS_TIME_REFERENCE' || isInvestigator) {
      depthIncrement = Math.max(1, 2 - depthBefore);
    } else {
      depthIncrement = 1;
    }
  } else if (isArtHistorian && (focus === 'art_historical_analysis' || focus === 'surface_texture' || focus === 'lighting_angle' || actionId === 'EXAMINE_PAINTING_ANGLED_LIGHT' || actionId === 'ANALYZE_PAINTING_ART_HISTORIAN')) {
    depthIncrement = Math.max(2, 3 - depthBefore);
  }

  const depthAfter = Math.min(target.maxDepth, depthBefore + depthIncrement);
  target.depth = depthAfter;
  target.lastObservationFocus = focus;
  if (!target.observedAspects.includes(focus)) {
    target.observedAspects.push(focus);
  }

  const newlyUnlockedFactIds: string[] = [];

  // Unlock facts per target
  if (isWitnessConflict) {
    if (depthAfter >= 1 && !target.unlockedFactIds.includes('fact_route_testimony_conflict')) {
      target.unlockedFactIds.push('fact_route_testimony_conflict');
      newlyUnlockedFactIds.push('fact_route_testimony_conflict');

      if (!state.scene.establishedFactIds.includes('fact_route_testimony_conflict')) {
        state.scene.establishedFactIds.push('fact_route_testimony_conflict');
      }
    }

    if (depthAfter >= 2 && !target.unlockedFactIds.includes('fact_witness_clock_discrepancy')) {
      target.unlockedFactIds.push('fact_witness_clock_discrepancy');
      newlyUnlockedFactIds.push('fact_witness_clock_discrepancy');

      if (!state.scene.establishedFactIds.includes('fact_witness_clock_discrepancy')) {
        state.scene.establishedFactIds.push('fact_witness_clock_discrepancy');
      }
      if (!state.canonical.evidenceIds.includes('fact_witness_clock_discrepancy')) {
        state.canonical.evidenceIds.push('fact_witness_clock_discrepancy');
      }
    }
  } else if (isStorage) {
    if (depthAfter >= 2 && !target.unlockedFactIds.includes('unusually_clean_box')) {
      target.unlockedFactIds.push('unusually_clean_box');
      newlyUnlockedFactIds.push('unusually_clean_box');

      if (!state.scene.establishedFactIds.includes('unusually_clean_box')) {
        state.scene.establishedFactIds.push('unusually_clean_box');
      }
      if (!state.canonical.evidenceIds.includes('unusually_clean_box')) {
        state.canonical.evidenceIds.push('unusually_clean_box');
      }
    }
  } else if (isPentiArea) {
    if (depthAfter >= 2 && !target.unlockedFactIds.includes('penti_avoids_new_object')) {
      target.unlockedFactIds.push('penti_avoids_new_object');
      newlyUnlockedFactIds.push('penti_avoids_new_object');

      if (!state.scene.establishedFactIds.includes('penti_avoids_new_object')) {
        state.scene.establishedFactIds.push('penti_avoids_new_object');
      }
      if (!state.canonical.evidenceIds.includes('penti_avoids_new_object')) {
        state.canonical.evidenceIds.push('penti_avoids_new_object');
      }
    }

    if (depthAfter >= 3 && !target.unlockedFactIds.includes('object_has_different_cleaner_smell')) {
      target.unlockedFactIds.push('object_has_different_cleaner_smell');
      newlyUnlockedFactIds.push('object_has_different_cleaner_smell');

      if (!state.scene.establishedFactIds.includes('object_has_different_cleaner_smell')) {
        state.scene.establishedFactIds.push('object_has_different_cleaner_smell');
      }
      if (!state.canonical.evidenceIds.includes('object_has_different_cleaner_smell')) {
        state.canonical.evidenceIds.push('object_has_different_cleaner_smell');
      }
    }
  } else if (isOfficeInvoice) {
    if (depthAfter >= 1 && !target.unlockedFactIds.includes('invoice_text_rg_lot55_returned')) {
      target.unlockedFactIds.push('invoice_text_rg_lot55_returned');
      newlyUnlockedFactIds.push('invoice_text_rg_lot55_returned');

      if (!state.scene.establishedFactIds.includes('invoice_text_rg_lot55_returned')) {
        state.scene.establishedFactIds.push('invoice_text_rg_lot55_returned');
      }
      if (!state.canonical.evidenceIds.includes('invoice_text_rg_lot55_returned')) {
        state.canonical.evidenceIds.push('invoice_text_rg_lot55_returned');
      }
    }

    if (depthAfter >= 2 && !target.unlockedFactIds.includes('invoice_font_differs_from_others')) {
      target.unlockedFactIds.push('invoice_font_differs_from_others');
      newlyUnlockedFactIds.push('invoice_font_differs_from_others');

      if (!state.scene.establishedFactIds.includes('invoice_font_differs_from_others')) {
        state.scene.establishedFactIds.push('invoice_font_differs_from_others');
      }
      if (!state.canonical.evidenceIds.includes('invoice_font_differs_from_others')) {
        state.canonical.evidenceIds.push('invoice_font_differs_from_others');
      }
    }

    if (depthAfter >= 3 && !target.unlockedFactIds.includes('invoice_is_forged')) {
      target.unlockedFactIds.push('invoice_is_forged');
      newlyUnlockedFactIds.push('invoice_is_forged');

      if (!state.scene.establishedFactIds.includes('invoice_is_forged')) {
        state.scene.establishedFactIds.push('invoice_is_forged');
      }
      if (!state.canonical.evidenceIds.includes('invoice_is_forged')) {
        state.canonical.evidenceIds.push('invoice_is_forged');
      }
    }
  } else if (isCameraSystem) {
    if (depthAfter >= 1 && !target.unlockedFactIds.includes('seven_minute_camera_gap')) {
      target.unlockedFactIds.push('seven_minute_camera_gap');
      newlyUnlockedFactIds.push('seven_minute_camera_gap');

      if (!state.scene.establishedFactIds.includes('seven_minute_camera_gap')) {
        state.scene.establishedFactIds.push('seven_minute_camera_gap');
      }
      if (!state.canonical.evidenceIds.includes('seven_minute_camera_gap')) {
        state.canonical.evidenceIds.push('seven_minute_camera_gap');
      }
    }

    if (depthAfter >= 2 && !target.unlockedFactIds.includes('footage_was_never_written')) {
      target.unlockedFactIds.push('footage_was_never_written');
      newlyUnlockedFactIds.push('footage_was_never_written');

      if (!state.scene.establishedFactIds.includes('footage_was_never_written')) {
        state.scene.establishedFactIds.push('footage_was_never_written');
      }
      if (!state.canonical.evidenceIds.includes('footage_was_never_written')) {
        state.canonical.evidenceIds.push('footage_was_never_written');
      }
    }
  } else if (isParkedCar) {
    if (depthAfter >= 1 && !target.unlockedFactIds.includes('fact_parked_car_appearance')) {
      target.unlockedFactIds.push('fact_parked_car_appearance');
      newlyUnlockedFactIds.push('fact_parked_car_appearance');

      if (!state.scene.establishedFactIds.includes('fact_parked_car_appearance')) {
        state.scene.establishedFactIds.push('fact_parked_car_appearance');
      }
    }

    if (depthAfter >= 2 && !target.unlockedFactIds.includes('fact_no_new_reliable_car_details')) {
      target.unlockedFactIds.push('fact_no_new_reliable_car_details');
      newlyUnlockedFactIds.push('fact_no_new_reliable_car_details');

      if (!state.scene.establishedFactIds.includes('fact_no_new_reliable_car_details')) {
        state.scene.establishedFactIds.push('fact_no_new_reliable_car_details');
      }
    }
  } else {
    if (depthAfter >= 3 && !target.unlockedFactIds.includes('underpaint_line_visible')) {
      target.unlockedFactIds.push('underpaint_line_visible');
      newlyUnlockedFactIds.push('underpaint_line_visible');

      if (!state.scene.establishedFactIds.includes('underpaint_line_visible')) {
        state.scene.establishedFactIds.push('underpaint_line_visible');
      }
      if (!state.canonical.evidenceIds.includes('underpaint_line_visible')) {
        state.canonical.evidenceIds.push('underpaint_line_visible');
      }
    }
  }

  return {
    targetId,
    depthBefore,
    depthAfter,
    observationQuality: 'meaningful',
    focus,
    newlyUnlockedFactIds,
  };
}

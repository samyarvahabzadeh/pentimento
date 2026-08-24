import type {
  PlayerClassId,
  RunState,
  SituationFrontId,
  SituationNpcIntentionState,
} from '../core/types.js';

/**
 * What actually happened in Episode 1.
 *
 * These facts do not change between runs.  The order in which they surface,
 * who controls them, and the price paid for proving them do change.  That is
 * the contract that keeps an authored mystery fair while allowing D&D-like play.
 */
export const EPISODE_01_INVARIANT_TRUTH = {
  episodeId: 'episode_01_lot_55',
  incident: {
    visitor:
      'The red-gloved visitor was a Custodian authenticator, not a cafe customer.',
    cup:
      'The espresso cup was used as a disposable reservoir for a reversible oil solvent. The visitor used its smell to verify the transfer medium and never intended to drink it.',
    receipt:
      'The wet receipt linked table 5 to the transfer window, but was dropped before the courier could destroy it.',
    invoice:
      'The R.G. / Lot 55 / Returned invoice was produced outside the cafe template as cover for a coerced transfer. Salar concealed the agreement because the cafe debt made the offer tempting.',
    cameras:
      'The recorder was made to stop writing through a maintenance credential supplied in the transfer packet; footage was not deleted afterward.',
    painting:
      'The underpainting preserves part of a historical witness register. It is valuable because it can prove a centuries-old breach inside the Red Glove network, not merely because it is an old painting.',
  },
  factions: {
    custodians:
      'Want the painting and provenance chain contained in a private collection where access can be controlled.',
    redactors:
      'Want the underlayer and every modern transfer trace made unusable, even if the cafe burns with them.',
    preservers:
      'Want the truth to survive, but prefer concealment and a trusted successor over immediate public exposure.',
  },
  moralQuestion:
    'When truth can destroy the people sheltering it, who earns the right to preserve, expose, sell, falsify, or erase it?',
} as const;

export interface ClueConstellation {
  id: string;
  claimFa: string;
  /** Any one route with enough matching facts can establish the claim. */
  routes: Array<{
    id: string;
    factIds: string[];
    minimum: number;
  }>;
}

/**
 * Revelations are constellations, not ordered keys.  A social player and a
 * systems player can prove the same claim through different evidence.
 */
export const EPISODE_01_CLUE_CONSTELLATIONS: ClueConstellation[] = [
  {
    id: 'visitor_was_not_a_customer',
    claimFa: 'مرد میز پنج برای نوشیدن قهوه نیامده بود؛ حضورش بخشی از یک انتقال برنامه‌ریزی‌شده بود.',
    routes: [
      {
        id: 'chemical_behavior',
        factIds: ['fact_solvent_smell_cup', 'fact_guest_hesitation', 'fact_red_glove_man'],
        minimum: 2,
      },
      {
        id: 'human_witnesses',
        factIds: ['fact_haniyeh_behavioral_tell', 'fact_guest_hesitation', 'fact_penti_agitation'],
        minimum: 2,
      },
      {
        id: 'timing_records',
        factIds: ['fact_time_0017', 'fact_pos_order_timestamp', 'fact_pos_receipt_time_gap'],
        minimum: 2,
      },
    ],
  },
  {
    id: 'transfer_was_staged',
    claimFa: 'انتقال پلاک ۵۵ با سند پوششی و دسترسی داخلی به سیستم زمان‌بندی شده بود.',
    routes: [
      {
        id: 'document_forensics',
        factIds: ['fact_invoice_text_rg_lot55_returned', 'fact_invoice_font_differs_from_others', 'fact_invoice_is_forged'],
        minimum: 2,
      },
      {
        id: 'system_forensics',
        factIds: ['fact_pos_receipt_time_gap', 'fact_camera_time_gap', 'fact_footage_was_never_written'],
        minimum: 2,
      },
      {
        id: 'social_pressure',
        factIds: ['fact_route_testimony_conflict', 'fact_witness_clock_discrepancy', 'fact_collector_settlement_motive'],
        minimum: 2,
      },
    ],
  },
  {
    id: 'painting_is_a_historical_breach',
    claimFa: 'لایهٔ زیرین تابلو شاهد یک شکاف تاریخی در شبکهٔ دستکش قرمز است.',
    routes: [
      {
        id: 'material_provenance',
        factIds: ['fact_underpainting_hidden_layer', 'fact_label_numbers_14_3_7_55', 'fact_label_transfer_trace'],
        minimum: 2,
      },
      {
        id: 'faction_leverage',
        factIds: ['fact_collector_settlement_motive', 'fact_invoice_is_forged', 'fact_red_glove_man'],
        minimum: 2,
      },
      {
        id: 'causal_synthesis',
        factIds: ['fact_footage_was_never_written', 'fact_painting_window_reflection', 'fact_final_timeline_synthesis'],
        minimum: 2,
      },
    ],
  },
];

export interface ClueConstellationEvaluation {
  id: string;
  established: boolean;
  supportingRouteIds: string[];
  bestProgress: number;
}

export function evaluateEpisode01Constellations(
  state: RunState,
): ClueConstellationEvaluation[] {
  const knownFacts = new Set([
    ...state.canonical.evidenceIds,
    ...state.scene.establishedFactIds,
  ]);

  return EPISODE_01_CLUE_CONSTELLATIONS.map(constellation => {
    const routeProgress = constellation.routes.map(route => {
      const matching = route.factIds.filter(factId => knownFacts.has(factId)).length;
      return {
        id: route.id,
        established: matching >= route.minimum,
        progress: route.minimum > 0 ? Math.min(1, matching / route.minimum) : 0,
      };
    });
    return {
      id: constellation.id,
      established: routeProgress.some(route => route.established),
      supportingRouteIds: routeProgress.filter(route => route.established).map(route => route.id),
      bestProgress: Math.max(0, ...routeProgress.map(route => route.progress)),
    };
  });
}

export const FRONT_TITLES_FA: Record<SituationFrontId, string> = {
  custodian_extraction: 'تصاحب تابلو توسط متولیان',
  redactor_cleanup: 'پاک‌سازی ردها توسط ویراستاران',
  cafe_fracture: 'فروپاشی اعتماد در کافه',
};

export const INITIAL_SITUATION_NPC_INTENTIONS: Record<string, SituationNpcIntentionState> = {
  salar: {
    npcId: 'salar',
    intentId: 'delay_and_hide_coerced_contract',
    stage: 0,
    status: 'active',
    location: 'scene_office',
    lastActedPulse: 0,
  },
  haniyeh: {
    npcId: 'haniyeh',
    intentId: 'protect_penti_and_backup_photo',
    stage: 0,
    status: 'active',
    location: 'scene_table5',
    lastActedPulse: 0,
  },
  mani: {
    npcId: 'mani',
    intentId: 'keep_strangers_away_from_staff',
    stage: 0,
    status: 'active',
    location: 'scene_counter',
    lastActedPulse: 0,
  },
  yashin: {
    npcId: 'yashin',
    intentId: 'reconcile_timestamps_without_exposing_salar',
    stage: 0,
    status: 'active',
    location: 'scene_counter',
    lastActedPulse: 0,
  },
  collector: {
    npcId: 'collector',
    intentId: 'convert_debt_into_quiet_transfer',
    stage: 0,
    status: 'active',
    location: 'offscreen',
    lastActedPulse: 0,
  },
  red_glove_courier: {
    npcId: 'red_glove_courier',
    intentId: 'recover_receipt_then_extract_painting',
    stage: 0,
    status: 'active',
    location: 'scene_hosseini_alley',
    lastActedPulse: 0,
  },
};

export const ROLE_LEVERAGE_DEFINITIONS: Record<PlayerClassId, {
  id: string;
  descriptionFa: string;
}> = {
  art_historian: {
    id: 'credible_provenance_decoy',
    descriptionFa: 'می‌تواند با ثبت یک شجره‌نامهٔ جایگزین باورپذیر، خریدار را وادار کند روی نسخهٔ اشتباه سرمایه‌گذاری کند.',
  },
  coffee_alchemist: {
    id: 'trace_cleanup_solvent',
    descriptionFa: 'می‌تواند مسیر پاک‌سازی را از روی بوی حلال و آلودگی متقاطع دنبال کند.',
  },
  systems_analyst: {
    id: 'independent_log_mirror',
    descriptionFa: 'می‌تواند یک نسخهٔ مستقل و زمان‌مهرشده از لاگ‌ها بسازد که از داخل کافه پاک نمی‌شود.',
  },
  investigator: {
    id: 'turn_witness_into_ally',
    descriptionFa: 'می‌تواند تناقض رفتاری را به اهرم انسانی تبدیل کند و یک شاهد را به همدست فعال بدل سازد.',
  },
  observer: {
    id: 'uncommitted_perspective',
    descriptionFa: 'به یک مسیر تخصصی متعهد نیست و می‌تواند با هزینهٔ بیشتر از چند روش ترکیبی استفاده کند.',
  },
};

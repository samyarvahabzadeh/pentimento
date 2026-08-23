import type { RunState, ValidationResult, SceneBeat, DirectorInterpretation } from './types.js';
import { resolvePhysicalAttempt } from './physicalAttemptResolver.js';
import { NODE_01_INITIAL_STATE } from '../canon/node01.js';
import { NODE_02_INITIAL_STATE } from '../canon/node02.js';
import { NODE_03_INITIAL_STATE } from '../canon/node03.js';
import { NODE_04_INITIAL_STATE } from '../canon/node04.js';
import { NODE_05_INITIAL_STATE } from '../canon/node05.js';
import { NODE_06_INITIAL_STATE } from '../canon/node06.js';
import { NODE_07_INITIAL_STATE } from '../canon/node07.js';
import { NODE_08_INITIAL_STATE } from '../canon/node08.js';
import { NODE_09_INITIAL_STATE } from '../canon/node09.js';
import { NODE_10_INITIAL_STATE } from '../canon/node10.js';
import { NODE_11_INITIAL_STATE } from '../canon/node11.js';
import { NODE_12_INITIAL_STATE } from '../canon/node12.js';
import { NODE_13_INITIAL_STATE } from '../canon/node13.js';
import { NODE_14_INITIAL_STATE } from '../canon/node14.js';
import { NODE_15_INITIAL_STATE } from '../canon/node15.js';
import { NODE_16_INITIAL_STATE, isNode16Eligible } from '../canon/node16.js';
import { buildArchiveItemsFromState, CANONICAL_TIMELINE_CONSTRAINTS, isNode17Eligible } from '../canon/node17.js';
import { NODE_18_INITIAL_STATE } from '../canon/node18.js';
import { resolveEnding } from './endingResolver.js';
import { validateTimeline } from './timelineEngine.js';
import { processAudioInformationLoss } from './audioInformationLoss.js';
import { processInvestigationDepth } from './investigationDepth.js';
import { processTurnTheories } from './theoryEngine.js';

export function initWitnessRolesAndStatements(state: RunState): void {
  if (!state.witnessRoles) {
    const isOdd = (state.runSeed || 1) % 2 === 1;
    state.witnessRoles = {
      routeWitnessRear: isOdd ? 'yashin_shojaee' : 'mani_shojaee',
      routeWitnessMain: isOdd ? 'mani_shojaee' : 'haniyeh_mohammadi',
    };
  }

  if (!state.witnessStatements) {
    state.witnessStatements = {
      statement_rear_route: {
        id: 'statement_rear_route',
        speakerId: state.witnessRoles.routeWitnessRear,
        claim: 'مرد ناشناس از مسیر پشتی و درب خروجی حیاط/انبار رفت.',
        subjectId: 'unknown_exiting_man',
        routeClaim: 'rear_route',
        timeClaim: 'witness_a_time_reference',
        reliability: 65,
        context: 'دید از سمت راهروی انبار',
        sourceBias: 'casual_observation',
        connectionPotential: 'medium',
        intentionalDeception: 'UNKNOWN',
        confidence: 'high',
      },
      statement_main_door: {
        id: 'statement_main_door',
        speakerId: state.witnessRoles.routeWitnessMain,
        claim: 'مرد ناشناس از درب اصلی کافه به سمت خیابان خارج شد.',
        subjectId: 'unknown_exiting_man',
        routeClaim: 'main_door',
        timeClaim: 'witness_b_time_reference',
        reliability: 70,
        context: 'دید از سمت میزها و سالن ورودی',
        sourceBias: 'direct_sighting',
        connectionPotential: 'medium',
        intentionalDeception: 'UNKNOWN',
        confidence: 'high',
      },
    };
  }
}

function applyActionEffects(state: RunState, actionId: string, playerInput: string): void {
  // ── NODE 00 Actions (Role Selection) ──
  if (
    actionId === 'SELECT_ROLE_ART_HISTORIAN' ||
    actionId === 'SELECT_ROLE_COFFEE_ALCHEMIST' ||
    actionId === 'SELECT_ROLE_SYSTEMS_ANALYST' ||
    actionId === 'SELECT_ROLE_INVESTIGATOR'
  ) {
    const classMap: Record<string, string> = {
      SELECT_ROLE_ART_HISTORIAN: 'art_historian',
      SELECT_ROLE_COFFEE_ALCHEMIST: 'coffee_alchemist',
      SELECT_ROLE_SYSTEMS_ANALYST: 'systems_analyst',
      SELECT_ROLE_INVESTIGATOR: 'investigator',
    };
    state.canonical.playerClass = classMap[actionId] as any;
    state.canonical.currentNode = 'NODE_01';
    state.canonical.currentScene = 'scene_entrance';
    state.scene.nodeId = 'NODE_01';
    state.scene.sceneId = 'scene_entrance';
    state.scene.activeEntityIds = [...NODE_01_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_01_INITIAL_STATE.visibleObjectIds];
    if (!state.canonical.canonicalFlags.includes('role_selected')) {
      state.canonical.canonicalFlags.push('role_selected');
    }
    // Mark if this is a first run vs replay for The Guest logic
    if (!state.canonical.canonicalFlags.includes('first_run_opening_seen')) {
      state.canonical.canonicalFlags.push('first_run_opening_seen');
    }
  }

  // ── NODE 01 Actions ──
  else if (actionId === 'ENTER_CAFE') {
    state.canonical.currentNode = 'NODE_02';
    state.canonical.currentScene = 'scene_table_5';
    state.scene.nodeId = 'NODE_02';
    state.scene.sceneId = 'scene_table_5';
    state.scene.activeEntityIds = [...NODE_02_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_02_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('cafe_entered')) {
      state.canonical.canonicalFlags.push('cafe_entered');
    }

    if (!state.npcMemory.haniyeh) {
      state.npcMemory.haniyeh = {
        awareness: ['player_entered_cafe', 'male_customer_left_table_5_unconsumed'],
        beliefs: [
          {
            summary: 'مشتری میز ۵ یک مرد تنها با پالتوی تیره بود که بدون لمس قهوه‌اش ناگهان خارج شد',
            confidence: 'high',
          },
        ],
        impressions: [],
        commitments: [],
        rapport: 0,
        lastInteractionTurn: state.scene.turn,
      };
    }
  } else if (actionId === 'FOLLOW_EXITING_MAN') {
    if (!state.canonical.canonicalFlags.includes('following_man')) {
      state.canonical.canonicalFlags.push('following_man');
    }
    if (!state.canonical.canonicalFlags.includes('following_started_turn')) {
      state.canonical.canonicalFlags.push(`following_started_turn:${state.scene.turn}`);
    }
  } else if (actionId === 'OBSERVE_EXITING_MAN') {
    if (!state.scene.establishedFactIds.includes('observed_exiting_man')) {
      state.scene.establishedFactIds.push('observed_exiting_man');
    }
  } else if (actionId === 'OBSERVE_ENTRANCE') {
    if (!state.scene.establishedFactIds.includes('observed_entrance')) {
      state.scene.establishedFactIds.push('observed_entrance');
    }
  } else if (actionId === 'IGNORE_AND_WAIT') {
    if (!state.canonical.canonicalFlags.includes('waited')) {
      state.canonical.canonicalFlags.push('waited');
    }
  }

  // ── NODE 02 Actions ──
  else if (actionId === 'EXAMINE_TABLE_5') {
    if (!state.scene.establishedFactIds.includes('examined_table_5')) {
      state.scene.establishedFactIds.push('examined_table_5');
    }
  } else if (actionId === 'EXAMINE_ESPRESSO_CUP') {
    if (!state.canonical.evidenceIds.includes('untouched_espresso')) {
      state.canonical.evidenceIds.push('untouched_espresso');
    }
    if (!state.scene.establishedFactIds.includes('examined_espresso_cup')) {
      state.scene.establishedFactIds.push('examined_espresso_cup');
    }
  } else if (actionId === 'EXAMINE_RED_STAIN') {
    if (!state.canonical.evidenceIds.includes('red_stain_saucer')) {
      state.canonical.evidenceIds.push('red_stain_saucer');
    }
    if (!state.scene.establishedFactIds.includes('examined_red_stain')) {
      // First examination: ambiguous observation
      state.scene.establishedFactIds.push('examined_red_stain');
    } else if (!state.canonical.canonicalFlags.includes('red_stain_reexamined')) {
      // Second examination: flag that initial interpretation may be wrong
      state.canonical.canonicalFlags.push('red_stain_reexamined');
      // Canon rule: origin was accidental, later adopted deliberately as symbol
      // DO NOT set fact yet — this remains a Theory seed, not a Canon fact
    }
  } else if (actionId === 'TALK_TO_HANIYEH') {
    if (!state.scene.establishedFactIds.includes('talked_to_haniyeh')) {
      state.scene.establishedFactIds.push('talked_to_haniyeh');
    }
    if (state.npcMemory.haniyeh) {
      state.npcMemory.haniyeh.lastInteractionTurn = state.scene.turn;
    }
  } else if (actionId === 'OBSERVE_PENTI') {
    if (!state.scene.establishedFactIds.includes('observed_penti_avoidance')) {
      state.scene.establishedFactIds.push('observed_penti_avoidance');
    }
  } else if (actionId === 'OBSERVE_CAFE_INTERIOR') {
    if (!state.scene.establishedFactIds.includes('observed_cafe_interior')) {
      state.scene.establishedFactIds.push('observed_cafe_interior');
    }

  // ── The Guest ──
  } else if (actionId === 'OBSERVE_THE_GUEST') {
    if (!state.scene.establishedFactIds.includes('observed_the_guest')) {
      state.scene.establishedFactIds.push('observed_the_guest');
      state.scene.establishedFactIds.push('fact_the_guest_presence');
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'TALK_TO_THE_GUEST') {
    if (!state.scene.establishedFactIds.includes('talked_to_the_guest')) {
      state.scene.establishedFactIds.push('talked_to_the_guest');
      // Canonical utterance: The Guest
      state.scene.establishedFactIds.push('fact_the_guest_pentimento_remark');
    }
    if (!state.canonical.canonicalFlags.includes('the_guest_encountered')) {
      state.canonical.canonicalFlags.push('the_guest_encountered');
    }
    processTurnTheories(state, playerInput);

  // ── Red Glove ──
  } else if (actionId === 'EXAMINE_RED_GLOVE') {
    if (!state.canonical.evidenceIds.includes('red_glove_object')) {
      // Evidence: object exists. No identity or interpretation Canon-defined.
      state.canonical.evidenceIds.push('red_glove_object');
    }
    if (!state.scene.establishedFactIds.includes('examined_red_glove')) {
      state.scene.establishedFactIds.push('examined_red_glove');
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'ANALYZE_RED_GLOVE') {
    // Second pass — still no Canon identity, but Theory Ledger can grow
    if (!state.scene.establishedFactIds.includes('analyzed_red_glove')) {
      state.scene.establishedFactIds.push('analyzed_red_glove');
    }
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 03 (The Counter) ──
  else if (actionId === 'APPROACH_COUNTER') {
    state.canonical.currentNode = 'NODE_03';
    state.canonical.currentScene = 'scene_counter';
    state.scene.nodeId = 'NODE_03';
    state.scene.sceneId = 'scene_counter';
    state.scene.activeEntityIds = [...NODE_03_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_03_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('approached_counter')) {
      state.canonical.canonicalFlags.push('approached_counter');
    }

    if (!state.npcMemory.yashin) {
      state.npcMemory.yashin = {
        awareness: ['pos_order_table_5', 'espresso_single_shot'],
        beliefs: [
          {
            summary: 'مشتری میز ۵ عجله داشت و به سمت تابلوی گالری انتهای سالن نگاه می‌کرد',
            confidence: 'high',
          },
        ],
        impressions: [],
        commitments: [],
        rapport: 0,
        lastInteractionTurn: state.scene.turn,
      };
    }

    if (!state.npcMemory.mani) {
      state.npcMemory.mani = {
        awareness: ['customer_physical_build', 'ignored_joke'],
        beliefs: [
          {
            summary: 'مشتری قدبلند و معذب بود و در برابر شوخی مانی سرش را حتی بالا نیاورد',
            confidence: 'high',
          },
        ],
        impressions: [],
        commitments: [],
        rapport: 0,
        lastInteractionTurn: state.scene.turn,
      };
    }
  }

  // ── NODE 03 Actions ──
  else if (actionId === 'TALK_TO_YASHIN') {
    if (!state.scene.establishedFactIds.includes('talked_to_yashin')) {
      state.scene.establishedFactIds.push('talked_to_yashin');
    }
    if (state.npcMemory.yashin) {
      state.npcMemory.yashin.lastInteractionTurn = state.scene.turn;
    }
  } else if (actionId === 'TALK_TO_MANI') {
    if (!state.scene.establishedFactIds.includes('talked_to_mani')) {
      state.scene.establishedFactIds.push('talked_to_mani');
    }
    if (state.npcMemory.mani) {
      state.npcMemory.mani.lastInteractionTurn = state.scene.turn;
    }
  } else if (actionId === 'CHECK_POS_ORDERS') {
    if (!state.canonical.evidenceIds.includes('pos_order_table_5_receipt')) {
      state.canonical.evidenceIds.push('pos_order_table_5_receipt');
    }
    if (!state.scene.establishedFactIds.includes('checked_pos_orders')) {
      state.scene.establishedFactIds.push('checked_pos_orders');
    }
  }

  // ── Transition to NODE 04 (Espresso Machine / Steam Wand) ──
  else if (actionId === 'EXAMINE_ESPRESSO_MACHINE') {
    state.canonical.currentNode = 'NODE_04';
    state.canonical.currentScene = 'scene_espresso_machine';
    state.scene.nodeId = 'NODE_04';
    state.scene.sceneId = 'scene_espresso_machine';
    state.scene.activeEntityIds = [...NODE_04_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_04_INITIAL_STATE.visibleObjectIds];

    if (!state.scene.establishedFactIds.includes('examined_espresso_machine')) {
      state.scene.establishedFactIds.push('examined_espresso_machine');
    }
    state.lastAudioLoss = processAudioInformationLoss(state, actionId, playerInput);
  }

  // ── NODE 04 Actions ──
  else if (actionId === 'EXAMINE_STEAM_WAND') {
    if (!state.scene.establishedFactIds.includes('examined_steam_wand')) {
      state.scene.establishedFactIds.push('examined_steam_wand');
    }
    state.lastAudioLoss = processAudioInformationLoss(state, actionId, playerInput);
  } else if (actionId === 'LISTEN_THROUGH_STEAM') {
    if (!state.scene.establishedFactIds.includes('listened_through_steam')) {
      state.scene.establishedFactIds.push('listened_through_steam');
    }
    state.lastAudioLoss = processAudioInformationLoss(state, actionId, playerInput);
  } else if (actionId === 'QUESTION_ABOUT_MASKED_LINE') {
    state.lastAudioLoss = processAudioInformationLoss(state, actionId, playerInput);
  }

  // ── Transition to NODE 05 (Coffee Roast / Cupping) ──
  else if (actionId === 'INSPECT_COFFEE_BEANS_TRAY') {
    state.canonical.currentNode = 'NODE_05';
    state.canonical.currentScene = 'scene_roast_cupping';
    state.scene.nodeId = 'NODE_05';
    state.scene.sceneId = 'scene_roast_cupping';
    state.scene.activeEntityIds = [...NODE_05_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_05_INITIAL_STATE.visibleObjectIds];

    if (!state.scene.establishedFactIds.includes('inspected_coffee_tray')) {
      state.scene.establishedFactIds.push('inspected_coffee_tray');
    }
  }

  // ── NODE 05 Actions ──
  else if (actionId === 'EXAMINE_UNKNOWN_SAMPLE') {
    if (!state.scene.establishedFactIds.includes('examined_unknown_sample')) {
      state.scene.establishedFactIds.push('examined_unknown_sample');
    }
  } else if (actionId === 'ASK_YASHIN_ABOUT_ROAST') {
    if (!state.canonical.evidenceIds.includes('yashin_lineage_observation')) {
      state.canonical.evidenceIds.push('yashin_lineage_observation');
    }
    if (!state.scene.establishedFactIds.includes('asked_yashin_about_roast')) {
      state.scene.establishedFactIds.push('asked_yashin_about_roast');
    }
  } else if (actionId === 'ANALYZE_BEAN_LINEAGE') {
    if (!state.scene.establishedFactIds.includes('analyzed_bean_lineage')) {
      state.scene.establishedFactIds.push('analyzed_bean_lineage');
    }
  }

  // ── Transition to NODE 06 (Gallery & Central Painting) ──
  else if (actionId === 'APPROACH_GALLERY') {
    state.canonical.currentNode = 'NODE_06';
    state.canonical.currentScene = 'scene_gallery';
    state.scene.nodeId = 'NODE_06';
    state.scene.sceneId = 'scene_gallery';
    state.scene.activeEntityIds = [...NODE_06_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_06_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('entered_gallery')) {
      state.canonical.canonicalFlags.push('entered_gallery');
    }
  }

  // ── NODE 06 Actions (Investigation Depth) ──
  else if (
    actionId === 'EXAMINE_PAINTING_GENERAL' ||
    actionId === 'EXAMINE_PAINTING_CLOSE_SURFACE' ||
    actionId === 'EXAMINE_PAINTING_ANGLED_LIGHT' ||
    actionId === 'ANALYZE_PAINTING_ART_HISTORIAN'
  ) {
    const invRes = processInvestigationDepth(state, 'central_painting', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('underpaint_line_visible')) {
      if (!state.canonical.evidenceIds.includes('underpaint_line_visible')) {
        state.canonical.evidenceIds.push('underpaint_line_visible');
      }
    }
    // WINDOW SEED — unlocks when viewing at angled light (depth ≥ 2)
    if (
      (actionId === 'EXAMINE_PAINTING_ANGLED_LIGHT' || actionId === 'ANALYZE_PAINTING_ART_HISTORIAN') &&
      !state.scene.establishedFactIds.includes('fact_painting_window_reflection')
    ) {
      state.scene.establishedFactIds.push('fact_painting_window_reflection');
    }
  } else if (actionId === 'ASK_NPC_ABOUT_PAINTING') {
    if (!state.scene.establishedFactIds.includes('asked_npc_about_painting')) {
      state.scene.establishedFactIds.push('asked_npc_about_painting');
    }
  } else if (actionId === 'TOUCH_OR_SCRAPE_PAINTING') {
    const invRes = processInvestigationDepth(state, 'central_painting', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    state.canonical.stress = Math.min(100, state.canonical.stress + 5);
    state.canonical.threat = Math.min(100, state.canonical.threat + 5);
    if (state.npcMemory.mani) {
      state.npcMemory.mani.impressions.push({ tag: 'attempted_damage_to_art' });
      state.npcMemory.mani.rapport = Math.max(-10, (state.npcMemory.mani.rapport || 0) - 2);
    }
  }

  // ── Transition to NODE 07 (Back of the Painting & Torn Label) ──
  else if (actionId === 'INSPECT_BEHIND_PAINTING' || actionId === 'LIFT_PAINTING_CAREFULLY') {
    state.canonical.currentNode = 'NODE_07';
    state.canonical.currentScene = 'scene_painting_back';
    state.scene.nodeId = 'NODE_07';
    state.scene.sceneId = 'scene_painting_back';
    state.scene.activeEntityIds = [...NODE_07_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_07_INITIAL_STATE.visibleObjectIds];

    if (!state.scene.establishedFactIds.includes('fact_painting_back_accessible')) {
      state.scene.establishedFactIds.push('fact_painting_back_accessible');
    }
  }

  // ── NODE 07 Actions (Theory Ledger & Raw Facts) ──
  else if (actionId === 'EXAMINE_BACK_LABEL') {
    const newEvidence = ['old_ownership_label', 'partially_torn_label', 'label_numbers_14_3_7_55'];
    for (const ev of newEvidence) {
      if (!state.canonical.evidenceIds.includes(ev)) {
        state.canonical.evidenceIds.push(ev);
      }
    }
    if (!state.scene.establishedFactIds.includes('examined_back_label')) {
      state.scene.establishedFactIds.push('examined_back_label');
    }
  } else if (actionId === 'PROPOSE_THEORY') {
    processTurnTheories(state, playerInput);
  } else if (actionId === 'PEEL_REMAINING_LABEL') {
    state.canonical.stress = Math.min(100, state.canonical.stress + 5);
    state.canonical.threat = Math.min(100, state.canonical.threat + 5);
    if (state.npcMemory.mani) {
      state.npcMemory.mani.impressions.push({ tag: 'attempted_tampering_with_label' });
      state.npcMemory.mani.rapport = Math.max(-10, (state.npcMemory.mani.rapport || 0) - 2);
    }
  } else if (actionId === 'ASK_NPC_ABOUT_LABEL') {
    if (!state.scene.establishedFactIds.includes('asked_npc_about_label')) {
      state.scene.establishedFactIds.push('asked_npc_about_label');
    }
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 08 (Storage & Comparative Observation) ──
  else if (actionId === 'APPROACH_STORAGE') {
    state.canonical.currentNode = 'NODE_08';
    state.canonical.currentScene = 'scene_storage';
    state.scene.nodeId = 'NODE_08';
    state.scene.sceneId = 'scene_storage';
    state.scene.activeEntityIds = [...NODE_08_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_08_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('entered_storage')) {
      state.canonical.canonicalFlags.push('entered_storage');
    }
  }

  // ── NODE 08 Actions ──
  else if (actionId === 'EXAMINE_STORAGE_GENERAL') {
    const invRes = processInvestigationDepth(state, 'storage_area', actionId, playerInput);
    state.lastInvestigationResult = invRes;
  } else if (actionId === 'COMPARE_STORAGE_BOXES') {
    const invRes = processInvestigationDepth(state, 'storage_area', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('unusually_clean_box')) {
      if (!state.canonical.evidenceIds.includes('unusually_clean_box')) {
        state.canonical.evidenceIds.push('unusually_clean_box');
      }
    }
  } else if (actionId === 'EXAMINE_CLEAN_BOX') {
    if (!state.scene.establishedFactIds.includes('examined_clean_box')) {
      state.scene.establishedFactIds.push('examined_clean_box');
    }
  } else if (actionId === 'MOVE_OR_OPEN_CLEAN_BOX') {
    if (!state.scene.establishedFactIds.includes('inspected_clean_box_physically')) {
      state.scene.establishedFactIds.push('inspected_clean_box_physically');
    }
  } else if (actionId === 'ASK_NPC_ABOUT_STORAGE') {
    if (!state.scene.establishedFactIds.includes('asked_npc_about_storage')) {
      state.scene.establishedFactIds.push('asked_npc_about_storage');
    }
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 09 (Kitchen & Arian Mehri Contrast Node) ──
  else if (actionId === 'APPROACH_KITCHEN' || actionId === 'ENTER_KITCHEN') {
    state.canonical.currentNode = 'NODE_09';
    state.canonical.currentScene = 'scene_kitchen';
    state.scene.nodeId = 'NODE_09';
    state.scene.sceneId = 'scene_kitchen';
    state.scene.activeEntityIds = [...NODE_09_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_09_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('entered_kitchen')) {
      state.canonical.canonicalFlags.push('entered_kitchen');
    }

    if (!state.npcMemory.arian_mehri) {
      state.npcMemory.arian_mehri = {
        awareness: ['table_7_extra_fries_order', 'night_shift_kitchen', 'devops_deploy_issue'],
        beliefs: [
          {
            summary: 'سفارش‌های کافه امشب طبق روال بوده و مشتری میز ۷ فقط سیب‌زمینی اضافه خواسته است',
            confidence: 'high',
          },
        ],
        impressions: [],
        commitments: [],
        rapport: 0,
        lastInteractionTurn: state.scene.turn,
      };
    }
  }

  // ── NODE 09 Actions ──
  else if (actionId === 'TALK_TO_ARIAN_MEHRI') {
    if (!state.scene.establishedFactIds.includes('talked_to_arian_mehri')) {
      state.scene.establishedFactIds.push('talked_to_arian_mehri');
    }
    if (state.npcMemory.arian_mehri) {
      state.npcMemory.arian_mehri.lastInteractionTurn = state.scene.turn;
    }
  } else if (actionId === 'EXAMINE_KITCHEN_ORDER') {
    if (!state.scene.establishedFactIds.includes('examined_table_7_ticket')) {
      state.scene.establishedFactIds.push('examined_table_7_ticket');
    }
  } else if (actionId === 'ASK_MEHRI_ABOUT_CASE') {
    if (!state.scene.establishedFactIds.includes('asked_mehri_about_case')) {
      state.scene.establishedFactIds.push('asked_mehri_about_case');
    }
    if (state.npcMemory.arian_mehri) {
      state.npcMemory.arian_mehri.lastInteractionTurn = state.scene.turn;
    }
  } else if (actionId === 'OBSERVE_KITCHEN_ACTIVITY') {
    if (!state.scene.establishedFactIds.includes('observed_kitchen_routine')) {
      state.scene.establishedFactIds.push('observed_kitchen_routine');
    }
  }

  // ── Transition to NODE 10 (Penti Area & Environmental Witness) ──
  else if (actionId === 'APPROACH_PENTI_AREA') {
    state.canonical.currentNode = 'NODE_10';
    state.canonical.currentScene = 'scene_penti_area';
    state.scene.nodeId = 'NODE_10';
    state.scene.sceneId = 'scene_penti_area';
    state.scene.activeEntityIds = [...NODE_10_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_10_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('entered_penti_area')) {
      state.canonical.canonicalFlags.push('entered_penti_area');
    }
  }

  // ── NODE 10 Actions ──
  else if (actionId === 'OBSERVE_PENTI') {
    const invRes = processInvestigationDepth(state, 'penti_area', actionId, playerInput);
    state.lastInvestigationResult = invRes;
  } else if (actionId === 'OBSERVE_PENTI_BEHAVIOR') {
    const invRes = processInvestigationDepth(state, 'penti_area', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('penti_avoids_new_object')) {
      if (!state.canonical.evidenceIds.includes('penti_avoids_new_object')) {
        state.canonical.evidenceIds.push('penti_avoids_new_object');
      }
    }
  } else if (actionId === 'EXAMINE_PENTI_NEW_OBJECT') {
    if (!state.scene.establishedFactIds.includes('examined_penti_new_object')) {
      state.scene.establishedFactIds.push('examined_penti_new_object');
    }
  } else if (actionId === 'SMELL_PENTI_NEW_OBJECT' || actionId === 'ASK_YASHIN_TO_SMELL_OBJECT') {
    const invRes = processInvestigationDepth(state, 'penti_area', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('object_has_different_cleaner_smell')) {
      if (!state.canonical.evidenceIds.includes('object_has_different_cleaner_smell')) {
        state.canonical.evidenceIds.push('object_has_different_cleaner_smell');
      }
    }
    if (actionId === 'ASK_YASHIN_TO_SMELL_OBJECT' && !state.scene.establishedFactIds.includes('yashin_smell_sensory_confirmed')) {
      state.scene.establishedFactIds.push('yashin_smell_sensory_confirmed');
    }
  } else if (actionId === 'ASK_HANIYEH_ABOUT_PENTI') {
    if (!state.scene.establishedFactIds.includes('asked_haniyeh_about_penti')) {
      state.scene.establishedFactIds.push('asked_haniyeh_about_penti');
    }
    if (state.npcMemory.haniyeh) {
      state.npcMemory.haniyeh.lastInteractionTurn = state.scene.turn;
    }
  } else if (actionId === 'BRING_OBJECT_TO_PENTI') {
    if (!state.scene.establishedFactIds.includes('penti_pulled_away_from_object')) {
      state.scene.establishedFactIds.push('penti_pulled_away_from_object');
    }
  } else if (actionId === 'SHOW_UNRELATED_CLUE_TO_PENTI') {
    // Penti behaves like an ordinary cat: ignores unrelated items entirely
    if (!state.scene.establishedFactIds.includes('penti_ignored_unrelated_clue')) {
      state.scene.establishedFactIds.push('penti_ignored_unrelated_clue');
    }
  }

  // ── Transition to NODE 11 (Ledger / Account Office Forensics) ──
  else if (actionId === 'APPROACH_OFFICE') {
    state.canonical.currentNode = 'NODE_11';
    state.canonical.currentScene = 'scene_office';
    state.scene.nodeId = 'NODE_11';
    state.scene.sceneId = 'scene_office';
    state.scene.activeEntityIds = [...NODE_11_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_11_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('entered_office')) {
      state.canonical.canonicalFlags.push('entered_office');
    }
  }

  // ── NODE 11 Actions ──
  else if (actionId === 'EXAMINE_OFFICE_LEDGER' || actionId === 'EXAMINE_INVOICE_RG_LOT55') {
    const invRes = processInvestigationDepth(state, 'office_invoice', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('invoice_text_rg_lot55_returned')) {
      if (!state.canonical.evidenceIds.includes('invoice_text_rg_lot55_returned')) {
        state.canonical.evidenceIds.push('invoice_text_rg_lot55_returned');
      }
    }
  } else if (actionId === 'COMPARE_OFFICE_INVOICES') {
    const invRes = processInvestigationDepth(state, 'office_invoice', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('invoice_font_differs_from_others')) {
      if (!state.canonical.evidenceIds.includes('invoice_font_differs_from_others')) {
        state.canonical.evidenceIds.push('invoice_font_differs_from_others');
      }
    }
  } else if (actionId === 'ASK_SALAR_ABOUT_INVOICE' || actionId === 'ANALYZE_INVOICE_FORGERY') {
    const invRes = processInvestigationDepth(state, 'office_invoice', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('invoice_is_forged')) {
      if (!state.canonical.evidenceIds.includes('invoice_is_forged')) {
        state.canonical.evidenceIds.push('invoice_is_forged');
      }
    }
    if (actionId === 'ASK_SALAR_ABOUT_INVOICE' && !state.scene.establishedFactIds.includes('salar_ledger_mind_confirmed_forgery')) {
      state.scene.establishedFactIds.push('salar_ledger_mind_confirmed_forgery');
    }
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 12 (Cameras / Missing Footage Forensics) ──
  else if (actionId === 'APPROACH_SECURITY_DESK') {
    state.canonical.currentNode = 'NODE_12';
    state.canonical.currentScene = 'scene_security_desk';
    state.scene.nodeId = 'NODE_12';
    state.scene.sceneId = 'scene_security_desk';
    state.scene.activeEntityIds = [...NODE_12_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_12_INITIAL_STATE.visibleObjectIds];

    if (!state.canonical.canonicalFlags.includes('entered_security_desk')) {
      state.canonical.canonicalFlags.push('entered_security_desk');
    }
  }

  // ── NODE 12 Actions ──
  else if (actionId === 'EXAMINE_CAMERA_SYSTEM') {
    const invRes = processInvestigationDepth(state, 'camera_system', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('seven_minute_camera_gap')) {
      if (!state.canonical.evidenceIds.includes('seven_minute_camera_gap')) {
        state.canonical.evidenceIds.push('seven_minute_camera_gap');
      }
    }
  } else if (actionId === 'INSPECT_CAMERA_LOGS' || actionId === 'ASK_MEHRI_ABOUT_CAMERAS' || actionId === 'ANALYZE_WRITE_EVENTS') {
    const invRes = processInvestigationDepth(state, 'camera_system', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (invRes.newlyUnlockedFactIds.includes('footage_was_never_written')) {
      if (!state.canonical.evidenceIds.includes('footage_was_never_written')) {
        state.canonical.evidenceIds.push('footage_was_never_written');
      }
    }
    if (actionId === 'ASK_MEHRI_ABOUT_CAMERAS' && !state.scene.establishedFactIds.includes('mehri_logs_confirmed_never_written')) {
      state.scene.establishedFactIds.push('mehri_logs_confirmed_never_written');
    }
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 13 (Hosseini Alley / Threat Perception) ──
  else if (actionId === 'EXIT_CAFE_TO_ALLEY') {
    state.canonical.currentNode = 'NODE_13';
    state.canonical.currentScene = 'scene_hosseini_alley';
    state.scene.nodeId = 'NODE_13';
    state.scene.sceneId = 'scene_hosseini_alley';
    state.scene.activeEntityIds = [...NODE_13_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_13_INITIAL_STATE.visibleObjectIds];

    state.canonical.environmentSafety = 'EXPOSED_OUTDOOR';
    state.canonical.threatActive = true;

    if (!state.entityObservationCount) state.entityObservationCount = {};
    state.entityObservationCount['parked_car'] = (state.entityObservationCount['parked_car'] || 1) + 1;

    if (!state.canonical.canonicalFlags.includes('exited_to_alley')) {
      state.canonical.canonicalFlags.push('exited_to_alley');
    }
  }

  // ── NODE 13 Actions ──
  else if (actionId === 'OBSERVE_HOSSEINI_ALLEY') {
    if (!state.scene.establishedFactIds.includes('fact_hosseini_alley_outdoor')) {
      state.scene.establishedFactIds.push('fact_hosseini_alley_outdoor');
    }
  } else if (actionId === 'LISTEN_DISTANT_MOTORCYCLE') {
    if (!state.scene.establishedFactIds.includes('fact_distant_motorcycle_heard')) {
      state.scene.establishedFactIds.push('fact_distant_motorcycle_heard');
    }
  } else if (actionId === 'OBSERVE_SECOND_CAR_SIGHTING') {
    if (!state.scene.establishedFactIds.includes('fact_parked_car_second_sighting')) {
      state.scene.establishedFactIds.push('fact_parked_car_second_sighting');
    }
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 14 (Parked Car / Red Herring Paranoia) ──
  else if (actionId === 'APPROACH_PARKED_CAR') {
    state.canonical.currentNode = 'NODE_14';
    state.canonical.currentScene = 'scene_parked_car';
    state.scene.nodeId = 'NODE_14';
    state.scene.sceneId = 'scene_parked_car';
    state.scene.activeEntityIds = [...NODE_14_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_14_INITIAL_STATE.visibleObjectIds];
  }

  // ── NODE 14 Actions ──
  else if (actionId === 'EXAMINE_PARKED_CAR' || actionId === 'CHECK_CAR_WINDOWS_OR_INTERIOR' || actionId === 'CHECK_CAR_LICENSE_PLATE' || actionId === 'WAIT_AND_WATCH_CAR') {
    const invRes = processInvestigationDepth(state, 'parked_car', actionId, playerInput);
    state.lastInvestigationResult = invRes;

    if (!state.redHerringInvestment) state.redHerringInvestment = {};
    if (!state.redHerringPenaltiesApplied) state.redHerringPenaltiesApplied = {};

    state.redHerringInvestment['parked_car'] = (state.redHerringInvestment['parked_car'] || 0) + 1;

    // Overfocus threshold: >= 3 paranoid/repetitive checks -> Stress +15 exactly once
    if (state.redHerringInvestment['parked_car'] >= 3 && !state.redHerringPenaltiesApplied['parked_car']) {
      state.canonical.stress = Math.min(100, state.canonical.stress + 15);
      state.redHerringPenaltiesApplied['parked_car'] = true;
    }

    processTurnTheories(state, playerInput);
  } else if (actionId === 'ATTEMPT_BREAK_IN_CAR') {
    state.canonical.threat = Math.min(100, state.canonical.threat + 10);
    state.canonical.stress = Math.min(100, state.canonical.stress + 5);
    if (!state.scene.establishedFactIds.includes('attempted_car_break_in')) {
      state.scene.establishedFactIds.push('attempted_car_break_in');
    }
  } else if (actionId === 'ASK_NPC_ABOUT_CAR') {
    if (!state.scene.establishedFactIds.includes('asked_npc_about_car')) {
      state.scene.establishedFactIds.push('asked_npc_about_car');
    }
    processTurnTheories(state, playerInput);
  }

  // ── NODE 15 Actions (Back Route / Conflicting Witnesses) ──
  else if (actionId === 'ASK_WITNESS_ABOUT_REAR_ROUTE') {
    initWitnessRolesAndStatements(state);
    if (!state.scene.establishedFactIds.includes('fact_route_testimony_rear')) {
      state.scene.establishedFactIds.push('fact_route_testimony_rear');
    }
    if (state.scene.establishedFactIds.includes('fact_route_testimony_main') && !state.scene.establishedFactIds.includes('fact_route_testimony_conflict')) {
      state.scene.establishedFactIds.push('fact_route_testimony_conflict');
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'ASK_WITNESS_ABOUT_MAIN_ROUTE') {
    initWitnessRolesAndStatements(state);
    if (!state.scene.establishedFactIds.includes('fact_route_testimony_main')) {
      state.scene.establishedFactIds.push('fact_route_testimony_main');
    }
    if (state.scene.establishedFactIds.includes('fact_route_testimony_rear') && !state.scene.establishedFactIds.includes('fact_route_testimony_conflict')) {
      state.scene.establishedFactIds.push('fact_route_testimony_conflict');
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'COMPARE_WITNESS_STATEMENTS') {
    initWitnessRolesAndStatements(state);
    const invRes = processInvestigationDepth(state, 'witness_conflict', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (!state.scene.establishedFactIds.includes('fact_route_testimony_conflict')) {
      state.scene.establishedFactIds.push('fact_route_testimony_conflict');
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'INTERROGATE_WITNESS_TIME_REFERENCE') {
    initWitnessRolesAndStatements(state);
    const invRes = processInvestigationDepth(state, 'witness_conflict', actionId, playerInput);
    state.lastInvestigationResult = invRes;
    if (!state.scene.establishedFactIds.includes('fact_witness_clock_discrepancy')) {
      state.scene.establishedFactIds.push('fact_witness_clock_discrepancy');
    }
    if (!state.canonical.evidenceIds.includes('fact_witness_clock_discrepancy')) {
      state.canonical.evidenceIds.push('fact_witness_clock_discrepancy');
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'ANCHOR_WITNESS_MEMORY') {
    initWitnessRolesAndStatements(state);
    if (!state.scene.establishedFactIds.includes('anchored_witness_memory')) {
      state.scene.establishedFactIds.push('anchored_witness_memory');
    }
  } else if (actionId === 'ACCUSE_WITNESS_OF_LYING') {
    initWitnessRolesAndStatements(state);
    // Accusation causes social defensiveness (stress/rapport effect) but does NOT mutate truth
    state.canonical.stress = Math.min(100, state.canonical.stress + 2);
    processTurnTheories(state, playerInput);
  }

  // ── Transition to NODE 16 (The Meeting / Collector Social Duel) ──
  else if (actionId === 'APPROACH_COLLECTOR_MEETING') {
    state.canonical.currentNode = 'NODE_16';
    state.canonical.currentScene = 'scene_collector_meeting';
    state.scene.nodeId = 'NODE_16';
    state.scene.sceneId = 'scene_collector_meeting';
    state.scene.activeEntityIds = [...NODE_16_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_16_INITIAL_STATE.visibleObjectIds];

    state.socialDuel = {
      suspicion: 20,
      pressure: 50,
      exposure: 10,
      silenceStreak: 0,
      revealedCluesToOpponent: [],
      bluffAttempts: 0,
      offerPresented: false,
      dialogueStage: 'opening',
    };

    if (!state.scene.establishedFactIds.includes('fact_collector_public_meeting')) {
      state.scene.establishedFactIds.push('fact_collector_public_meeting');
    }
    if (!state.scene.establishedFactIds.includes('fact_collector_canonical_line_1')) {
      state.scene.establishedFactIds.push('fact_collector_canonical_line_1');
    }
    if (!state.scene.establishedFactIds.includes('fact_salar_canonical_line_2')) {
      state.scene.establishedFactIds.push('fact_salar_canonical_line_2');
    }
    if (!state.scene.establishedFactIds.includes('fact_collector_canonical_line_3')) {
      state.scene.establishedFactIds.push('fact_collector_canonical_line_3');
    }
  }

  // ── NODE 16 Actions (Social Duel) ──
  else if (actionId === 'TALK_TO_COLLECTOR' || actionId === 'ASK_COLLECTOR_ABOUT_INTENT' || actionId === 'ASK_COLLECTOR_ABOUT_LOT55' || actionId === 'ASK_COLLECTOR_ABOUT_PAINTING') {
    if (!state.socialDuel) {
      state.socialDuel = { suspicion: 20, pressure: 50, exposure: 10, silenceStreak: 0, revealedCluesToOpponent: [], bluffAttempts: 0, offerPresented: false, dialogueStage: 'duel' };
    }
    state.socialDuel.silenceStreak = 0;
    state.socialDuel.dialogueStage = 'duel';

    // Cost of Revealing Information: if player explicitly discloses known evidence
    const revealsClue = /Lot.*55|هفت.*دقیقه|پاک.*نشده|نوشته.*نشده|فاکتور.*جعل|رنگ.*زیرین|خط.*مخفی/.test(playerInput);
    if (revealsClue) {
      const clueKey = playerInput.includes('Lot') ? 'Lot_55' : playerInput.includes('دقیقه') ? '7_min_gap' : 'forged_invoice';
      if (!state.socialDuel.revealedCluesToOpponent.includes(clueKey)) {
        state.socialDuel.revealedCluesToOpponent.push(clueKey);
        state.socialDuel.suspicion = Math.min(100, state.socialDuel.suspicion + 15);
      }
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'BLUFF_COLLECTOR') {
    if (!state.socialDuel) {
      state.socialDuel = { suspicion: 20, pressure: 50, exposure: 10, silenceStreak: 0, revealedCluesToOpponent: [], bluffAttempts: 0, offerPresented: false, dialogueStage: 'duel' };
    }
    state.socialDuel.silenceStreak = 0;
    state.socialDuel.bluffAttempts += 1;

    const isGroundedBluff = /تابلو.*فروختیم|فروخته.*شده|اسناد.*دست.*ماست|شکایت.*کردیم|پلیس/.test(playerInput);
    if (isGroundedBluff) {
      state.socialDuel.exposure = Math.min(100, state.socialDuel.exposure + 15);
      state.socialDuel.pressure = Math.max(0, state.socialDuel.pressure - 10);
    } else {
      state.socialDuel.suspicion = Math.min(100, state.socialDuel.suspicion + 15);
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'REMAIN_SILENT_TO_COLLECTOR') {
    if (!state.socialDuel) {
      state.socialDuel = { suspicion: 20, pressure: 50, exposure: 10, silenceStreak: 0, revealedCluesToOpponent: [], bluffAttempts: 0, offerPresented: false, dialogueStage: 'duel' };
    }
    state.socialDuel.silenceStreak += 1;

    if (state.socialDuel.silenceStreak === 1) {
      // First silence creates a bounded response opportunity (exposure increases, pressure shifts)
      state.socialDuel.exposure = Math.min(100, state.socialDuel.exposure + 10);
      state.socialDuel.pressure = Math.max(0, state.socialDuel.pressure - 5);

      // Financial offer is only presented if social duel has progressed enough (exposure >= 25)
      if (state.socialDuel.exposure >= 25 && !state.socialDuel.offerPresented) {
        state.socialDuel.offerPresented = true;
        if (!state.scene.establishedFactIds.includes('fact_collector_financial_offer_hint')) {
          state.scene.establishedFactIds.push('fact_collector_financial_offer_hint');
        }
      }
    } else {
      // Repeated silence yields diminishing returns
      state.socialDuel.pressure = Math.min(100, state.socialDuel.pressure + 10);
      state.socialDuel.suspicion = Math.min(100, state.socialDuel.suspicion + 5);
    }
  } else if (actionId === 'OBSERVE_COLLECTOR_REACTIONS') {
    if (!state.socialDuel) {
      state.socialDuel = { suspicion: 20, pressure: 50, exposure: 10, silenceStreak: 0, revealedCluesToOpponent: [], bluffAttempts: 0, offerPresented: false, dialogueStage: 'duel' };
    }
    state.socialDuel.silenceStreak = 0;
  } else if (actionId === 'ACCEPT_FINANCIAL_OFFER') {
    // Explicit acceptance of the deal triggers ENDING: THE PRICE
    state.canonical.endingId = 'ENDING_THE_PRICE';
    if (!state.canonical.canonicalFlags.includes('accepted_the_price')) {
      state.canonical.canonicalFlags.push('accepted_the_price');
    }
  } else if (actionId === 'REJECT_FINANCIAL_OFFER') {
    if (state.socialDuel) {
      state.socialDuel.pressure = Math.min(100, state.socialDuel.pressure + 15);
      state.socialDuel.silenceStreak = 0;
    }
    if (!state.canonical.canonicalFlags.includes('rejected_financial_offer')) {
      state.canonical.canonicalFlags.push('rejected_financial_offer');
    }
  } else if (actionId === 'WITHDRAW_FROM_MEETING') {
    if (state.socialDuel) {
      state.socialDuel.dialogueStage = 'concluded';
    }
    state.canonical.currentNode = 'NODE_02';
    state.canonical.currentScene = 'scene_table_5';
    state.scene.nodeId = 'NODE_02';
    state.scene.sceneId = 'scene_table_5';
    state.scene.activeEntityIds = [...NODE_02_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_02_INITIAL_STATE.visibleObjectIds];
  }

  // ── Transition to NODE 17 (Archive / Synthesis Puzzle) ──
  else if (actionId === 'OPEN_ARCHIVE_WORKSPACE') {
    state.canonical.currentNode = 'NODE_17';
    state.canonical.currentScene = 'scene_archive_workspace';
    state.scene.nodeId = 'NODE_17';
    state.scene.sceneId = 'scene_archive_workspace';
    state.scene.activeEntityIds = ['salar_salehi', 'yashin_shojaee', 'arian_mehri'];
    state.scene.visibleObjectIds = ['archive_workspace', 'timeline_board'];

    state.archiveWorkspace = {
      activeItems: buildArchiveItemsFromState(state),
      timelineClaims: [],
      connections: [],
      isFinalized: false,
    };

    if (!state.scene.establishedFactIds.includes('fact_archive_virtual_workspace_open')) {
      state.scene.establishedFactIds.push('fact_archive_virtual_workspace_open');
    }
  }

  // ── NODE 17 Actions ──
  else if (actionId === 'EXAMINE_ARCHIVE_ITEM') {
    if (!state.archiveWorkspace) {
      state.archiveWorkspace = {
        activeItems: buildArchiveItemsFromState(state),
        timelineClaims: [],
        connections: [],
        isFinalized: false,
      };
    }
  } else if (actionId === 'CONNECT_ARCHIVE_EVIDENCE') {
    if (!state.archiveWorkspace) {
      state.archiveWorkspace = {
        activeItems: buildArchiveItemsFromState(state),
        timelineClaims: [],
        connections: [],
        isFinalized: false,
      };
    }
    const id = `conn_${state.archiveWorkspace.connections.length + 1}`;
    let left = 'archive_invoice_rg_lot55';
    let right = 'archive_painting_label_numbers';
    if (playerInput.includes('دوربین') || playerInput.includes('شکاف')) {
      left = 'archive_camera_gap_7min';
      right = 'archive_invoice_rg_lot55';
    }
    state.archiveWorkspace.connections.push({
      id,
      leftEvidenceId: left,
      rightEvidenceId: right,
      reason: playerInput,
      status: 'PROPOSED',
    });
    processTurnTheories(state, playerInput);
  } else if (actionId === 'PROPOSE_TIMELINE_RELATION') {
    if (!state.archiveWorkspace) {
      state.archiveWorkspace = {
        activeItems: buildArchiveItemsFromState(state),
        timelineClaims: [],
        connections: [],
        isFinalized: false,
      };
    }

    let left = 'archive_painting_label_numbers';
    let right = 'archive_invoice_rg_lot55';
    let rel: 'BEFORE' | 'AFTER' | 'SAME_WINDOW' | 'UNKNOWN' = 'BEFORE';

    if (/بعد|پس.*از/.test(playerInput)) {
      rel = 'AFTER';
    } else if (/همزمان|همان.*بازه|یک.*پنجره/.test(playerInput)) {
      rel = 'SAME_WINDOW';
    } else if (/نامشخص|نمی‌دونم|شک.*دارم/.test(playerInput)) {
      rel = 'UNKNOWN';
    }

    if (playerInput.includes('دوربین') || playerInput.includes('شکاف') || playerInput.includes('مهری')) {
      left = 'archive_camera_gap_7min';
      right = 'archive_witness_clock_discrepancy';
    }

    const claimId = `claim_${left}_${rel}_${right}`;
    const existingIndex = state.archiveWorkspace.timelineClaims.findIndex(c => c.leftItemId === left && c.rightItemId === right);
    const newClaim = {
      id: claimId,
      leftItemId: left,
      relation: rel,
      rightItemId: right,
      supportingEvidenceIds: [left, right],
      status: 'OPEN' as const,
    };

    if (existingIndex >= 0) {
      state.archiveWorkspace.timelineClaims[existingIndex] = newClaim;
    } else {
      state.archiveWorkspace.timelineClaims.push(newClaim);
    }

    validateTimeline(state.archiveWorkspace.timelineClaims, CANONICAL_TIMELINE_CONSTRAINTS);
    processTurnTheories(state, playerInput);
  } else if (actionId === 'REVISE_TIMELINE_RELATION' || actionId === 'REMOVE_TIMELINE_RELATION') {
    if (state.archiveWorkspace) {
      if (actionId === 'REMOVE_TIMELINE_RELATION') {
        state.archiveWorkspace.timelineClaims.pop();
      }
      validateTimeline(state.archiveWorkspace.timelineClaims, CANONICAL_TIMELINE_CONSTRAINTS);
    }
    processTurnTheories(state, playerInput);
  } else if (actionId === 'RETRACT_THEORY') {
    processTurnTheories(state, playerInput);
  } else if (actionId === 'ASK_NPC_FOR_SYNTHESIS_HINT') {
    processTurnTheories(state, playerInput);
  } else if (actionId === 'SUBMIT_FINAL_TIMELINE') {
    if (state.archiveWorkspace) {
      const res = validateTimeline(state.archiveWorkspace.timelineClaims, CANONICAL_TIMELINE_CONSTRAINTS);
      if (res.isConsistent && state.archiveWorkspace.timelineClaims.length > 0) {
        state.archiveWorkspace.isFinalized = true;
        if (!state.canonical.canonicalFlags.includes('timeline_synthesis_finalized')) {
          state.canonical.canonicalFlags.push('timeline_synthesis_finalized');
        }
        // SHADOW SEED — activates only post-synthesis. Player should feel they discovered it,
        // not that it was newly created. Director may now allow ambiguous shadow references.
        if (!state.canonical.canonicalFlags.includes('shadow_seed_confirmable')) {
          state.canonical.canonicalFlags.push('shadow_seed_confirmable');
        }
      }
    }
  } else if (actionId === 'CLOSE_ARCHIVE_WORKSPACE') {
    state.canonical.currentNode = 'NODE_02';
    state.canonical.currentScene = 'scene_table_5';
    state.scene.nodeId = 'NODE_02';
    state.scene.sceneId = 'scene_table_5';
    state.scene.activeEntityIds = [...NODE_02_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_02_INITIAL_STATE.visibleObjectIds];
  }

  else if (actionId === 'RETURN_TO_TABLE_5') {
    state.canonical.currentNode = 'NODE_02';
    state.canonical.currentScene = 'scene_table_5';
    state.scene.nodeId = 'NODE_02';
    state.scene.sceneId = 'scene_table_5';
    state.scene.activeEntityIds = [...NODE_02_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_02_INITIAL_STATE.visibleObjectIds];
  }

  // ── Transition & Actions in NODE 18 (The Underpainting / Final Revelation) ──
  else if (actionId === 'EXAMINE_UNDERPAINTING_LAYERS' || actionId === 'SUPERIMPOSE_PAINTING_VERSIONS') {
    state.canonical.currentNode = 'NODE_18';
    state.canonical.currentScene = 'scene_underpainting';
    state.scene.nodeId = 'NODE_18';
    state.scene.sceneId = 'scene_underpainting';
    state.scene.activeEntityIds = [...NODE_18_INITIAL_STATE.activeEntityIds];
    state.scene.visibleObjectIds = [...NODE_18_INITIAL_STATE.visibleObjectIds];

    if (!state.scene.establishedFactIds.includes('fact_underpainting_four_stages')) {
      state.scene.establishedFactIds.push('fact_underpainting_four_stages');
    }
  } else if (actionId === 'REVEAL_PROVENANCE_CHAIN_55') {
    if (!state.canonical.canonicalFlags.includes('provenance_chain_understood')) {
      state.canonical.canonicalFlags.push('provenance_chain_understood');
    }
    if (!state.scene.establishedFactIds.includes('fact_provenance_not_geographic_map')) {
      state.scene.establishedFactIds.push('fact_provenance_not_geographic_map');
      state.scene.establishedFactIds.push('fact_provenance_terminus_55');
    }
  } else if (actionId === 'CONFRONT_FINAL_INTERPRETATION') {
    processTurnTheories(state, playerInput);
  } else if (actionId === 'MAKE_FINAL_DECISION_PRESERVE_TRUTH') {
    if (!state.canonical.canonicalFlags.includes('rejected_financial_offer')) {
      state.canonical.canonicalFlags.push('rejected_financial_offer');
    }
    if (!state.canonical.canonicalFlags.includes('protected_truth_above_all')) {
      state.canonical.canonicalFlags.push('protected_truth_above_all');
    }
  } else if (actionId === 'MAKE_FINAL_DECISION_PRESERVE_PEOPLE') {
    if (!state.canonical.canonicalFlags.includes('protected_group')) {
      state.canonical.canonicalFlags.push('protected_group');
    }
  } else if (actionId === 'MAKE_FINAL_DECISION_TAKE_PRICE') {
    if (!state.canonical.canonicalFlags.includes('accepted_financial_offer')) {
      state.canonical.canonicalFlags.push('accepted_financial_offer');
    }
  } else if (actionId === 'COMPLETE_RUN_AND_RESOLVE_ENDING') {
    const endingRes = resolveEnding(state);
    state.endingEvaluation = endingRes;
    state.canonical.endingId = endingRes.endingId;
    if (!state.canonical.canonicalFlags.includes('run_completed')) {
      state.canonical.canonicalFlags.push('run_completed');
    }
  }
}

export function applyValidatedTurn(
  state: RunState,
  validation: ValidationResult,
  interpretation: DirectorInterpretation,
  narrative: string,
  playerInput: string = ''
): void {
  // 1. Apply canonical action
  if (validation.acceptedActionId) {
    applyActionEffects(state, validation.acceptedActionId, playerInput);
  }

  // 2. Process Theory Ledger if player or NPC discussed theories
  if (interpretation.kind === 'theory' || /رمز|تاریخ|انبار|آدرس|فرضیه|حدس|شاید|به نظرم|جایگزین|انجمن/.test(playerInput)) {
    processTurnTheories(state, playerInput);
  }

  // 3. If physical action was attempted, apply deterministic physical resolver
  if (interpretation.kind === 'physical') {
    const physOutcome = resolvePhysicalAttempt(state, interpretation.targetId, interpretation.intentSummary);
    state.canonical.stress = Math.max(0, Math.min(100, state.canonical.stress + physOutcome.stressDelta));
    state.canonical.threat = Math.max(0, Math.min(100, state.canonical.threat + physOutcome.threatDelta));
    for (const flag of physOutcome.flagsToAdd) {
      if (!state.canonical.canonicalFlags.includes(flag)) {
        state.canonical.canonicalFlags.push(flag);
      }
    }
    if (physOutcome.npcImpressionTag && interpretation.targetId && state.npcMemory[interpretation.targetId]) {
      state.npcMemory[interpretation.targetId].impressions.push({
        tag: physOutcome.npcImpressionTag,
      });
      state.npcMemory[interpretation.targetId].rapport = Math.max(-10, Math.min(10, (state.npcMemory[interpretation.targetId].rapport || 0) - 2));
    }
  }

  // 4. Apply validated soft effects
  for (const effect of validation.acceptedSoftEffects) {
    if (effect.kind === 'stress') {
      state.canonical.stress = Math.max(0, Math.min(100, state.canonical.stress + effect.delta));
    } else if (effect.kind === 'threat') {
      state.canonical.threat = Math.max(0, Math.min(100, state.canonical.threat + effect.delta));
    } else if (effect.kind === 'rapport' && effect.npcId) {
      const npc = state.npcMemory[effect.npcId];
      if (npc) {
        npc.rapport = Math.max(-10, Math.min(10, (npc.rapport || 0) + effect.delta));
      }
    }
  }

  // 5. Follow up on deferred actions
  const followingStartStr = state.canonical.canonicalFlags.find(f => f.startsWith('following_started_turn:'));
  if (followingStartStr) {
    const startTurn = parseInt(followingStartStr.split(':')[1], 10);
    if (state.scene.turn >= startTurn + 2) {
      state.scene.activeEntityIds = state.scene.activeEntityIds.filter(id => id !== 'exiting_man');
    }
  }

  // 6. Record scene beat with full player input and narrative for continuity
  const beat: SceneBeat = {
    turn: state.scene.turn,
    summary: narrative.substring(0, 120) + (narrative.length > 120 ? '...' : ''),
    playerInput: playerInput ? playerInput.trim() : undefined,
    narrative: narrative.trim(),
    actors: ['player'],
    topics: [],
    importance: (validation.acceptedActionId || interpretation.kind === 'physical' || interpretation.kind === 'theory') ? 3 : 1,
  };
  state.scene.recentBeats.push(beat);
  if (state.scene.recentBeats.length > 10) {
    state.scene.recentBeats.shift();
  }

  state.scene.turn += 1;
}

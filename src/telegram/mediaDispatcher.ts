import * as path from 'node:path';
import * as fs from 'node:fs';
import type { RunState } from '../core/types.js';

export interface MediaTrigger {
  mediaKey: string;
  filename: string;
  condition: (stateBefore: RunState, stateAfter: RunState, actionId?: string) => boolean;
}

const MEDIA_DIR = path.join(process.cwd(), 'media');

export const MEDIA_TRIGGERS: MediaTrigger[] = [
  // 1. Cover Art (Intro / Node 00)
  {
    mediaKey: 'media_cover_main',
    filename: 'COVER_MAIN.png',
    condition: (before, after) => after.canonical.currentNode === 'NODE_00',
  },

  // 2. Entrance / Wet Receipt (Node 01)
  {
    mediaKey: 'media_wet_receipt',
    filename: 'رسید خیس مچاله.png',
    condition: (before, after, act) =>
      after.canonical.evidenceIds.includes('wet_receipt_fragment') ||
      act === 'EXAMINE_WET_RECEIPT' ||
      act === 'PICK_UP_RECEIPT',
  },
  {
    mediaKey: 'media_bg_entrance',
    filename: 'BG_ENTRANCE.png',
    condition: (before, after) =>
      before.canonical.currentNode === 'NODE_00' && after.canonical.currentNode === 'NODE_01',
  },

  // 2b. Cafe Mini-Map (Node 02 entry)
  {
    mediaKey: 'media_mini_map',
    filename: fs.existsSync(path.join(MEDIA_DIR, 'MINI_MAP_scene_table5.png')) ? 'MINI_MAP_scene_table5.png' : 'MINI_MAP.png',
    condition: (before, after) =>
      before.canonical.currentNode === 'NODE_01' && after.canonical.currentNode === 'NODE_02',
  },

  // 3. Table 5, Red Cup & Hanieh with Penti (Node 02)
  {
    mediaKey: 'media_red_cup',
    filename: 'ITEM_RED_CUP.png',
    condition: (before, after, act) =>
      act === 'EXAMINE_TABLE_5' ||
      act === 'EXAMINE_ESPRESSO_CUP' ||
      act === 'EXAMINE_RED_STAIN' ||
      after.scene.establishedFactIds.includes('examined_espresso_cup'),
  },
  {
    mediaKey: 'media_hanieh_penti',
    filename: 'NPC_HANIEH_PENTI.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_HANIYEH' ||
      act === 'OBSERVE_PENTI' ||
      after.scene.establishedFactIds.includes('fact_haniyeh_witness'),
  },

  // 4. Bar Counter (Node 03)
  {
    mediaKey: 'media_bg_bar',
    filename: 'BG_BAR.png',
    condition: (before, after, act) =>
      act === 'APPROACH_COUNTER' ||
      (before.canonical.currentNode === 'NODE_02' && after.canonical.currentNode === 'NODE_03'),
  },

  // 4b. Yashin Shojaee (Specific interaction with Yashin)
  {
    mediaKey: 'media_yashin',
    filename: 'NPC_YASHIN.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_YASHIN' ||
      act === 'ASK_YASHIN_ABOUT_ROAST' ||
      act === 'ASK_YASHIN_TO_SMELL_OBJECT',
  },

  // 4c. Mani Shojaee (Specific interaction with Mani)
  {
    mediaKey: 'media_mani',
    filename: 'NPC_MANI.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_MANI' ||
      act === 'ASK_MANI_ABOUT_LABEL' ||
      act === 'TALK_TO_MANI_ABOUT_VOLLEYBALL',
  },

  // 5. Salar Salehi (Node 04 / Node 10 / Node 11)
  {
    mediaKey: 'media_salar',
    filename: 'NPC_SALAR.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_SALAR' ||
      act === 'CONFRONT_SALAR' ||
      act === 'ENTER_OFFICE' ||
      act === 'ASK_SALAR_ABOUT_INVOICE' ||
      after.canonical.currentNode === 'NODE_11',
  },

  // 6. Gallery Wall & Painting with Pentimento (Node 06 / Node 07 / Node 18)
  {
    mediaKey: 'media_bg_gallery',
    filename: 'BG_GALLERY.png',
    condition: (before, after) =>
      before.canonical.currentNode !== 'NODE_06' && after.canonical.currentNode === 'NODE_06',
  },
  {
    mediaKey: 'media_painting_pentimento',
    filename: 'ITEM_PAINTING_WITH_PENTIMENTO.png',
    condition: (before, after, act) =>
      act === 'INSPECT_BEHIND_PAINTING' ||
      act === 'ANALYZE_UNDERPAINTING' ||
      act === 'EXAMINE_WINDOW_REFLECTION' ||
      after.canonical.evidenceIds.includes('underpaint_line_visible') ||
      after.canonical.currentNode === 'NODE_18',
  },

  // 8. Basement / Storage (Node 08)
  {
    mediaKey: 'media_bg_basement',
    filename: 'BG_BASEMENT.png',
    condition: (before, after) =>
      after.canonical.currentNode === 'NODE_08' || after.canonical.currentNode === 'NODE_17',
  },

  // 9. Arian Mehri (Kitchen & Tech - Node 09 / Node 12)
  {
    mediaKey: 'media_mehri',
    filename: 'NPC_ARIN_M.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_ARIAN_MEHRI' ||
      act === 'ENTER_KITCHEN' ||
      act === 'CHECK_CAMERA_LOGS' ||
      after.canonical.currentNode === 'NODE_09' ||
      after.canonical.currentNode === 'NODE_12',
  },

  // 10. Arian Garshasbi (Rooftop / Alley - Node 13 / Node 14)
  {
    mediaKey: 'media_arin_g',
    filename: 'NPC_ARIN_G.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_ARIAN_G' ||
      act === 'FOLLOW_SUSPECT' ||
      act === 'SCAN_ALLEY' ||
      after.canonical.currentNode === 'NODE_13' ||
      after.canonical.currentNode === 'NODE_14',
  },

  // 11. The Red Glove Suspect (Node 01 / Node 15 / Node 16)
  {
    mediaKey: 'media_red_glove',
    filename: 'NPC_RED_GLOVE.png',
    condition: (before, after, act) =>
      act === 'OBSERVE_EXITING_MAN' ||
      act === 'EXAMINE_RED_GLOVE' ||
      act === 'ANALYZE_RED_GLOVE' ||
      after.canonical.evidenceIds.includes('red_glove_object'),
  },

  // 12. Aydin Garshasbi (The Black Card - Node 16)
  {
    mediaKey: 'media_aydin',
    filename: 'NPC_AYDIN.png',
    condition: (before, after, act) =>
      act === 'CALL_AYDIN' ||
      act === 'MEET_COLLECTOR' ||
      after.canonical.canonicalFlags.includes('aydin_contacted') ||
      after.canonical.currentNode === 'NODE_16',
  },
];

/**
 * Returns the absolute path of a media file to display for this turn,
 * ensuring each image is only triggered ONCE per playthrough.
 */
export function getPendingMediaForTurn(
  stateBefore: RunState,
  stateAfter: RunState,
  actionId?: string
): { mediaPath: string; mediaKey: string } | null {
  const flags = stateAfter.canonical.canonicalFlags;

  for (const trigger of MEDIA_TRIGGERS) {
    if (!flags.includes(trigger.mediaKey)) {
      if (trigger.condition(stateBefore, stateAfter, actionId)) {
        const fullPath = path.join(MEDIA_DIR, trigger.filename);
        if (fs.existsSync(fullPath)) {
          // Record media flag so it doesn't repeat
          flags.push(trigger.mediaKey);
          return { mediaPath: fullPath, mediaKey: trigger.mediaKey };
        }
      }
    }
  }

  return null;
}

export function getCoverPath(): string | null {
  const cover = path.join(MEDIA_DIR, 'COVER_MAIN.png');
  if (fs.existsSync(cover)) return cover;
  const entrance = path.join(MEDIA_DIR, 'BG_ENTRANCE.png');
  return fs.existsSync(entrance) ? entrance : null;
}

export function resolveMapRoomId(state?: RunState): string | null {
  if (!state) return null;
  const currentScene = state.canonical.currentScene || state.scene?.sceneId || '';
  const currentNode = state.canonical.currentNode || '';

  if (
    currentScene === 'scene_entrance' ||
    currentScene === 'scene_hosseini_alley' ||
    currentNode === 'NODE_01' ||
    currentNode === 'NODE_13' ||
    currentNode === 'NODE_14' ||
    currentNode === 'NODE_15'
  ) {
    return 'scene_entrance';
  }
  if (
    currentScene === 'scene_table5' ||
    currentScene === 'scene_table_5' ||
    currentNode === 'NODE_02'
  ) {
    return 'scene_table5';
  }
  if (
    currentScene === 'scene_counter' ||
    currentNode === 'NODE_03' ||
    currentNode === 'NODE_04' ||
    currentNode === 'NODE_05'
  ) {
    return 'scene_counter';
  }
  if (
    currentScene === 'scene_gallery' ||
    currentScene === 'scene_painting_back' ||
    currentNode === 'NODE_06' ||
    currentNode === 'NODE_07'
  ) {
    return 'scene_gallery';
  }
  if (
    currentScene === 'scene_storage' ||
    currentNode === 'NODE_08' ||
    currentNode === 'NODE_09'
  ) {
    return 'scene_storage';
  }
  if (
    currentScene === 'scene_office' ||
    currentNode === 'NODE_10' ||
    currentNode === 'NODE_11'
  ) {
    return 'scene_office';
  }
  if (
    currentScene === 'scene_cctv' ||
    currentNode === 'NODE_12'
  ) {
    return 'scene_cctv';
  }
  if (
    currentScene === 'scene_archive_collector' ||
    currentScene === 'scene_collector_meeting' ||
    currentScene === 'scene_archive' ||
    currentScene === 'scene_underpainting' ||
    currentNode === 'NODE_16' ||
    currentNode === 'NODE_17' ||
    currentNode === 'NODE_18'
  ) {
    return 'scene_archive_collector';
  }

  return null;
}

export function getMapPath(state?: RunState): string | null {
  const roomId = resolveMapRoomId(state);
  if (roomId) {
    const localized = path.join(MEDIA_DIR, `MINI_MAP_${roomId}.png`);
    if (fs.existsSync(localized)) return localized;
  }
  const map = path.join(MEDIA_DIR, 'MINI_MAP.png');
  return fs.existsSync(map) ? map : null;
}

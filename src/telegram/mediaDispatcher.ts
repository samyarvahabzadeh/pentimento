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

  // 4. Bar Counter & Yashin (Node 03 / Node 05)
  {
    mediaKey: 'media_yashin',
    filename: 'NPC_YASHIN.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_YASHIN' ||
      act === 'APPROACH_COUNTER' ||
      after.canonical.currentNode === 'NODE_03' ||
      after.canonical.currentNode === 'NODE_05',
  },
  {
    mediaKey: 'media_bg_bar',
    filename: 'BG_BAR.png',
    condition: (before, after) =>
      before.canonical.currentNode === 'NODE_02' && after.canonical.currentNode === 'NODE_03',
  },

  // 5. Salar Salehi (Node 04 / Node 10 / Node 11)
  {
    mediaKey: 'media_salar',
    filename: 'NPC_SALAR.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_SALAR' ||
      act === 'CONFRONT_SALAR' ||
      act === 'ENTER_OFFICE' ||
      after.canonical.currentNode === 'NODE_04' ||
      after.canonical.currentNode === 'NODE_10' ||
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

  // 7. Mani Shojaee (Node 07 / Node 15)
  {
    mediaKey: 'media_mani',
    filename: 'NPC_MANI.png',
    condition: (before, after, act) =>
      act === 'TALK_TO_MANI' ||
      act === 'ASK_MANI_ABOUT_LABEL' ||
      act === 'TALK_TO_MANI_ABOUT_VOLLEYBALL' ||
      after.canonical.currentNode === 'NODE_07',
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
  const p = path.join(MEDIA_DIR, 'COVER_MAIN.png');
  return fs.existsSync(p) ? p : null;
}

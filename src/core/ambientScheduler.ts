import type { RunState, RunFlavor, ScheduledAmbientBeat, TruthLayerTag } from './types.js';
import { CHARACTER_BIBLE } from '../canon/characterBible.js';

interface AmbientEventDef {
  id: string;
  type: 'flavor' | 'social' | 'environment';
  tag: TruthLayerTag;
  eligibleScenes: string[];
  eligibleNpcs?: string[];
  weight: number;
  cooldownTurns: number;
  maxPerRun: number;
  isRare?: boolean;
  isSynergy?: boolean;
  topic: string;
  prerequisite?: (state: RunState) => boolean;
  instructionTemplate: (state: RunState, primaryNpc?: string) => string;
}

/**
 * Deterministically initializes Character-Driven Run Flavors for this run using the runSeed.
 * Source: CHARACTER_BIBLE life pool threads.
 */
export function initRunFlavors(seed: number): Record<string, RunFlavor> {
  const flavors: Record<string, RunFlavor> = {};

  for (const [npcId, profile] of Object.entries(CHARACTER_BIBLE)) {
    const threads = profile.lifePoolThreads;
    if (threads && threads.length > 0) {
      const idx = Math.abs(seed + npcId.charCodeAt(0) * 17) % threads.length;
      const chosen = threads[idx];
      flavors[npcId] = {
        id: chosen.id,
        npcId,
        topic: chosen.topic,
        flavorSummary: chosen.summary,
        tier: 'daily',
        revealed: false,
      };
    }
  }

  return flavors;
}

// ── Ephemeral, Synergy, Conflict, and Rare Character Event Pool ──
const AMBIENT_POOL: AmbientEventDef[] = [
  // ── Environmental Atmosphere ──
  {
    id: 'steam_wand_interruption',
    type: 'environment',
    tag: 'ENVIRONMENT',
    eligibleScenes: ['scene_counter', 'scene_table_5'],
    weight: 0.30,
    cooldownTurns: 4,
    maxPerRun: 4,
    topic: 'steam_sound',
    instructionTemplate: () =>
      'صدای تیز و ناگهانی نازل بخار دستگاه اسپرسو (Steam Wand) یا تخلیه پرتافیلتر برای چند لحظه سکوت فضا را می‌شکند.',
  },
  {
    id: 'penti_curious_walk',
    type: 'environment',
    tag: 'ENVIRONMENT',
    eligibleScenes: ['scene_table_5', 'scene_counter'],
    weight: 0.25,
    cooldownTurns: 4,
    maxPerRun: 3,
    topic: 'penti_ambient',
    instructionTemplate: () =>
      'پنتی (بچه‌گربه دوماهه) با قدم‌های نرم از زیر صندلی‌ها رد می‌شود و گوشه‌ای با چشم‌های براق نگاه می‌کند.',
  },

  // ── Character Daily Flavor & Initiative ──
  {
    id: 'mani_glances_at_clock',
    type: 'flavor',
    tag: 'FLAVOR',
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['mani'],
    weight: 0.35,
    cooldownTurns: 3,
    maxPerRun: 3,
    topic: 'mani_flavor',
    instructionTemplate: (state) => {
      const f = state.runFlavor?.mani;
      return `مانی در خلال کار به ساعت مچی‌اش نگاه می‌کند یا متناسب با حال امروز خود رفتار می‌کند (${f?.flavorSummary ?? 'تمرین والیبال و شوخی'}).`;
    },
  },
  {
    id: 'yashin_coffee_micro_note',
    type: 'flavor',
    tag: 'FLAVOR',
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['yashin'],
    weight: 0.35,
    cooldownTurns: 3,
    maxPerRun: 3,
    topic: 'yashin_flavor',
    instructionTemplate: (state) => {
      const f = state.runFlavor?.yashin;
      return `یاشین در حال تمیز کردن کانتر با متانت جمله‌ای تخصصی درباره عطر یا رست قهوه بیان می‌کند (${f?.flavorSummary ?? 'اسیدیته و عطر قهوه'}).`;
    },
  },
  {
    id: 'mani_initiative_joke',
    type: 'social',
    tag: 'SOCIAL',
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['mani'],
    weight: 0.25,
    cooldownTurns: 4,
    maxPerRun: 2,
    topic: 'mani_banter',
    instructionTemplate: () =>
      'مانی خودش ابتکار عمل را به دست می‌گیرد و یک شوخی کوتاه یا متلک رفاقتی درباره قهوه‌خوری در دل شب می‌اندازد تا واکنش بازیکن را بسنجد.',
  },
  {
    id: 'yashin_polite_water_offer',
    type: 'social',
    tag: 'SOCIAL',
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['yashin'],
    weight: 0.25,
    cooldownTurns: 4,
    maxPerRun: 2,
    topic: 'yashin_hospitality',
    instructionTemplate: () =>
      'یاشین با وقار یک لیوان آب خنک روی سطح چوبی پیشخوان می‌گذارد و با لحنی مودبانه می‌پرسد آیا مایلید درباره ترکیب دانه‌ها چیزی بدانید.',
  },

  // ── Cross-Character Conflicts & Synergies ──
  {
    id: 'conflict_yashin_corrects_mani',
    type: 'social',
    tag: 'SOCIAL',
    isSynergy: true,
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['yashin', 'mani'],
    weight: 0.30,
    cooldownTurns: 5,
    maxPerRun: 2,
    topic: 'brotherly_correction',
    prerequisite: (state) => state.scene.activeEntityIds.includes('yashin') && state.scene.activeEntityIds.includes('mani'),
    instructionTemplate: () =>
      'یاشین با لحن آرام اما مقتدر (Zeus Archetype) نکته‌ای را در کار مانی جلوی بازیکن تصحیح می‌کند؛ مانی با شوخی یا واکنش دفاعی کوتاه سعی می‌کند ضعف نشان ندهد.',
  },
  {
    id: 'synergy_brother_defense',
    type: 'social',
    tag: 'SOCIAL',
    isSynergy: true,
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['yashin', 'mani'],
    weight: 0.25,
    cooldownTurns: 5,
    maxPerRun: 2,
    topic: 'brother_support',
    prerequisite: (state) => state.canonical.threat >= 10 || state.canonical.stress >= 10,
    instructionTemplate: () =>
      'در فضای مبهم و سنگین کافه، یاشین و مانی ناخودآگاه با زبان بدن از یکدیگر حمایت می‌کنند؛ اگر احساس کنند بازیکن به یکی تندی می‌کند، دیگری فضا را کنترل می‌کند.',
  },

  // ── Rare Character Events (Strict Prerequisites) ──
  {
    id: 'rare_yashin_confident_misinformation',
    type: 'flavor',
    tag: 'FLAVOR',
    isRare: true,
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['yashin'],
    weight: 0.40,
    cooldownTurns: 6,
    maxPerRun: 1,
    topic: 'confident_misinformation',
    prerequisite: (state) => {
      // Fires when talking to Yashin and turn is at least 3
      return state.scene.turn >= 3 && state.scene.activeEntityIds.includes('yashin');
    },
    instructionTemplate: () =>
      'یاشین با اعتمادبه‌نفس بالا (Confident Misinformation) یک تحلیل تاریخی یا روایت شنیده‌شده عمومی درباره گذشته عظیمیه یا مسافرها بیان می‌کند که ظاهر منطقی دارد اما یک فکت پرونده نیست.',
  },
  {
    id: 'rare_mani_ratin_memorial',
    type: 'flavor',
    tag: 'FLAVOR',
    isRare: true,
    eligibleScenes: ['scene_counter'],
    eligibleNpcs: ['mani'],
    weight: 0.35,
    cooldownTurns: 8,
    maxPerRun: 1,
    topic: 'ratin_memory',
    prerequisite: (state) => {
      const rapport = state.npcMemory.mani?.rapport ?? 0;
      return rapport >= 1 && state.scene.turn >= 4;
    },
    instructionTemplate: () =>
      'مانی برای لحظه‌ای شوخی را کنار می‌گذارد و در پاسخ به یک صحبت عمیق، اشاره‌ای کوتاه و احترام‌آمیز به گذشته‌اش در ارومیه و دوست فقیدش (راتین) می‌کند تا نشان دهد پشت شوخی‌هایش عمق وجود دارد.',
  },
  {
    id: 'rare_hanieh_ear_for_voice',
    type: 'flavor',
    tag: 'FLAVOR',
    isRare: true,
    eligibleScenes: ['scene_table_5', 'scene_entrance'],
    eligibleNpcs: ['haniyeh'],
    weight: 0.35,
    cooldownTurns: 6,
    maxPerRun: 1,
    topic: 'ear_for_voice',
    prerequisite: (state) => state.scene.activeEntityIds.includes('haniyeh') && state.scene.turn >= 2,
    instructionTemplate: () =>
      'خانم محمدی با تکیه بر مهارت دوبلاژ و شنوایی دقیقش به لرزش یا طنین غیرعادی صدای مشتری قبلی یا صدای پس‌زمینه اشاره می‌کند.',
  },
];

/**
 * Pseudorandom float generator based on seed and turn.
 */
function seededRandom(seed: number, turn: number, salt: number): number {
  const x = Math.sin(seed * 9301 + turn * 49297 + salt * 233280) * 10000;
  return x - Math.floor(x);
}

/**
 * Schedules an ambient beat for the turn matching Character Bible V3 rules.
 */
export function scheduleAmbientBeat(state: RunState): ScheduledAmbientBeat | undefined {
  const turn = state.scene.turn;
  const seed = state.runSeed || 42;
  const currentSceneId = state.scene.sceneId;
  const presentEntities = state.scene.activeEntityIds;

  // 1. Check if any Rare Event or Synergy with strict prerequisites is eligible
  const eligibleRareEvents = AMBIENT_POOL.filter(def => {
    if (!def.isRare && !def.isSynergy) return false;
    if (!def.eligibleScenes.includes(currentSceneId)) return false;
    if (def.eligibleNpcs && !def.eligibleNpcs.some(npc => presentEntities.includes(npc))) return false;
    const timesTriggered = (state.ambientHistory || []).filter(h => h.eventId === def.id).length;
    if (timesTriggered >= def.maxPerRun) return false;
    const lastRun = (state.ambientHistory || []).filter(h => h.eventId === def.id).pop();
    if (lastRun && (turn - lastRun.turn) < def.cooldownTurns) return false;
    if (def.prerequisite && !def.prerequisite(state)) return false;
    return true;
  });

  // If a rare or synergy event is strictly ready, trigger it deterministically based on seed
  if (eligibleRareEvents.length > 0) {
    const rareRoll = seededRandom(seed, turn, 303);
    if (rareRoll < 0.60) {
      const selected = eligibleRareEvents[Math.floor(rareRoll * eligibleRareEvents.length)];
      const primaryNpc = selected.eligibleNpcs?.find(n => presentEntities.includes(n));
      return {
        eventId: selected.id,
        type: selected.type,
        npcId: primaryNpc,
        topic: selected.topic,
        instruction: selected.instructionTemplate(state, primaryNpc),
        tag: selected.tag,
        isRare: selected.isRare,
        isSynergy: selected.isSynergy,
      };
    }
  }

  // 2. Standard 70% quiet turns threshold
  const roll = seededRandom(seed, turn, 101);
  if (roll < 0.70) {
    return undefined;
  }

  // 3. Regular candidate pool
  const candidates = AMBIENT_POOL.filter(def => {
    if (def.isRare) return false; // Handled above
    if (!def.eligibleScenes.includes(currentSceneId)) return false;
    if (def.eligibleNpcs && !def.eligibleNpcs.some(npc => presentEntities.includes(npc))) return false;
    const timesTriggered = (state.ambientHistory || []).filter(h => h.eventId === def.id).length;
    if (timesTriggered >= def.maxPerRun) return false;
    const lastRun = (state.ambientHistory || []).filter(h => h.eventId === def.id).pop();
    if (lastRun && (turn - lastRun.turn) < def.cooldownTurns) return false;
    if (def.prerequisite && !def.prerequisite(state)) return false;
    return true;
  });

  if (candidates.length === 0) return undefined;

  const pickRoll = seededRandom(seed, turn, 202);
  const selectedIdx = Math.floor(pickRoll * candidates.length);
  const selected = candidates[selectedIdx];

  const primaryNpc = selected.eligibleNpcs?.find(n => presentEntities.includes(n));

  return {
    eventId: selected.id,
    type: selected.type,
    npcId: primaryNpc,
    topic: selected.topic,
    instruction: selected.instructionTemplate(state, primaryNpc),
    tag: selected.tag,
    isRare: selected.isRare,
    isSynergy: selected.isSynergy,
  };
}

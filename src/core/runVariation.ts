import type { ApproachStats, PlayerClassId } from './types.js';

export function createInitialApproachStats(): ApproachStats {
  return {
    art: 0,
    chem: 0,
    systems: 0,
    social: 0,
    risk: 0,
    empathy: 0,
  };
}

export function bumpApproachStat(
  stats: ApproachStats,
  stat: keyof ApproachStats,
  delta: number = 1
): ApproachStats {
  const current = stats[stat] ?? 0;
  return {
    ...stats,
    [stat]: Math.min(5, Math.max(0, current + delta)),
  };
}

export interface RunVariationConfig {
  runSeed: number;
  initialNpcDispositions: Record<string, number>; // npcId -> delta (-1, 0, +1)
  selectedAmbientTrackId: string;
  focusRedHerring: 'safe_combination' | 'delivery_van' | 'coffee_grind_batch';
}

export function generateRunVariation(seed: number): RunVariationConfig {
  // Simple deterministic PRNG from seed
  const prng = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const salarMod = prng(1) > 0.6 ? 1 : prng(1) < 0.3 ? -1 : 0;
  const maniMod = prng(2) > 0.5 ? 1 : 0;
  const haniehMod = prng(3) > 0.5 ? 1 : 0;
  const yashinMod = prng(4) > 0.6 ? 1 : 0;

  const ambientTracks = ['ambient_rain_intensifies', 'ambient_distant_siren', 'ambient_kitchen_clatter', 'ambient_espresso_steam'];
  const trackIdx = Math.floor(prng(5) * ambientTracks.length);

  const herrings: Array<'safe_combination' | 'delivery_van' | 'coffee_grind_batch'> = [
    'safe_combination',
    'delivery_van',
    'coffee_grind_batch',
  ];
  const herringIdx = Math.floor(prng(6) * herrings.length);

  return {
    runSeed: seed,
    initialNpcDispositions: {
      salar: salarMod,
      mani: maniMod,
      hanieh: haniehMod,
      yashin: yashinMod,
    },
    selectedAmbientTrackId: ambientTracks[trackIdx] || 'ambient_rain_intensifies',
    focusRedHerring: herrings[herringIdx] || 'safe_combination',
  };
}

export function getRoleInitialApproachBoost(role: PlayerClassId): Partial<ApproachStats> {
  switch (role) {
    case 'art_historian':
      return { art: 2, empathy: 1 };
    case 'coffee_alchemist':
      return { chem: 2, risk: 1 };
    case 'systems_analyst':
      return { systems: 2, social: 0 };
    case 'investigator':
      return { social: 2, empathy: 1 };
    default:
      return {};
  }
}

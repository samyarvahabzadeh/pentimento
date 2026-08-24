import type { ProofDomain } from './types.js';

export function createInitialProofDomains(): Record<ProofDomain, number> {
  return {
    ART: 0,
    CHEM: 0,
    SYS: 0,
    SOCIAL: 0,
    FACTION: 0,
  };
}

export function addProofPoints(
  domains: Record<ProofDomain, number>,
  domain: ProofDomain,
  points: number
): Record<ProofDomain, number> {
  const current = domains[domain] ?? 0;
  return {
    ...domains,
    [domain]: Math.max(0, current + points),
  };
}

/**
 * Counts how many distinct proof domains have accumulated at least the qualifying score (default 2).
 */
export function countSatisfiedProofDomains(
  domains: Record<ProofDomain, number>,
  threshold: number = 2
): number {
  let count = 0;
  for (const domain of ['ART', 'CHEM', 'SYS', 'SOCIAL', 'FACTION'] as ProofDomain[]) {
    if ((domains[domain] ?? 0) >= threshold) {
      count += 1;
    }
  }
  return count;
}

export function hasFactionBridge(domains: Record<ProofDomain, number>, threshold: number = 2): boolean {
  return (domains.FACTION ?? 0) >= threshold;
}

export type EndingTierEvaluation = 'TRUE_ENDING' | 'GOOD_ENDING' | 'INCOMPLETE_ENDING';

export function evaluateProofDomainEndingTier(
  domains: Record<ProofDomain, number>,
  hasCoherentTheory: boolean
): EndingTierEvaluation {
  const satisfiedCount = countSatisfiedProofDomains(domains, 2);
  const factionBridge = hasFactionBridge(domains, 2);

  // True Ending: At least 4 domains satisfied + Faction bridge + coherent theory
  if (satisfiedCount >= 4 && factionBridge && hasCoherentTheory) {
    return 'TRUE_ENDING';
  }

  // Good Ending: At least 3 domains satisfied + coherent theory
  if (satisfiedCount >= 3 && hasCoherentTheory) {
    return 'GOOD_ENDING';
  }

  // Incomplete Ending: Local culprit partially understood, but meta bridge missing
  return 'INCOMPLETE_ENDING';
}

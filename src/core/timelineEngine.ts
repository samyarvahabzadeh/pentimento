import type {
  TimelineClaim,
  TemporalRelation,
  TimelineClaimStatus,
} from './types.js';

export interface TimelineValidationResult {
  isConsistent: boolean;
  hasCycle: boolean;
  consistentRelations: string[];
  unsupportedRelations: string[];
  contradictedRelations: string[];
  unresolvedRelations: string[];
}

/**
 * Validates a set of player timeline claims against canonical partial-order constraints.
 * Deterministic graph validation without relying on LLM judgment.
 */
export function validateTimeline(
  playerClaims: TimelineClaim[],
  canonicalConstraints: TemporalRelation[]
): TimelineValidationResult {
  const consistentRelations: string[] = [];
  const unsupportedRelations: string[] = [];
  const contradictedRelations: string[] = [];
  const unresolvedRelations: string[] = [];

  // Build direct lookup for canonical constraints
  // Key format: `${leftItemId}->${rightItemId}`
  const constraintMap = new Map<string, TemporalRelation>();
  for (const c of canonicalConstraints) {
    constraintMap.set(`${c.leftItemId}->${c.rightItemId}`, c);
  }

  // 1. Check each player claim against direct canonical constraints
  for (const claim of playerClaims) {
    const forwardKey = `${claim.leftItemId}->${claim.rightItemId}`;
    const reverseKey = `${claim.rightItemId}->${claim.leftItemId}`;

    const forwardConstraint = constraintMap.get(forwardKey);
    const reverseConstraint = constraintMap.get(reverseKey);

    if (claim.relation === 'BEFORE') {
      if (forwardConstraint && forwardConstraint.relation === 'BEFORE') {
        claim.status = 'SUPPORTED';
        consistentRelations.push(claim.id);
      } else if (forwardConstraint && forwardConstraint.relation === 'AFTER') {
        claim.status = 'CONTRADICTED';
        contradictedRelations.push(claim.id);
      } else if (reverseConstraint && reverseConstraint.relation === 'BEFORE') {
        // Reverse constraint says right is before left, so left before right is contradicted!
        claim.status = 'CONTRADICTED';
        contradictedRelations.push(claim.id);
      } else if (claim.supportingEvidenceIds.length > 0) {
        claim.status = 'OPEN';
        unsupportedRelations.push(claim.id);
      } else {
        claim.status = 'OPEN';
        unresolvedRelations.push(claim.id);
      }
    } else if (claim.relation === 'AFTER') {
      if (forwardConstraint && forwardConstraint.relation === 'AFTER') {
        claim.status = 'SUPPORTED';
        consistentRelations.push(claim.id);
      } else if (forwardConstraint && forwardConstraint.relation === 'BEFORE') {
        claim.status = 'CONTRADICTED';
        contradictedRelations.push(claim.id);
      } else if (reverseConstraint && reverseConstraint.relation === 'BEFORE') {
        // Reverse constraint says right before left -> left AFTER right is consistent!
        claim.status = 'SUPPORTED';
        consistentRelations.push(claim.id);
      } else {
        claim.status = 'OPEN';
        unresolvedRelations.push(claim.id);
      }
    } else if (claim.relation === 'SAME_WINDOW') {
      if (forwardConstraint && (forwardConstraint.relation === 'BEFORE' || forwardConstraint.relation === 'AFTER')) {
        claim.status = 'CONTRADICTED';
        contradictedRelations.push(claim.id);
      } else {
        claim.status = 'OPEN';
        unresolvedRelations.push(claim.id);
      }
    } else {
      claim.status = 'OPEN';
      unresolvedRelations.push(claim.id);
    }
  }

  // 2. Cycle Detection in Player Graph
  const graph = new Map<string, string[]>();
  for (const claim of playerClaims) {
    if (claim.relation === 'BEFORE') {
      if (!graph.has(claim.leftItemId)) graph.set(claim.leftItemId, []);
      graph.get(claim.leftItemId)!.push(claim.rightItemId);
    } else if (claim.relation === 'AFTER') {
      if (!graph.has(claim.rightItemId)) graph.set(claim.rightItemId, []);
      graph.get(claim.rightItemId)!.push(claim.leftItemId);
    }
  }

  const hasCycle = detectCycle(graph);
  const isConsistent = !hasCycle && contradictedRelations.length === 0;

  return {
    isConsistent,
    hasCycle,
    consistentRelations,
    unsupportedRelations,
    contradictedRelations,
    unresolvedRelations,
  };
}

function detectCycle(graph: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

// ── TEST-ONLY FIXTURES (Separated from Production Canon) ──
export const TEST_FIXTURE_CONSTRAINTS: TemporalRelation[] = [
  {
    leftItemId: 'fixture_event_A',
    relation: 'BEFORE',
    rightItemId: 'fixture_event_B',
    confidence: 'high',
    sourceEvidenceIds: ['fixture_ev_1'],
  },
  {
    leftItemId: 'fixture_event_B',
    relation: 'BEFORE',
    rightItemId: 'fixture_event_C',
    confidence: 'high',
    sourceEvidenceIds: ['fixture_ev_2'],
  },
];

// CONTRACTS.ts — semantic contract for Pentimento Text Core
// Agent may reorganize files, but must preserve these ownership boundaries.

export type IntentKind =
  | "speak"
  | "observe"
  | "physical"
  | "move"
  | "bluff"
  | "threaten"
  | "rest"
  | "theory"
  | "impossible"
  | "other";

export type NarrativeSource =
  | "director"
  | "authored_fallback"
  | "deterministic";

export type CanonicalActionId =
  | "ENTER_CAFE"
  | "OBSERVE_EXITING_MAN"
  | "OBSERVE_ENTRANCE"
  | "FOLLOW_EXITING_MAN"
  | "IGNORE_AND_WAIT";

export interface DirectorInterpretation {
  kind: IntentKind;
  targetId?: string;
  intentSummary: string;
}

export type SoftEffectProposal =
  | { kind: "rapport"; npcId: string; delta: -2 | -1 | 0 | 1 | 2 }
  | { kind: "stress"; delta: -2 | -1 | 0 | 1 | 2 }
  | { kind: "threat"; delta: -2 | -1 | 0 | 1 | 2 };

export interface MemoryCandidate {
  scope: "scene" | "npc" | "player";
  subjectId?: string;
  summary: string;
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface DirectorOutput {
  version: 1;
  narrative: string;
  interpretation: DirectorInterpretation;
  canonicalActionProposal?: {
    actionId: CanonicalActionId;
    confidence: "high" | "medium" | "low";
  };
  softEffects: SoftEffectProposal[];
  memoryCandidates: MemoryCandidate[];
  referencedFactIds: string[];
}

export interface SceneBeat {
  turn: number;
  summary: string;
  actors: string[];
  topics: string[];
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface NpcMemory {
  awareness: string[];
  beliefs: Array<{
    summary: string;
    confidence: "low" | "medium" | "high";
    sourceEventId?: string;
  }>;
  impressions: Array<{
    tag: string;
    sourceEventId?: string;
  }>;
  commitments: Array<{
    id: string;
    summary: string;
    status: "open" | "fulfilled" | "withdrawn";
  }>;
  rapport?: number;
  lastInteractionTurn?: number;
}

export interface SceneState {
  sceneId: string;
  nodeId: string;
  turn: number;
  activeEntityIds: string[];
  visibleObjectIds: string[];
  establishedFactIds: string[];
  recentBeats: SceneBeat[];
}

export interface CanonicalRunState {
  runId: string;
  currentNode: string;
  currentScene: string;
  stress: number;
  threat: number;
  actionPoints: number;
  evidenceIds: string[];
  inventoryIds: string[];
  canonicalFlags: string[];
  endingId?: string;
}

export interface RunState {
  version: 1;
  canonical: CanonicalRunState;
  scene: SceneState;
  npcMemory: Record<string, NpcMemory>;
}

export interface ValidationResult {
  acceptedActionId?: CanonicalActionId;
  acceptedSoftEffects: SoftEffectProposal[];
  rejected: Array<{
    type: "action" | "soft_effect" | "fact_reference" | "memory";
    reason: string;
  }>;
}

export interface ResolvedTurn {
  narrative: string;
  source: NarrativeSource;
  interpretation: DirectorInterpretation;
  validation: ValidationResult;
  stateBefore: RunState;
  stateAfter: RunState;
}

export interface DirectorContext {
  worldRules: string[];
  scene: SceneState;
  canonical: CanonicalRunState;
  activeNpcKnowledge: Record<string, {
    awarenessFactIds: string[];
    beliefs: string[];
    impressions: string[];
    commitments: string[];
  }>;
  relevantFacts: Array<{ id: string; text: string }>;
  allowedCanonicalActions: CanonicalActionId[];
  relevantMemories: string[];
  playerInput: string;
}

export interface LLMTransport {
  generateDirectorOutput(context: DirectorContext): Promise<{
    provider: string;
    model: string;
    latencyMs: number;
    rawText: string;
  }>;
}

// Ownership rules:
// - LLMTransport never mutates RunState.
// - Director parser never mutates RunState.
// - ProposalValidator never invents actions/facts.
// - GameEngine alone applies accepted canonical actions.
// - Memory compiler consumes validated turn results.
// - Exactly one NarrativeSource is rendered.

// src/core/types.ts — semantic contract for Pentimento Text Core
// Three Truth Layers, Character Bible V3, Investigation Depth & Theory Ledger

export type TruthLayerTag = 'CANONICAL' | 'FLAVOR' | 'SOCIAL' | 'ENVIRONMENT';

export type PlayerClassId = 'systems_analyst' | 'investigator' | 'art_historian' | 'coffee_alchemist' | 'observer';

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

export type ObjectGroundingStrictness =
  | "NORMAL_OBJECT"        // Free decorative improvisation
  | "CHARACTER_OBJECT"     // Moderate grounding
  | "INVESTIGATIVE_OBJECT" // Strict grounding
  | "CORE_MYSTERY_OBJECT"; // Extremely strict: only canonical facts & neutral sensory prose

export type CanonicalActionId =
  // NODE 00 Actions (Opening / Role Selection)
  | "SELECT_ROLE_ART_HISTORIAN"
  | "SELECT_ROLE_COFFEE_ALCHEMIST"
  | "SELECT_ROLE_SYSTEMS_ANALYST"
  | "SELECT_ROLE_INVESTIGATOR"
  // NODE 01 Actions
  | "ENTER_CAFE"
  | "OBSERVE_EXITING_MAN"
  | "OBSERVE_ENTRANCE"
  | "FOLLOW_EXITING_MAN"
  | "IGNORE_AND_WAIT"
  // NODE 02 Actions
  | "EXAMINE_TABLE_5"
  | "EXAMINE_ESPRESSO_CUP"
  | "EXAMINE_RED_STAIN"
  | "TALK_TO_HANIYEH"
  | "APPROACH_COUNTER"
  | "OBSERVE_CAFE_INTERIOR"
  | "OBSERVE_PENTI"
  | "OBSERVE_THE_GUEST"
  | "TALK_TO_THE_GUEST"
  | "EXAMINE_RED_GLOVE"
  | "ANALYZE_RED_GLOVE"
  // NODE 03 Actions
  | "TALK_TO_YASHIN"
  | "TALK_TO_MANI"
  | "CHECK_POS_ORDERS"
  | "EXAMINE_ESPRESSO_MACHINE"
  | "APPROACH_GALLERY"
  | "RETURN_TO_TABLE_5"
  // NODE 04 Actions (Steam Wand / Espresso Machine Information Loss)
  | "EXAMINE_STEAM_WAND"
  | "LISTEN_THROUGH_STEAM"
  | "QUESTION_ABOUT_MASKED_LINE"
  | "INSPECT_COFFEE_BEANS_TRAY"
  // NODE 05 Actions (Coffee Roast & Lineage Observation)
  | "EXAMINE_UNKNOWN_SAMPLE"
  | "ASK_YASHIN_ABOUT_ROAST"
  | "ANALYZE_BEAN_LINEAGE"
  // NODE 06 Actions (Gallery & Painting Investigation Depth)
  | "EXAMINE_PAINTING_GENERAL"
  | "EXAMINE_PAINTING_CLOSE_SURFACE"
  | "EXAMINE_PAINTING_ANGLED_LIGHT"
  | "ANALYZE_PAINTING_ART_HISTORIAN"
  | "ASK_NPC_ABOUT_PAINTING"
  | "TOUCH_OR_SCRAPE_PAINTING"
  // NODE 07 Actions (Back of the Painting & Theory Ledger)
  | "INSPECT_BEHIND_PAINTING"
  | "LIFT_PAINTING_CAREFULLY"
  | "EXAMINE_BACK_LABEL"
  | "PROPOSE_THEORY"
  | "PEEL_REMAINING_LABEL"
  | "ASK_NPC_ABOUT_LABEL"
  // NODE 08 Actions (Storage Area & Comparative Observation)
  | "APPROACH_STORAGE"
  | "EXAMINE_STORAGE_GENERAL"
  | "COMPARE_STORAGE_BOXES"
  | "EXAMINE_CLEAN_BOX"
  | "MOVE_OR_OPEN_CLEAN_BOX"
  | "ASK_NPC_ABOUT_STORAGE"
  // NODE 09 Actions (Kitchen & Arian Mehri Contrast Node)
  | "APPROACH_KITCHEN"
  | "ENTER_KITCHEN"
  | "TALK_TO_ARIAN_MEHRI"
  | "EXAMINE_KITCHEN_ORDER"
  | "ASK_MEHRI_ABOUT_CASE"
  | "OBSERVE_KITCHEN_ACTIVITY"
  // NODE 10 Actions (Penti Area & Environmental Witness)
  | "APPROACH_PENTI_AREA"
  | "OBSERVE_PENTI_BEHAVIOR"
  | "EXAMINE_PENTI_NEW_OBJECT"
  | "SMELL_PENTI_NEW_OBJECT"
  | "ASK_YASHIN_TO_SMELL_OBJECT"
  | "ASK_HANIYEH_ABOUT_PENTI"
  | "BRING_OBJECT_TO_PENTI"
  | "SHOW_UNRELATED_CLUE_TO_PENTI"
  // NODE 11 Actions (Ledger / Account Office Forensics)
  | "APPROACH_OFFICE"
  | "EXAMINE_OFFICE_LEDGER"
  | "EXAMINE_INVOICE_RG_LOT55"
  | "COMPARE_OFFICE_INVOICES"
  | "ASK_SALAR_ABOUT_INVOICE"
  | "ANALYZE_INVOICE_FORGERY"
  // NODE 12 Actions (Cameras / Digital System Forensics)
  | "APPROACH_SECURITY_DESK"
  | "EXAMINE_CAMERA_SYSTEM"
  | "INSPECT_CAMERA_LOGS"
  | "ASK_MEHRI_ABOUT_CAMERAS"
  | "ANALYZE_WRITE_EVENTS"
  // NODE 13 Actions (Hosseini Alley / Threat Perception)
  | "EXIT_CAFE_TO_ALLEY"
  | "OBSERVE_HOSSEINI_ALLEY"
  | "LISTEN_DISTANT_MOTORCYCLE"
  | "OBSERVE_SECOND_CAR_SIGHTING"
  | "PROCEED_DOWN_ALLEY"
  // NODE 14 Actions (Parked Car / Red Herring Paranoia)
  | "APPROACH_PARKED_CAR"
  | "EXAMINE_PARKED_CAR"
  | "CHECK_CAR_WINDOWS_OR_INTERIOR"
  | "CHECK_CAR_LICENSE_PLATE"
  | "WAIT_AND_WATCH_CAR"
  | "ATTEMPT_BREAK_IN_CAR"
  | "ASK_NPC_ABOUT_CAR"
  // NODE 15 Actions (Back Route / Conflicting Witnesses)
  | "ASK_WITNESS_ABOUT_REAR_ROUTE"
  | "ASK_WITNESS_ABOUT_MAIN_ROUTE"
  | "COMPARE_WITNESS_STATEMENTS"
  | "INTERROGATE_WITNESS_TIME_REFERENCE"
  | "ANCHOR_WITNESS_MEMORY"
  | "ACCUSE_WITNESS_OF_LYING"
  // NODE 16 Actions (The Meeting / Collector Social Duel)
  | "APPROACH_COLLECTOR_MEETING"
  | "TALK_TO_COLLECTOR"
  | "BLUFF_COLLECTOR"
  | "REMAIN_SILENT_TO_COLLECTOR"
  | "OBSERVE_COLLECTOR_REACTIONS"
  | "ASK_COLLECTOR_ABOUT_INTENT"
  | "ASK_COLLECTOR_ABOUT_LOT55"
  | "ASK_COLLECTOR_ABOUT_PAINTING"
  | "ACCEPT_FINANCIAL_OFFER"
  | "REJECT_FINANCIAL_OFFER"
  | "WITHDRAW_FROM_MEETING"
  // NODE 17 Actions (Archive / Synthesis Puzzle)
  | "OPEN_ARCHIVE_WORKSPACE"
  | "EXAMINE_ARCHIVE_ITEM"
  | "CONNECT_ARCHIVE_EVIDENCE"
  | "PROPOSE_TIMELINE_RELATION"
  | "REVISE_TIMELINE_RELATION"
  | "REMOVE_TIMELINE_RELATION"
  | "RETRACT_THEORY"
  | "ASK_NPC_FOR_SYNTHESIS_HINT"
  | "SUBMIT_FINAL_TIMELINE"
  | "CLOSE_ARCHIVE_WORKSPACE"
  // NODE 18 Actions (The Underpainting / Final Revelation)
  | "EXAMINE_UNDERPAINTING_LAYERS"
  | "SUPERIMPOSE_PAINTING_VERSIONS"
  | "REVEAL_PROVENANCE_CHAIN_55"
  | "CONFRONT_FINAL_INTERPRETATION"
  | "MAKE_FINAL_DECISION_PRESERVE_TRUTH"
  | "MAKE_FINAL_DECISION_PRESERVE_PEOPLE"
  | "MAKE_FINAL_DECISION_TAKE_PRICE"
  | "COMPLETE_RUN_AND_RESOLVE_ENDING";

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
  tag?: TruthLayerTag;
}

export interface WitnessStatement {
  id: string;
  speakerId: string;
  claim: string;
  subjectId: string;
  routeClaim: 'rear_route' | 'main_door';
  timeClaim: string;
  reliability: number; // 0-100 internal score (NEVER player-facing)
  context: string;
  sourceBias: string;
  connectionPotential: 'low' | 'medium' | 'high';
  intentionalDeception: 'UNKNOWN' | 'TRUTHFUL' | 'DECEPTIVE';
  confidence: 'low' | 'medium' | 'high';
  statementGivenTurn?: number;
}

export interface SocialDuelState {
  suspicion: number; // 0-100 (how much Collector thinks player knows)
  pressure: number; // 0-100 (negotiation leverage)
  exposure: number; // 0-100 (what Collector has leaked)
  silenceStreak: number;
  revealedCluesToOpponent: string[];
  bluffAttempts: number;
  offerPresented: boolean;
  dialogueStage: 'opening' | 'duel' | 'offer_phase' | 'concluded';
}

export type ArchiveItemKind = 'PHOTO' | 'RECEIPT' | 'MESSAGE' | 'TIMESTAMP' | 'PROVENANCE' | 'NOTE';

export interface ArchiveItem {
  id: string;
  sourceEvidenceIds: string[];
  kind: ArchiveItemKind;
  playerVisibleText: string;
  knownTemporalFacts: string[];
  knownRelations: string[];
  reliability: number; // 0-100 internal (NEVER player-facing)
}

export type TemporalRelationKind = 'BEFORE' | 'AFTER' | 'SAME_WINDOW' | 'UNKNOWN';

export interface TemporalRelation {
  leftItemId: string;
  relation: TemporalRelationKind;
  rightItemId: string;
  confidence: 'low' | 'medium' | 'high';
  sourceEvidenceIds: string[];
}

export type TimelineClaimStatus = 'OPEN' | 'SUPPORTED' | 'CONTRADICTED' | 'CONFIRMED';

export interface TimelineClaim {
  id: string;
  leftItemId: string;
  relation: TemporalRelationKind;
  rightItemId: string;
  supportingEvidenceIds: string[];
  status: TimelineClaimStatus;
}

export interface EvidenceConnection {
  id: string;
  leftEvidenceId: string;
  rightEvidenceId: string;
  reason: string;
  status: 'PROPOSED' | 'VALIDATED';
}

export interface ArchiveWorkspaceState {
  activeItems: ArchiveItem[];
  timelineClaims: TimelineClaim[];
  connections: EvidenceConnection[];
  isFinalized: boolean;
}

export type TheoryStatus = 'OPEN' | 'SUPPORTED' | 'WEAKENED' | 'REFUTED' | 'CONFIRMED' | 'ABANDONED';
export type TheoryCategory =
  | 'safe_combination'
  | 'date'
  | 'inventory_reference'
  | 'address_or_location'
  | 'box_replacement'
  | 'unsupported_conspiracy'
  | 'object_from_different_environment'
  | 'planted_evidence'
  | 'footage_deleted'
  | 'footage_never_written'
  | 'selective_recording_manipulation'
  | 'information_environment_may_be_manipulated'
  | 'camera_gap_was_deliberate'
  | 'camera_gap_was_technical_failure'
  | 'car_is_surveillance'
  | 'car_is_coincidence'
  | 'car_belongs_to_association'
  | 'rear_witness_is_wrong'
  | 'main_door_witness_is_wrong'
  | 'one_witness_is_lying'
  | 'time_mismatch_explains_route_conflict'
  | 'unknown_man_used_both_routes_at_different_times'
  | 'collector_wants_painting'
  | 'collector_wants_lot55'
  | 'collector_wants_provenance_hidden'
  | 'collector_wants_cafe_to_stop_investigating'
  | 'collector_is_buyer_not_enemy'
  | 'other';

export interface PlayerTheory {
  id: string;
  proposition: string;
  category: TheoryCategory;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  confidence: 'low' | 'medium' | 'high';
  status: TheoryStatus;
  proposedBy: 'player' | 'npc';
  sourceNpcId?: string;
  createdAtTurn: number;
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
  proposedTheories?: Array<{
    proposition: string;
    category: TheoryCategory;
    confidence?: 'low' | 'medium' | 'high';
  }>;
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
  playerClass?: PlayerClassId;
  currentNode: string;
  currentScene: string;
  stress: number;
  threat: number;
  threatActive?: boolean;
  actionPoints: number;
  evidenceIds: string[];
  inventoryIds: string[];
  canonicalFlags: string[];
  environmentSafety?: 'CAFE' | 'EXPOSED_OUTDOOR';
  endingId?: string;
}

export interface RunFlavor {
  id: string;
  npcId: string;
  topic: string;
  flavorSummary: string;
  tier?: 'daily' | 'rare' | 'synergy';
  revealed: boolean;
}

export interface ScheduledAmbientBeat {
  eventId: string;
  type: 'flavor' | 'social' | 'environment';
  npcId?: string;
  topic: string;
  instruction: string;
  tag: TruthLayerTag;
  isRare?: boolean;
  isSynergy?: boolean;
}

export interface AudioEncounterUtterance {
  utteranceId: string;
  speakerId: string;
  fullText: string;
  maskedPortion: string;
  heardFragmentStandard: string;
  heardFragmentAdvantage: string;
}

export interface AudioLossState {
  utteranceId?: string;
  speakerId: string;
  fullText: string;
  audibleSegments: string[];
  maskedSegments: string[];
  audioConfidence: 'full' | 'partial' | 'lost';
  heardFragment: string;
}

// ── Investigation Depth System ──
export type ObservationFocus =
  | 'general'
  | 'surface_texture'
  | 'lighting_angle'
  | 'edges_framing'
  | 'pigment_layer'
  | 'distance_perspective'
  | 'art_historical_analysis'
  | 'comparative_storage'
  | 'penti_behavior'
  | 'sensory_smell'
  | 'font_comparison'
  | 'system_logs'
  | 'financial_ledger'
  | 'acoustic_distant'
  | 'vehicle_exterior'
  | 'vehicle_interior'
  | 'witness_statement'
  | 'clock_reference'
  | 'destructive_scrape';

export interface InvestigationTargetState {
  targetId: string;
  depth: number;
  maxDepth: number;
  observedAspects: ObservationFocus[];
  unlockedFactIds: string[];
  lastObservationFocus?: ObservationFocus;
}

export interface InvestigationResult {
  targetId: string;
  depthBefore: number;
  depthAfter: number;
  observationQuality: 'meaningful' | 'repetitive' | 'destructive' | 'superficial';
  focus: ObservationFocus;
  newlyUnlockedFactIds: string[];
}

// ── Ending Resolver & Multi-Dimensional Profile System ──
export type EndingId =
  | 'TRUE_ENDING'
  | 'THE_PRICE'
  | 'BROTHERS'
  | 'ESPRESSO'
  | 'EXPOSURE'
  | 'WRONG_MAN';

export interface PreservationProfile {
  peoplePreservation: number;     // 0 - 100
  truthPreservation: number;      // 0 - 100
  reputationPreservation: number; // 0 - 100
  financialPreservation: number;  // 0 - 100
}

export interface EndingEvaluationResult {
  endingId: EndingId;
  variantId: string;
  truthDiscovery: number;
  truthInterpretation: number;
  trustScore: number;
  preservation: PreservationProfile;
  epilogueText: string;
  explanation: {
    reasons: string[];
    vetoApplied?: string;
    roleLensUsed: PlayerClassId;
    priceVariant?: 'THE_PRICE_SIMPLE' | 'THE_PRICE_SACRIFICE';
    wrongManVariant?: 'accidental_suspicion' | 'destructive_false_accusation';
  };
  evaluatedAtTurn: number;
}

export interface RunState {
  version: 1;
  canonical: CanonicalRunState;
  scene: SceneState;
  npcMemory: Record<string, NpcMemory>;
  runSeed: number;
  runFlavor: Record<string, RunFlavor>;
  ambientHistory: Array<{ eventId: string; turn: number }>;
  lastAudioLoss?: AudioLossState;
  activeAudioEncounter?: AudioEncounterUtterance;
  investigationTargets?: Record<string, InvestigationTargetState>;
  lastInvestigationResult?: InvestigationResult;
  theories?: Record<string, PlayerTheory>;
  entityObservationCount?: Record<string, number>;
  redHerringInvestment?: Record<string, number>;
  redHerringPenaltiesApplied?: Record<string, boolean>;
  witnessStatements?: Record<string, WitnessStatement>;
  witnessRoles?: {
    routeWitnessRear: string;
    routeWitnessMain: string;
  };
  socialDuel?: SocialDuelState;
  archiveWorkspace?: ArchiveWorkspaceState;
  preservationProfile?: PreservationProfile;
  endingEvaluation?: EndingEvaluationResult;
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
  activeRunFlavors: RunFlavor[];
  scheduledAmbientBeat?: ScheduledAmbientBeat;
  audioLossContext?: AudioLossState;
  investigationResult?: InvestigationResult;
  activeTheories?: PlayerTheory[];
  socialDuel?: SocialDuelState;
  archiveWorkspace?: ArchiveWorkspaceState;
  endingEvaluation?: EndingEvaluationResult;
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

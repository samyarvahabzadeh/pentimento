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
  | "SELECT_ROLE_OBSERVER"
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
  playerInput?: string;
  narrative?: string;
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
  /** Player-authored identity, relationship, or motive from character intake. */
  playerIdentity?: string;
  /** Additive corrections preserve background instead of silently replacing it. */
  playerIdentityStatements?: string[];
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

// ─── Investigation Depth System ──────────────────────────────────
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

// ─── Ending Resolver & Multi-Dimensional Profile System ──────────
export type EndingId =
  | 'TRUE_ENDING'
  | 'THE_PRICE'
  | 'BROTHERS'
  | 'ESPRESSO'
  | 'EXPOSURE'
  | 'WRONG_MAN'
  // 💀 Re:Zero Style Disastrous Bad Endings (پایان‌های فاجعه‌بار و مرگبار)
  | 'BAD_ENDING_ABANDONMENT_ARSON'
  | 'BAD_ENDING_TOXIC_SHOCK'
  | 'BAD_ENDING_PSYCH_HOLD'
  | 'BAD_ENDING_SYNDICATE_ABDUCTION'
  | 'BAD_ENDING_INTERNAL_BETRAYAL'
  | 'BAD_ENDING_COLD_EXPULSION'
  | 'BAD_ENDING_POLICE_SHUTDOWN';



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

// ─── Pentimento Redesign v2 Contracts ───────────────────────────

export type ProofDomain = 'ART' | 'CHEM' | 'SYS' | 'SOCIAL' | 'FACTION';

export interface ThreatClocks {
  evidenceRemoval: number; // 0..4
  factionPressure: number; // 0..4
  npcPanic: number;        // 0..4
  policeAttention: number; // 0..4
  personalRisk: number;    // 0..4
}

export interface ApproachStats {
  art: number;      // 0..5
  chem: number;     // 0..5
  systems: number;  // 0..5
  social: number;   // 0..5
  risk: number;     // 0..5
  empathy: number;  // 0..5
}

export type ActionPrimitive =
  | 'move'
  | 'inspect'
  | 'touch'
  | 'take'
  | 'give'
  | 'hide'
  | 'use'
  | 'combine'
  | 'damage'
  | 'threaten'
  | 'persuade'
  | 'deceive'
  | 'ask'
  | 'accuse'
  | 'follow'
  | 'wait'
  | 'listen'
  | 'smell'
  | 'taste'
  | 'distract'
  | 'steal'
  | 'protect'
  | 'reveal'
  | 'leave'
  | 'block'
  | 'lock'
  | 'record'
  | 'improvise';

export interface SemanticAction {
  primitive: ActionPrimitive;
  target?: string;
  secondaryTarget?: string;
  method?: string;
  motive?: string;
  rawInput: string;
  confidence: number;
  isEmergent?: boolean;
}

export type CandidateActionKind =
  | 'inspect'
  | 'move'
  | 'ask'
  | 'pressure'
  | 'accuse'
  | 'use'
  | 'take'
  | 'leave'
  | 'wait'
  | 'theory'
  | 'other';

export interface Requirement {
  kind: 'evidence' | 'item' | 'flag' | 'min_trust' | 'min_pressure' | 'role' | 'clock_below' | 'lore_stage';
  targetId: string;
  value?: any;
}

export type CanonicalEffect =
  | { type: 'add_evidence'; evidenceId: string }
  | { type: 'add_inventory'; itemId: string }
  | { type: 'remove_inventory'; itemId: string }
  | { type: 'set_flag'; flag: string; value: boolean }
  | { type: 'change_scene'; sceneId: string; nodeId: string }
  | { type: 'modify_trust'; npcId: string; delta: number }
  | { type: 'modify_pressure'; npcId: string; delta: number }
  | { type: 'modify_clock'; clock: keyof ThreatClocks; delta: number; reason: string }
  | { type: 'add_proof_domain'; domain: ProofDomain; points: number }
  | { type: 'reveal_lore'; loreId: string }
  | { type: 'record_memory'; npcId: string; memory: string; tag: string }
  | { type: 'trigger_ending'; endingId: string; foreshadowId?: string; causeEventId?: string }
  | { type: 'modify_environment'; key: string; value: any };

export type ObjectProperty =
  | 'movable'
  | 'immovable'
  | 'solid'
  | 'liquid'
  | 'breakable'
  | 'readable'
  | 'container'
  | 'electrical'
  | 'acoustic'
  | 'reflective'
  | 'flammable'
  | 'transparent'
  | 'lockable'
  | 'wearable'
  | 'electronic'
  | 'living'
  | 'layered'
  | 'hot'
  | 'heavy';

export interface WorldObjectState {
  location: string;
  durability?: number;
  isOpen?: boolean;
  isLocked?: boolean;
  isOn?: boolean;
  isWet?: boolean;
  isDamaged?: boolean;
  isTorn?: boolean;
  temperature?: 'cold' | 'normal' | 'hot';
  contains?: string[];
  underneath?: string[];
  customAttributes?: Record<string, any>;
}

export interface InspectionProfile {
  defaultObservation: string;
  roleModifiers?: Partial<Record<PlayerClassId, string>>;
  /**
   * Authored discovery layers.  A generic inspection may describe the surface,
   * but canonical evidence is awarded only by a matching, undiscovered layer.
   */
  discoveries?: InspectionDiscovery[];
  inaccessibleObservation?: string;
}

export interface InspectionDiscovery {
  id: string;
  observation: string;
  repeatObservation?: string;
  primitives?: ActionPrimitive[];
  inputPatterns?: string[];
  roles?: PlayerClassId[];
  requiresEvidence?: string[];
  requiresAnyEvidence?: string[];
  requiresDiscoveries?: string[];
  evidenceIds?: string[];
  proofDomain?: { domain: ProofDomain; points: number };
  roleModifiers?: Partial<Record<PlayerClassId, string>>;
  priority?: number;
}

export interface LocationDefinition {
  id: string;
  nameFa: string;
  sceneId: string;
  nodeId: string;
  reachableFrom: string[];
  defaultDescription: string;
  activeEntityIds?: string[];
  visibleObjectIds?: string[];
  requiresEvidence?: string[];
  blockedDescription?: string;
}

export interface WorldObject {
  id: string;
  nameFa: string;
  properties: ObjectProperty[];
  affordances: ActionPrimitive[];
  state: WorldObjectState;
  inspectionProfile?: InspectionProfile;
}

export interface NpcGoalProfile {
  id: string;
  nameFa: string;
  goals: string[];
  fears: string[];
  loyalties: string[];
  currentKnowledge: string[];
  suspicion: number;
  trust: number;
  pressureThresholds: {
    fluster: number;
    breakdown: number;
  };
  behavioralTendencies: string[];
}

export interface CandidateAction {
  id: string;
  kind: CandidateActionKind;
  targetIds: string[];
  summary: string;
  requires?: Requirement[];
  effects: CanonicalEffect[];
  narrativeBeatId: string;
  risk: 0 | 1 | 2 | 3 | 4;
  roleAffinity?: PlayerClassId[];
  isExclusiveToRole?: PlayerClassId;
  isCompound?: boolean;
  semanticAction?: SemanticAction;
  isEmergent?: boolean;
  emergentProse?: string;
}

export interface DynamicEnvironmentState {
  doorBlocked?: boolean;
  entranceDoorOpen?: boolean;
  playerPosture?: string;
  guardingEntrance?: boolean;
  lightsOff?: boolean;
  recordingActive?: boolean;
  hiddenItems?: Record<string, string>;
  modifiedObjects?: Record<string, string>;
  customDistractions?: string[];
  delayedPlans?: Array<{ turnScheduled: number; action: SemanticAction; effect: CanonicalEffect }>;
  discoveredInspectionLayers?: Record<string, string[]>;
  revealedNpcKnowledge?: Record<string, string[]>;
  npcTopicHistory?: Record<string, string[]>;
}

// ─── Episode Situation Layer (v2.7) ─────────────────────────────────

export type SituationFrontId =
  | 'custodian_extraction'
  | 'redactor_cleanup'
  | 'cafe_fracture';

export type SituationRouteId =
  | 'forensic_chain'
  | 'social_alliance'
  | 'misdirection'
  | 'pursuit'
  | 'fortification'
  | 'public_exposure'
  | 'destruction';

export type SituationCrisisId =
  | 'painting_extraction'
  | 'blackout_cleanup'
  | 'staff_walkout';

export interface SituationFrontState {
  progress: number; // 0..6. Reaching 6 opens a crisis; it never causes an instant ending.
  contained: boolean;
  lastAdvancedPulse: number;
}

export interface SituationCrisisState {
  id: SituationCrisisId;
  frontId: SituationFrontId;
  openedAtPulse: number;
  deadlinePulse: number;
  status: 'open' | 'resolved' | 'costly_success' | 'missed';
  resolutionRoute?: SituationRouteId;
}

export interface SituationNpcIntentionState {
  npcId: string;
  intentId: string;
  stage: number;
  status: 'active' | 'changed' | 'completed' | 'broken';
  location: string;
  lastActedPulse: number;
}

export interface SituationEventRecord {
  eventId: string;
  pulse: number;
  frontId?: SituationFrontId;
  consequence?: string;
}

export interface SituationActionRecord {
  fingerprint: string;
  pulse: number;
}

/**
 * Authored truth + moving opposition.  This is deliberately separate from
 * currentNode: nodes remain compatibility/scene identifiers, not a golden path.
 */
export interface EpisodeSituationState {
  schemaVersion: '2.7';
  episodeId: 'episode_01_lot_55';
  activated: boolean;
  activatedAtTurn: number;
  pulse: number;
  pressurePattern: 'custodian_first' | 'cleanup_first' | 'fracture_first';
  fronts: Record<SituationFrontId, SituationFrontState>;
  npcIntentions: Record<string, SituationNpcIntentionState>;
  routeMarks: SituationRouteId[];
  leverage: string[];
  irreversibleConsequences: string[];
  openCrises: SituationCrisisState[];
  eventHistory: SituationEventRecord[];
  actionHistory: SituationActionRecord[];
}

export interface ClockChange {
  clock: keyof ThreatClocks;
  from: number;
  to: number;
  reason: string;
}

export interface MemoryWrite {
  npcId: string;
  summary: string;
  tag: string;
}

export interface TurnResolution {
  interpreted: {
    candidateId: string;
    confidence: number;
    speechAct?: string;
    tone?: string;
    targetNpc?: string;
  };
  acceptedEffects: CanonicalEffect[];
  rejectedEffects: string[];
  triggeredBeats: string[];
  clockChanges: ClockChange[];
  memoryWrites: MemoryWrite[];
  endingId?: string;
}

export interface LoopEcho {
  id: string;
  sourceEnding: string;
  hint: string;
  unlocksCandidateIds?: string[];
  maxUses?: number;
}

export interface LoopMeta {
  loopCount: number;
  echoes: string[];
  seenEndings: string[];
  activeEchoHints?: string[];
}

export interface HistoricalFact {
  id: string;
  dateOrEra: string;
  location: string;
  fact: string;
  source: string;
}

export interface FictionalFact {
  id: string;
  historicalAnchorId: string;
  narrativeOverlay: string;
  symbolMotifs: string[];
  loreStageRequired: 0 | 1 | 2 | 3;
}

export interface HistoricalDossier {
  id: string;
  name: string;
  verifiedHistory: HistoricalFact[];
  fictionalOverlay: FictionalFact[];
  rumors: string[];
  forbiddenClaims: string[];
}

export interface HistoricalLoreCard {
  id: string;
  classification: 'verified_history' | 'fictional_overlay' | 'rumor' | 'player_theory';
  title: string;
  safeText: string;
  revealed: boolean;
  stage: 0 | 1 | 2 | 3;
  forbiddenInferences: string[];
}

export interface KnowledgeCard {
  id: string;
  factIds: string[];
  truthMode: 'truth' | 'partial' | 'lie' | 'misremembered';
  minTrust?: number;
  minPressure?: number;
  requiresEvidence?: string[];
  allowedScenes: string[];
  dialogueVariants: {
    cooperative: string;
    guarded: string;
    irritated?: string;
    pressured?: string;
  };
}

export interface DisclosureRule {
  condition: string;
  revealsKnowledgeCardId: string;
}

export interface NpcRouteCard {
  npcId: string;
  nameFa: string;
  publicFace: string;
  privateFear: string;
  desire: string;
  lieStyle: 'deny' | 'redirect' | 'joke' | 'attack' | 'partial_truth';
  respects: string[];
  dislikes: string[];
  knowledgeCards: KnowledgeCard[];
  disclosureRules: DisclosureRule[];
  roleAffinities: Partial<Record<PlayerClassId, number>>;
  memoryHooks: string[];
}

export interface CandidateItemForRanker {
  id: string;
  summary: string;
  kind: CandidateActionKind;
  targetIds?: string[];
}

export interface TurnRankerPacket {
  sceneId: string;
  role: PlayerClassId;
  playerText: string;
  recentBeats: string[];
  visibleTargets: string[];
  presentNpcs: string[];
  candidates: CandidateItemForRanker[];
}

export interface IntentRankerOutput {
  candidateId: string;
  confidence: number;
  speechAct?: string;
  tone?: string;
  targetNpc?: string;
}

export interface RunState {
  version: 1 | 2;
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

  // V2 Fields
  proofDomains?: Record<ProofDomain, number>;
  approachStats?: ApproachStats;
  clocks?: ThreatClocks;
  loopMeta?: LoopMeta;
  revealedLore?: string[];
  redGloveLoreStage?: 0 | 1 | 2 | 3;
  npcTrust?: Record<string, number>;
  npcPressure?: Record<string, number>;
  activeTurnResolution?: TurnResolution;
  environmentState?: DynamicEnvironmentState;
  worldObjects?: Record<string, WorldObject>;
  npcGoalProfiles?: Record<string, NpcGoalProfile>;
  /** Persisted audit record for the most recently resolved player input. */
  lastTurnTrace?: ResolvedTurnTrace;
  /** Living episode state: factions and NPC plans advance independently of nodes. */
  situation?: EpisodeSituationState;
}

export interface ResolvedTurnTrace {
  rawInput: string;
  primitive?: string;
  target?: string;
  secondaryTarget?: string;
  sceneBefore: string;
  sceneAfter: string;
  selectedCandidateId?: string;
  resolutionPath:
    | 'generic_location_transition'
    | 'generic_entity_inspection'
    | 'generic_npc_interaction'
    | 'character_intake'
    | 'conversational_grounding'
    | 'special_authored_candidate'
    | 'deterministic'
    | 'semantic'
    | 'llm'
    | 'compound_sequence'
    | 'fallback';
  specialCandidateUsed: boolean;
  stateChanges: string[];
  evidenceAdded: string[];
  evidenceRemoved: string[];
  inventoryAdded: string[];
  flagsAdded: string[];
  proofDelta: Partial<Record<ProofDomain, number>>;
  subtraces?: ResolvedTurnTrace[];
  situationEvents?: string[];
  situationRoutesAdded?: SituationRouteId[];
  fallbackUsed: boolean;
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
  _debugInfo?: any;
}

export interface ActiveNpcPersona {
  id: string;
  formalName: string;
  publicCalling: string;
  archetype: string;
  currentLifeThreads: string[];
  socialWeakness: string;
  reactionToDanger: string;
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
  activeNpcPersonas?: ActiveNpcPersona[];
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

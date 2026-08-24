import { NODE_01_INITIAL_STATE } from '../canon/node01.js';
import { ROLE_DESCRIPTIONS } from '../canon/node00.js';
import type { RunState, ResolvedTurn, CanonicalEffect, TurnResolution, ResolvedTurnTrace, ProofDomain } from './types.js';
import type { LLMTransport } from '../transport/llmTransport.js';
import { appendEvent } from './eventLedger.js';
import { initRunFlavors } from './ambientScheduler.js';
import { processTurnTheories } from './theoryEngine.js';
import { generateSceneCandidates, matchCandidateDeterministically, buildTurnRankerPacket, extractSemanticAction } from './candidateGenerator.js';
import { decomposeMultiActionInput } from './multiActionEngine.js';
import { resolveCandidateAction } from './candidateResolver.js';
import { renderNarrative } from './narrativeRenderer.js';
import { rankIntentWithTransport } from '../director/directorService.js';
import { buildContext } from './contextBuilder.js';
import { evaluateEnding } from './endingResolver.js';
import { compileMemory } from './memoryCompiler.js';
import { validateAndSanitizeStoryNarrative } from './storyIntegrityValidator.js';
import { validatePlayerAgency } from './playerAgencyValidator.js';
import { findLocation, findWorldObject, INITIAL_WORLD_OBJECTS, isLocationReachable, isLocationUnlocked, synchronizeSceneRuntime } from './worldAffordances.js';
import { solveSemanticAction } from './semanticSolver.js';
import { normalizeSceneId, resolveLayeredInspection } from './evidenceGating.js';
import { advanceEpisodeSituation } from './situationDirector.js';

interface ResolvePlayerTurnOptions {
  skipCompoundDecomposition?: boolean;
}

const PROOF_DOMAINS: ProofDomain[] = ['ART', 'CHEM', 'SYS', 'SOCIAL', 'FACTION'];

function traceStateDelta(stateBefore: RunState, stateAfter: RunState) {
  const beforeEvidence = new Set(stateBefore.canonical.evidenceIds);
  const afterEvidence = new Set(stateAfter.canonical.evidenceIds);
  const beforeInventory = new Set(stateBefore.canonical.inventoryIds);
  const beforeFlags = new Set(stateBefore.canonical.canonicalFlags);
  const proofDelta: Partial<Record<ProofDomain, number>> = {};

  for (const domain of PROOF_DOMAINS) {
    const delta = (stateAfter.proofDomains?.[domain] ?? 0) - (stateBefore.proofDomains?.[domain] ?? 0);
    if (delta !== 0) proofDelta[domain] = delta;
  }

  return {
    evidenceAdded: stateAfter.canonical.evidenceIds.filter(id => !beforeEvidence.has(id)),
    evidenceRemoved: stateBefore.canonical.evidenceIds.filter(id => !afterEvidence.has(id)),
    inventoryAdded: stateAfter.canonical.inventoryIds.filter(id => !beforeInventory.has(id)),
    flagsAdded: stateAfter.canonical.canonicalFlags.filter(flag => !beforeFlags.has(flag)),
    proofDelta,
  };
}

function signedDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function describeCanonicalEffect(effect: CanonicalEffect): string {
  switch (effect.type) {
    case 'add_evidence':
      return `add_evidence:${effect.evidenceId}`;
    case 'add_inventory':
      return `add_inventory:${effect.itemId}`;
    case 'remove_inventory':
      return `remove_inventory:${effect.itemId}`;
    case 'set_flag':
      return `set_flag:${effect.flag}=${effect.value}`;
    case 'change_scene':
      return `change_scene:${effect.sceneId}@${effect.nodeId}`;
    case 'modify_trust':
      return `modify_trust:${effect.npcId}:${signedDelta(effect.delta)}`;
    case 'modify_pressure':
      return `modify_pressure:${effect.npcId}:${signedDelta(effect.delta)}`;
    case 'modify_clock':
      return `modify_clock:${effect.clock}:${signedDelta(effect.delta)}`;
    case 'add_proof_domain':
      return `add_proof_domain:${effect.domain}:${signedDelta(effect.points)}`;
    case 'reveal_lore':
      return `reveal_lore:${effect.loreId}`;
    case 'record_memory':
      return `record_memory:${effect.npcId}:${effect.tag}`;
    case 'trigger_ending':
      return `trigger_ending:${effect.endingId}`;
    case 'modify_environment':
      return `modify_environment:${effect.key}=${JSON.stringify(effect.value)}`;
  }
}

export async function resolvePlayerTurn(
  state: RunState,
  playerInput: string,
  transport?: LLMTransport,
  options: ResolvePlayerTurnOptions = {}
): Promise<ResolvedTurn & { _debugInfo?: any; _output?: any }> {
  // 1. Initialize runtime structures if needed
  if (!state.runSeed) {
    state.runSeed = Math.floor(Math.random() * 1000000) + 1;
  }
  if (!state.runFlavor) {
    state.runFlavor = initRunFlavors(state.runSeed);
  }
  if (!state.ambientHistory) {
    state.ambientHistory = [];
  }
  if (!state.canonical.evidenceIds) {
    state.canonical.evidenceIds = [];
  }
  if (!state.canonical.inventoryIds) {
    state.canonical.inventoryIds = [];
  }
  if (!state.canonical.canonicalFlags) {
    state.canonical.canonicalFlags = [];
  }
  synchronizeSceneRuntime(state);

  // Snapshot before any interpretation module is allowed to mutate player
  // knowledge.  Legacy investigation-depth hooks used to award facts here,
  // before the selected action was validated; layered inspection now owns it.
  const stateBefore: RunState = JSON.parse(JSON.stringify(state));

  // Check if player input is an explicit leave intent
  const isLeave = /می‌?رم\s*خونه|میرم\s*خونه|ولش\s*کن|برم\s*بخوابم|بی‌?خیال/.test(playerInput);

  // Compound inputs must use the same validated pipeline as ordinary turns.
  // The old multi-action executor called the legacy semantic solver directly,
  // bypassing scene reachability and authored discovery gates.
  const subActions = isLeave || options.skipCompoundDecomposition
    ? []
    : decomposeMultiActionInput(playerInput, state);
  if (subActions.length > 1) {
    const componentResults: Array<ResolvedTurn & { _debugInfo?: any; _output?: any }> = [];
    const narratives: string[] = [];

    for (let index = 0; index < subActions.length; index += 1) {
      const component = await resolvePlayerTurn(
        state,
        subActions[index].rawInput,
        transport,
        { skipCompoundDecomposition: true }
      );
      componentResults.push(component);
      narratives.push(`[مرحلهٔ ${index + 1}]: ${component.narrative}`);
    }

    const subtraces = componentResults
      .map(result => result._debugInfo?.trace as ResolvedTurnTrace | undefined)
      .filter((trace): trace is ResolvedTurnTrace => Boolean(trace));
    const delta = traceStateDelta(stateBefore, state);
    const trace: ResolvedTurnTrace = {
      rawInput: playerInput,
      primitive: 'compound',
      target: subActions[0]?.target,
      secondaryTarget: subActions[0]?.secondaryTarget,
      sceneBefore: stateBefore.canonical.currentScene || stateBefore.scene.sceneId,
      sceneAfter: state.canonical.currentScene || state.scene.sceneId,
      selectedCandidateId: 'COMPOUND_SEQUENCE',
      resolutionPath: 'compound_sequence',
      specialCandidateUsed: subtraces.some(item => item.specialCandidateUsed),
      stateChanges: subtraces.flatMap(item => item.stateChanges),
      ...delta,
      subtraces,
      fallbackUsed: subtraces.some(item => item.fallbackUsed),
    };
    state.lastTurnTrace = trace;

    appendEvent(state.canonical.runId, 'compound_action.resolved', state.scene.turn, {
      subActionsCount: subActions.length,
      componentPaths: subtraces.map(item => item.resolutionPath),
    });

    return {
      narrative: narratives.join('\n\n'),
      source: 'deterministic',
      interpretation: {
        kind: 'other',
        targetId: subActions[0].target,
        intentSummary: playerInput,
      },
      validation: {
        acceptedActionId: 'compound_action' as any,
        acceptedSoftEffects: [],
        rejected: [],
      },
      stateBefore,
      stateAfter: state,
      _debugInfo: { provider: 'validated_compound_pipeline', trace, subtraces },
      _output: {
        version: 1,
        narrative: narratives.join('\n\n'),
        interpretation: {
          kind: 'other',
          targetId: subActions[0].target,
          intentSummary: playerInput,
        },
        softEffects: [],
        memoryCandidates: [],
        referencedFactIds: [],
      },
    };
  }

  // Theory parsing runs only after compound decomposition, so a rejected outer
  // sentence cannot mutate knowledge before its individual actions validate.
  if (/رمز|تاریخ|انبار|اموال|آدرس|فرضیه|حدس|شاید|به نظرم|تئوری|جایگزین|انجمن|دستکش|جعل|فاکتور|دوربین|هفت|دقیقه|پاک|نوشته|Lot|کاشتن|عمداً|تعقیب|مراقبت|ماشین|خودرو|تصادفی|مسیر|پشتی|اصلی|ساعت|زمان|دروغ|تناقض/.test(playerInput)) {
    processTurnTheories(state, playerInput);
  }

  // 2. Extract Semantic Action
  const semantic = extractSemanticAction(playerInput, state);
  const directNpcIds = ['salar', 'mani', 'yashin', 'haniyeh', 'collector', 'exiting_man'];
  const directNpc = directNpcIds.find(id => semantic.target === id || (semantic.target ?? '').includes(id));

  // 3. Special Authored Candidates Check
  const candidates = generateSceneCandidates(state, playerInput);
  const detMatch = matchCandidateDeterministically(playerInput, candidates, state);

  let selectedCandidate: any = candidates[0] || { id: 'GENERIC_INTERACTION', kind: 'inspect', targetIds: [semantic.target || 'world'], summary: 'کنش عمومی' };
  let interpretation = {
    candidateId: selectedCandidate.id,
    confidence: 0.9,
    speechAct: 'action',
    tone: 'neutral',
    targetNpc: undefined as string | undefined,
  };
  let source: 'director' | 'deterministic' | 'authored_fallback' = 'deterministic';
  let resolutionPath:
    | 'generic_location_transition'
    | 'generic_entity_inspection'
    | 'generic_npc_interaction'
    | 'special_authored_candidate'
    | 'deterministic'
    | 'semantic'
    | 'llm'
    | 'compound_sequence'
    | 'fallback' = 'deterministic';
  let specialCandidateUsed = false;
  let fallbackUsed = false;
  let debugInfo: any = { provider: 'deterministic_engine', latency: 0 };
  function createTurnResolution(
    candidateId: string,
    acceptedEffects: CanonicalEffect[] = [],
    memoryWrites: any[] = []
  ): TurnResolution {
    return {
      interpreted: {
        candidateId,
        confidence: 0.95,
        speechAct: 'action',
        tone: 'neutral',
      },
      acceptedEffects,
      rejectedEffects: [],
      triggeredBeats: [],
      clockChanges: [],
      memoryWrites,
    };
  }

  function makeSyntheticCandidate(id: string, kind: any, targetIds: string[], summary: string): any {
    return {
      id,
      kind,
      targetIds,
      summary,
      effects: [],
      narrativeBeatId: `beat_${id.toLowerCase()}`,
      risk: 0,
    };
  }

  let resolution: TurnResolution = createTurnResolution('GENERIC_ACTION');
  let rawNarrative: string = '';
  let actionSucceeded = true;

  // ─── STEP 1: Special Authored Candidates ───
  if (detMatch && detMatch.confidence >= 0.95) {
    const cand = candidates.find(c => c.id === detMatch.candidateId);
    if (cand && !cand.isEmergent && cand.id !== 'action_observe_surroundings') {
      selectedCandidate = cand;
      interpretation.candidateId = cand.id;
      interpretation.confidence = detMatch.confidence;
      source = 'deterministic';
      resolutionPath = 'special_authored_candidate';
      specialCandidateUsed = true;
      resolution = resolveCandidateAction(state, selectedCandidate, interpretation);
      rawNarrative = renderNarrative({
        state,
        resolution,
        playerInput,
        candidate: selectedCandidate,
      });
    }
  }

  // ─── STEP 2: Generic MOVE Dispatch ───
  const isObjectManipulationMove = /هل|پرت|جابه‌?جا|سُر|می‌?کشم|بکشم|بلند/.test(playerInput);
  if (!specialCandidateUsed && semantic.primitive === 'move' && semantic.target !== 'behind_counter' && !isObjectManipulationMove) {
    const targetLoc =
      findLocation(playerInput) ||
      (semantic.target ? findLocation(semantic.target) : undefined) ||
      (semantic.method ? findLocation(semantic.method) : undefined);

    if (targetLoc) {
      resolutionPath = 'generic_location_transition';
      specialCandidateUsed = false;
      source = 'deterministic';
      selectedCandidate = makeSyntheticCandidate('GENERIC_MOVE', 'move', [targetLoc.id], `حرکت به ${targetLoc.nameFa}`);

      const effects: CanonicalEffect[] = [];
      const fromScene = normalizeSceneId(state.canonical.currentScene || state.scene.sceneId);
      if (!isLocationReachable(fromScene, targetLoc.sceneId)) {
        actionSucceeded = false;
        resolution = createTurnResolution('GENERIC_MOVE_BLOCKED');
        rawNarrative = `از موقعیت فعلی راه مستقیمی به «${targetLoc.nameFa}» نداری. باید از مسیرهای متصل کافه حرکت کنی.`;
      } else if (!isLocationUnlocked(targetLoc, state)) {
        actionSucceeded = false;
        resolution = createTurnResolution('GENERIC_MOVE_GATED');
        rawNarrative = targetLoc.blockedDescription ?? 'برای رفتن به این مرحله هنوز مدارک کافی در اختیار نداری.';
      } else {
        state.canonical.currentScene = targetLoc.sceneId;
        state.canonical.currentNode = targetLoc.nodeId;
        state.scene.sceneId = targetLoc.sceneId;
        state.scene.nodeId = targetLoc.nodeId;
        state.scene.activeEntityIds = [...(targetLoc.activeEntityIds ?? [])];
        state.scene.visibleObjectIds = [...(targetLoc.visibleObjectIds ?? [])];
        synchronizeSceneRuntime(state);
        if (fromScene !== targetLoc.sceneId) {
          effects.push({ type: 'change_scene', sceneId: targetLoc.sceneId, nodeId: targetLoc.nodeId });
        }
        resolution = createTurnResolution('GENERIC_MOVE', effects);
        rawNarrative = fromScene === 'scene_entrance' && targetLoc.sceneId === 'scene_table5'
          ? 'در شیشه‌ای را پشت سر می‌بندی و وارد سالن اصلی کافه می‌شوی. چند قدم جلوتر، میز شمارهٔ ۵ با فنجان رهاشده دیده می‌شود؛ حانیه نزدیک میز ایستاده و پنتی زیر صندلی کز کرده است.'
          : targetLoc.defaultDescription;
      }
    }
  }

  // ─── STEP 3: Generic INSPECT Dispatch ───
  if (!specialCandidateUsed && !rawNarrative && (semantic.primitive === 'inspect' || semantic.primitive === 'smell' || semantic.primitive === 'taste' || semantic.primitive === 'take')) {
    const worldObjs = state.worldObjects || INITIAL_WORLD_OBJECTS;
    const targetObj =
      (semantic.target ? findWorldObject(semantic.target, worldObjs) : undefined) ||
      (semantic.method ? findWorldObject(semantic.method, worldObjs) : undefined) ||
      findWorldObject(playerInput, worldObjs);

    if (targetObj && targetObj.inspectionProfile) {
      resolutionPath = 'generic_entity_inspection';
      specialCandidateUsed = false;
      source = 'deterministic';

      selectedCandidate = makeSyntheticCandidate('GENERIC_INSPECT', 'inspect', [targetObj.id], `بررسی ${targetObj.nameFa}`);
      const impossibleTake = semantic.primitive === 'take' && (
        targetObj.properties.includes('immovable') ||
        targetObj.properties.includes('heavy')
      );
      const inspection = impossibleTake
        ? {
            narrative: `${targetObj.nameFa} سنگین و به تجهیزات محل متصل است؛ بلندکردن آن با یک دست یا گذاشتنش در جیب ممکن نیست.`,
            effects: [] as CanonicalEffect[],
            accessible: true,
            discoveryId: undefined,
          }
        : resolveLayeredInspection(targetObj, semantic, state);
      if (semantic.primitive === 'take' && inspection.accessible && targetObj.properties.includes('movable')) {
        const inventoryId = targetObj.id === 'wet_receipt'
          ? 'item_wet_receipt'
          : targetObj.id === 'table5_cup'
            ? 'item_sample_cup'
            : targetObj.id;
        if (!state.canonical.inventoryIds.includes(inventoryId)) {
          state.canonical.inventoryIds.push(inventoryId);
          inspection.effects.push({ type: 'add_inventory', itemId: inventoryId });
          if (state.worldObjects?.[targetObj.id]) {
            state.worldObjects[targetObj.id].state.location = 'in_bag';
          }
        }
      }
      resolution = createTurnResolution(inspection.accessible ? 'GENERIC_INSPECT' : 'GENERIC_INSPECT_OUT_OF_REACH', inspection.effects);
      actionSucceeded = inspection.accessible && !impossibleTake;
      rawNarrative = inspection.narrative;
      debugInfo.inspectionDiscoveryId = inspection.discoveryId;
    }
  }

  // ─── STEP 4: Generic NPC Interaction Dispatch ───
  // Every social verb uses the same presence check.  Deceiving or threatening
  // an NPC in another room used to succeed through the lower-level solver.
  const socialPrimitives = ['ask', 'persuade', 'deceive', 'threaten', 'accuse', 'give'] as const;
  const presentNpcs = state.scene.activeEntityIds.map(id => id.replace('_salehi', ''));
  const remoteCollectorContact = directNpc === 'collector' &&
    state.canonical.canonicalFlags.includes('collector_contact_open') &&
    /تماس|گوشی|تلفن|بلندگو|زنگ|پیام/.test(playerInput);

  // Presence also guards non-dialogue actions aimed directly at a person
  // (recording, protecting, striking, or ordering someone). Previously only
  // canonical social verbs were checked, so a sentence containing «خاموشی»
  // could command Yashin from another room by being parsed as "use".
  if (
    !specialCandidateUsed &&
    !rawNarrative &&
    directNpc &&
    !['move', 'follow'].includes(semantic.primitive) &&
    !presentNpcs.includes(directNpc) &&
    !remoteCollectorContact
  ) {
    actionSucceeded = false;
    resolutionPath = 'generic_npc_interaction';
    selectedCandidate = makeSyntheticCandidate('GENERIC_NPC_NOT_PRESENT', 'other', [directNpc], `تعامل با ${directNpc}`);
    resolution = createTurnResolution('GENERIC_NPC_NOT_PRESENT');
    rawNarrative = 'کسی که خطابش می‌کنی در این بخش حضور ندارد. باید اول به محل او بروی یا راه ارتباطی معتبری باز کنی.';
  }

  if (!specialCandidateUsed && !rawNarrative && socialPrimitives.includes(semantic.primitive as any)) {
    const matchedNpc = directNpc ?? directNpcIds.find(id => (semantic.method || '').includes(id) || playerInput.includes(id));
    if (matchedNpc) {
      resolutionPath = 'generic_npc_interaction';
      specialCandidateUsed = false;
      source = 'deterministic';

      selectedCandidate = makeSyntheticCandidate('GENERIC_NPC_INTERACTION', 'ask', [matchedNpc], `تعامل با ${matchedNpc}`);
      if (!presentNpcs.includes(matchedNpc) && !remoteCollectorContact) {
        actionSucceeded = false;
        resolution = createTurnResolution('GENERIC_NPC_NOT_PRESENT');
        rawNarrative = 'کسی که خطابش می‌کنی در این بخش حضور ندارد. باید اول به محل او بروی.';
      } else {
        const solverRes = solveSemanticAction(semantic, state);
        actionSucceeded = solverRes.isSuccess;
        resolution = createTurnResolution('GENERIC_NPC_INTERACTION', solverRes.acceptedEffects);
        rawNarrative = solverRes.narrative;
      }
    }
  }

  // ─── STEP 5: Other Emergent Physical / Affordance Actions ───
  if (!specialCandidateUsed && !rawNarrative) {
    const solverRes = solveSemanticAction(semantic, state);
    actionSucceeded = solverRes.isSuccess;
    resolutionPath = 'semantic';
    specialCandidateUsed = false;
    source = 'deterministic';
    selectedCandidate = makeSyntheticCandidate('GENERIC_EMERGENT', 'other', [semantic.target || 'world'], playerInput);
    resolution = createTurnResolution('GENERIC_EMERGENT', solverRes.acceptedEffects);
    rawNarrative = solverRes.narrative;
  }

  // ─── STEP 6: Fallback ───
  if (!rawNarrative) {
    actionSucceeded = false;
    fallbackUsed = true;
    resolutionPath = 'fallback';
    source = 'authored_fallback';
    resolution = createTurnResolution('GENERIC_FALLBACK');
    rawNarrative = `با دقت فضا را بررسی می‌کنی و وضعیت صحنه را زیر نظر می‌گیری.`;
  }

  state.activeTurnResolution = resolution;

  // 5. Special Node transitions (e.g. Node 00 -> Node 01)
  if (stateBefore.canonical.currentNode === 'NODE_00' && state.canonical.currentNode === 'NODE_01') {
    const roleKey = state.canonical.playerClass ?? 'art_historian';
    const roleFa = (ROLE_DESCRIPTIONS as any)[roleKey]?.fa ?? 'مورخ هنری';
    appendEvent(state.canonical.runId, 'role.selected', state.scene.turn, { role: roleKey });
  }

  // 6. Check Ending Resolution if in finale
  if (!resolution.endingId && state.canonical.currentNode === 'NODE_18' && selectedCandidate.id === 'RESOLVE_FINAL_ENDING_DECISION') {
    state.endingEvaluation = evaluateEnding(state);
    if (state.endingEvaluation) {
      resolution.endingId = state.endingEvaluation.endingId;
      state.canonical.endingId = state.endingEvaluation.endingId;
      rawNarrative = state.endingEvaluation.epilogueText;
    }
  }

  // The situation layer advances independently of node progression.  It may
  // make an NPC act, open/resolve a crisis, or turn a missed intervention into
  // a new route.  It never invents canonical truth and never instant-fails a run.
  const situationOutcome = advanceEpisodeSituation(state, {
    rawInput: playerInput,
    primitive: semantic.primitive,
    target: semantic.target,
    secondaryTarget: semantic.secondaryTarget,
    sceneBefore: stateBefore.canonical.currentScene || stateBefore.scene.sceneId,
    sceneAfter: state.canonical.currentScene || state.scene.sceneId,
    acceptedEffects: resolution.acceptedEffects,
    actionSucceeded,
  });
  if (situationOutcome.narrativeOverride) {
    rawNarrative = situationOutcome.narrativeOverride;
  }
  if (situationOutcome.narrativeAppend) {
    rawNarrative = `${rawNarrative}\n\n${situationOutcome.narrativeAppend}`;
  }
  debugInfo.situation = situationOutcome;

  const agencyValidation = validatePlayerAgency(rawNarrative, state, playerInput, selectedCandidate);
  const integrityValidation = validateAndSanitizeStoryNarrative(agencyValidation.sanitizedNarrative, state, playerInput);
  const narrative = integrityValidation.sanitizedNarrative;

  // 7. Event Ledger & Memory Compilation
  state.scene.turn += 1;

  appendEvent(state.canonical.runId, 'candidate.resolved', state.scene.turn, {
    candidateId: selectedCandidate.id,
    effectsCount: resolution.acceptedEffects.length,
    endingId: resolution.endingId,
  });

  // Record scene beat
  state.scene.recentBeats.push({
    turn: state.scene.turn,
    summary: selectedCandidate.summary || playerInput,
    playerInput,
    narrative,
    actors: state.scene.activeEntityIds,
    topics: selectedCandidate.targetIds || [semantic.target || 'world'],
    importance: selectedCandidate.risk && selectedCandidate.risk > 1 ? 4 : 2,
  });

  // Memory compilation if memoryWrites present
  if (resolution.memoryWrites && resolution.memoryWrites.length > 0) {
    compileMemory(
      state,
      resolution.memoryWrites.map(m => ({
        scope: 'npc',
        subjectId: m.npcId,
        summary: m.summary,
        importance: 3,
        tag: m.tag as any,
      }))
    );
  }

  // Track state changes for ResolvedTurnTrace
  const stateChanges: string[] = [];
  if (stateBefore.canonical.currentNode !== state.canonical.currentNode) {
    stateChanges.push(`node:${stateBefore.canonical.currentNode}->${state.canonical.currentNode}`);
  }
  if (stateBefore.canonical.currentScene !== state.canonical.currentScene) {
    stateChanges.push(`scene:${stateBefore.canonical.currentScene}->${state.canonical.currentScene}`);
  }
  for (const eff of resolution.acceptedEffects) {
    stateChanges.push(describeCanonicalEffect(eff));
  }
  for (const eventId of situationOutcome.eventIds) {
    stateChanges.push(`situation_event:${eventId}`);
  }

  const trace: ResolvedTurnTrace = {
    rawInput: playerInput,
    primitive: semantic.primitive,
    target: semantic.target,
    secondaryTarget: semantic.secondaryTarget,
    sceneBefore: stateBefore.canonical.currentScene || stateBefore.scene.sceneId,
    sceneAfter: state.canonical.currentScene || state.scene.sceneId,
    selectedCandidateId: selectedCandidate.id,
    resolutionPath,
    specialCandidateUsed,
    stateChanges,
    ...traceStateDelta(stateBefore, state),
    situationEvents: situationOutcome.eventIds,
    situationRoutesAdded: situationOutcome.routesAdded,
    fallbackUsed,
  };

  debugInfo.trace = trace;
  state.lastTurnTrace = trace;

  function candidateKindToIntentKind(kind: any): any {
    switch (kind) {
      case 'inspect': return 'observe';
      case 'ask': return 'speak';
      case 'pressure': return 'threaten';
      case 'accuse': return 'threaten';
      case 'move': return 'move';
      case 'use': return 'physical';
      case 'take': return 'physical';
      case 'leave': return 'move';
      case 'wait': return 'rest';
      case 'theory': return 'theory';
      default: return 'other';
    }
  }

  const mappedIntentKind = candidateKindToIntentKind(selectedCandidate.kind);

  return {
    narrative,
    source,
    interpretation: {
      kind: mappedIntentKind,
      targetId: selectedCandidate.targetIds[0],
      intentSummary: selectedCandidate.summary,
    },
    validation: {
      acceptedActionId: selectedCandidate.id as any,
      acceptedSoftEffects: [],
      rejected: [],
    },
    stateBefore,
    stateAfter: state,
    _debugInfo: debugInfo,
    _output: {
      version: 1,
      narrative,
      interpretation: {
        kind: mappedIntentKind,
        targetId: selectedCandidate.targetIds[0],
        intentSummary: selectedCandidate.summary,
      },
      softEffects: [],
      memoryCandidates: [],
      referencedFactIds: [],
    },
  };
}

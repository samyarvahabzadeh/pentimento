import { NODE_01_INITIAL_STATE } from '../canon/node01.js';
import { ROLE_DESCRIPTIONS } from '../canon/node00.js';
import { RunState, ResolvedTurn } from './types.js';
import { buildContext } from './contextBuilder.js';
import type { LLMTransport } from '../transport/llmTransport.js';
import { runDirector } from '../director/directorService.js';
import { createFallbackOutput } from '../director/fallbacks.js';
import { validateProposal } from './proposalValidator.js';
import { applyValidatedTurn } from './gameEngine.js';
import { compileMemory } from './memoryCompiler.js';
import { appendEvent } from './eventLedger.js';
import { initRunFlavors } from './ambientScheduler.js';
import { processAudioInformationLoss } from './audioInformationLoss.js';
import { processInvestigationDepth } from './investigationDepth.js';
import { processTurnTheories } from './theoryEngine.js';
import { NODE_00_ALLOWED_ACTIONS } from '../canon/node00.js';
import { NODE_01_ALLOWED_ACTIONS } from '../canon/node01.js';
import { NODE_02_ALLOWED_ACTIONS } from '../canon/node02.js';
import { NODE_03_ALLOWED_ACTIONS } from '../canon/node03.js';
import { NODE_04_ALLOWED_ACTIONS } from '../canon/node04.js';
import { NODE_05_ALLOWED_ACTIONS } from '../canon/node05.js';
import { NODE_06_ALLOWED_ACTIONS } from '../canon/node06.js';
import { NODE_07_ALLOWED_ACTIONS } from '../canon/node07.js';
import { NODE_08_ALLOWED_ACTIONS } from '../canon/node08.js';
import { NODE_09_ALLOWED_ACTIONS } from '../canon/node09.js';
import { NODE_10_ALLOWED_ACTIONS } from '../canon/node10.js';
import { NODE_11_ALLOWED_ACTIONS } from '../canon/node11.js';
import { NODE_12_ALLOWED_ACTIONS } from '../canon/node12.js';
import { NODE_13_ALLOWED_ACTIONS } from '../canon/node13.js';
import { NODE_14_ALLOWED_ACTIONS } from '../canon/node14.js';
import { NODE_15_ALLOWED_ACTIONS } from '../canon/node15.js';
import { NODE_16_ALLOWED_ACTIONS } from '../canon/node16.js';
import { NODE_17_ALLOWED_ACTIONS } from '../canon/node17.js';
import { NODE_18_ALLOWED_ACTIONS } from '../canon/node18.js';

export async function resolvePlayerTurn(
  state: RunState,
  playerInput: string,
  transport: LLMTransport
): Promise<ResolvedTurn & { _debugInfo?: any; _output?: any }> {
  // Ensure runSeed and runFlavor exist on state
  if (!state.runSeed) {
    state.runSeed = Math.floor(Math.random() * 1000000) + 1;
  }
  if (!state.runFlavor) {
    state.runFlavor = initRunFlavors(state.runSeed);
  }
  if (!state.ambientHistory) {
    state.ambientHistory = [];
  }

  // Pre-calculate acoustic information loss if in NODE_04
  if (state.canonical.currentNode === 'NODE_04') {
    state.lastAudioLoss = processAudioInformationLoss(state, undefined, playerInput);
  }

  // Pre-calculate investigation depth state if examining central painting in NODE_06
  if (state.canonical.currentNode === 'NODE_06' && /تابلو|نقاشی|بوم|رنگ|قاب/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'central_painting', undefined, playerInput);
  }

  // Pre-calculate investigation depth state if in NODE_08 (Storage)
  if (state.canonical.currentNode === 'NODE_08' && /کارتن|جعبه|بسته|انبار|قفسه|غبار|تمیز|مقایسه/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'storage_area', undefined, playerInput);
  }

  // Pre-calculate investigation depth state if in NODE_10 (Penti Area)
  if (state.canonical.currentNode === 'NODE_10' && /پنتی|گربه|رفتار|وسیله|شیء|بو|شوینده|تمیزکننده|اسباب/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'penti_area', undefined, playerInput);
  }

  // Pre-calculate investigation depth state if in NODE_11 (Ledger / Office)
  if (state.canonical.currentNode === 'NODE_11' && /فاکتور|سند|زونکن|دفتر|فونت|قلم|چاپ|جعل|صالحی/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'office_invoice', undefined, playerInput);
  }

  // Pre-calculate investigation depth state if in NODE_12 (Cameras / Security)
  if (state.canonical.currentNode === 'NODE_12' && /دوربین|فیلم|ویدیو|مانیتور|لاگ|هفت.*دقیقه|پاک|نوشته|مهری/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'camera_system', undefined, playerInput);
  }

  // Pre-calculate investigation depth state if in NODE_13/14 (Parked Car / Hosseini Alley)
  if ((state.canonical.currentNode === 'NODE_13' || state.canonical.currentNode === 'NODE_14') && /ماشین|خودرو|پلاک|شیشه|کابین|موتور|کوچه|حسینی/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'parked_car', undefined, playerInput);
  }

  // Pre-calculate investigation depth state if in NODE_15 (Conflicting Witnesses / Route)
  if (state.canonical.currentNode === 'NODE_15' && /مسیر|پشتی|اصلی|خروج|ساعت|زمان|تناقض|شهادت|دروغ/.test(playerInput)) {
    state.lastInvestigationResult = processInvestigationDepth(state, 'witness_conflict', undefined, playerInput);
  }

  // Pre-calculate theory ledger if discussing hypotheses
  if (/رمز|تاریخ|انبار|اموال|آدرس|فرضیه|حدس|شاید|به نظرم|تئوری|جایگزین|انجمن|جعل|فاکتور|دوربین|هفت|دقیقه|پاک|نوشته|Lot|کاشتن|عمداً|تعقیب|مراقبت|ماشین|خودرو|تصادفی|مسیر|پشتی|اصلی|ساعت|زمان|دروغ|تناقض/.test(playerInput)) {
    processTurnTheories(state, playerInput);
  }

  appendEvent(state.canonical.runId, 'turn.received', state.scene.turn, { input: playerInput.substring(0, 200) });

  // 1. Build context (layered, minimal — no full history)
  const context = buildContext(state, playerInput);

  // If entering a new scene/node, record transition event
  if (state.scene.turn === 0 || state.canonical.currentNode !== context.canonical.currentNode) {
    appendEvent(state.canonical.runId, 'canonical.transition', state.scene.turn, {
      fromNode: state.canonical.currentNode,
      toNode: context.canonical.currentNode,
      turn: state.scene.turn,
    });
  }

  // Track scheduled ambient beat if one was triggered
  if (context.scheduledAmbientBeat) {
    state.ambientHistory.push({
      eventId: context.scheduledAmbientBeat.eventId,
      turn: state.scene.turn,
    });
  }

  // 2. Call Director (may fail → fallback)
  let directorResult = await runDirector(context, transport);
  let source: 'director' | 'authored_fallback';
  let output: ReturnType<typeof createFallbackOutput>;
  let debugInfo: any;

  if (directorResult) {
    source = 'director';
    output = directorResult.output;
    debugInfo = directorResult.debugInfo;
    appendEvent(state.canonical.runId, 'director.completed', state.scene.turn, {
      model: debugInfo.model, latency: debugInfo.latency,
    });
  } else {
    source = 'authored_fallback';
    output = createFallbackOutput(state.canonical.currentNode, playerInput);
    debugInfo = { provider: 'none', model: 'none', latency: 0, parseSuccess: false };
    appendEvent(state.canonical.runId, 'director.failed', state.scene.turn, { input: playerInput.substring(0, 100) });
  }

  // 3. Validate proposals (Validator never invents — only screens)
  const currentNode = state.canonical.currentNode;
  const allowedActions = (
    currentNode === 'NODE_00'
  ) ? NODE_00_ALLOWED_ACTIONS : (
    currentNode === 'NODE_01'
  ) ? NODE_01_ALLOWED_ACTIONS : (
    currentNode === 'NODE_02' || currentNode === 'NODE_01_INSIDE'
  ) ? NODE_02_ALLOWED_ACTIONS : (
    currentNode === 'NODE_03'
  ) ? NODE_03_ALLOWED_ACTIONS : (
    currentNode === 'NODE_04'
  ) ? NODE_04_ALLOWED_ACTIONS : (
    currentNode === 'NODE_05'
  ) ? NODE_05_ALLOWED_ACTIONS : (
    currentNode === 'NODE_06'
  ) ? NODE_06_ALLOWED_ACTIONS : (
    currentNode === 'NODE_07'
  ) ? NODE_07_ALLOWED_ACTIONS : (
    currentNode === 'NODE_08'
  ) ? NODE_08_ALLOWED_ACTIONS : (
    currentNode === 'NODE_09'
  ) ? NODE_09_ALLOWED_ACTIONS : (
    currentNode === 'NODE_10'
  ) ? NODE_10_ALLOWED_ACTIONS : (
    currentNode === 'NODE_11'
  ) ? NODE_11_ALLOWED_ACTIONS : (
    currentNode === 'NODE_12'
  ) ? NODE_12_ALLOWED_ACTIONS : (
    currentNode === 'NODE_13'
  ) ? NODE_13_ALLOWED_ACTIONS : (
    currentNode === 'NODE_14'
  ) ? NODE_14_ALLOWED_ACTIONS : (
    currentNode === 'NODE_15'
  ) ? NODE_15_ALLOWED_ACTIONS : (
    currentNode === 'NODE_16'
  ) ? NODE_16_ALLOWED_ACTIONS : (
    currentNode === 'NODE_17'
  ) ? NODE_17_ALLOWED_ACTIONS : (
    currentNode === 'NODE_18'
  ) ? NODE_18_ALLOWED_ACTIONS : [];

  const validation = validateProposal(state, output, allowedActions);

  if (validation.acceptedActionId) {
    appendEvent(state.canonical.runId, 'proposal.accepted', state.scene.turn, {
      action: validation.acceptedActionId,
      confidence: output.canonicalActionProposal?.confidence,
    });
  }
  if (validation.rejected.length > 0) {
    appendEvent(state.canonical.runId, 'proposal.rejected', state.scene.turn, {
      reasons: validation.rejected,
    });
  }

  // 4. Game Engine is the ONLY thing that mutates state
  const stateBefore: RunState = JSON.parse(JSON.stringify(state));

  // Fallback: NO state mutation (canonical facts stay clean)
  if (source === 'authored_fallback') {
    state.scene.turn += 1;
    return {
      narrative: output.narrative,
      source,
      interpretation: output.interpretation,
      validation: { acceptedActionId: undefined, acceptedSoftEffects: [], rejected: [] },
      stateBefore,
      stateAfter: state,
      _debugInfo: debugInfo,
      _output: output,
    };
  }

  // Apply state changes via GameEngine (including deterministic physical attempt resolver & audio loss & investigation depth)
  applyValidatedTurn(state, validation, output.interpretation, output.narrative, playerInput);

  // If transitioning from NODE_00 (Role Selection) into NODE_01 (Opening Entrance Encounter)
  if (stateBefore.canonical.currentNode === 'NODE_00' && state.canonical.currentNode === 'NODE_01') {
    const roleKey = state.canonical.playerClass ?? 'art_historian';
    const roleFa = (ROLE_DESCRIPTIONS as any)[roleKey]?.fa ?? 'مورخ هنری';
    const openingProse = `با تخصص «${roleFa}»، قدم به کوچهٔ حسینی می‌گذاری.\n\n${NODE_01_INITIAL_STATE.openingNarrative}`;
    output.narrative = openingProse;
    if (state.scene.recentBeats.length > 0) {
      state.scene.recentBeats[state.scene.recentBeats.length - 1].narrative = openingProse;
    }
  }

  // 5. Memory compilation (only for director-produced candidates)
  if (output.memoryCandidates && output.memoryCandidates.length > 0) {
    compileMemory(state, output.memoryCandidates);
    appendEvent(state.canonical.runId, 'memory.compiled', state.scene.turn, {
      count: output.memoryCandidates.length,
    });
  }

  return {
    narrative: output.narrative,
    source,
    interpretation: output.interpretation,
    validation,
    stateBefore,
    stateAfter: state,
    _debugInfo: debugInfo,
    _output: output,
  };
}

import type { ThreatClocks, ClockChange } from './types.js';

export function createInitialClocks(): ThreatClocks {
  return {
    evidenceRemoval: 0,
    factionPressure: 0,
    npcPanic: 0,
    policeAttention: 0,
    personalRisk: 0,
  };
}

export function clampClockValue(val: number): number {
  if (val < 0) return 0;
  if (val > 4) return 4;
  return Math.floor(val);
}

export function tickClock(
  currentClocks: ThreatClocks,
  clock: keyof ThreatClocks,
  delta: number,
  reason: string
): { updatedClocks: ThreatClocks; change?: ClockChange } {
  const from = currentClocks[clock] ?? 0;
  const to = clampClockValue(from + delta);

  const updatedClocks: ThreatClocks = {
    ...currentClocks,
    [clock]: to,
  };

  if (from === to) {
    return { updatedClocks };
  }

  return {
    updatedClocks,
    change: {
      clock,
      from,
      to,
      reason,
    },
  };
}

export function applyClockModifications(
  currentClocks: ThreatClocks,
  modifications: Array<{ clock: keyof ThreatClocks; delta: number; reason: string }>
): { updatedClocks: ThreatClocks; changes: ClockChange[] } {
  let state = { ...currentClocks };
  const changes: ClockChange[] = [];

  for (const mod of modifications) {
    const res = tickClock(state, mod.clock, mod.delta, mod.reason);
    state = res.updatedClocks;
    if (res.change) {
      changes.push(res.change);
    }
  }

  return { updatedClocks: state, changes };
}

export interface ClockThresholdEvaluation {
  isCritical: boolean;
  criticalClock?: keyof ThreatClocks;
  suggestedEndingId?: string;
  foreshadowHint?: string;
  echoId?: string;
}

export function evaluateClockThresholds(clocks: ThreatClocks): ClockThresholdEvaluation {
  if (clocks.evidenceRemoval >= 4) {
    return {
      isCritical: true,
      criticalClock: 'evidenceRemoval',
      suggestedEndingId: 'BAD_ENDING_ABANDONMENT_ARSON',
      foreshadowHint: 'رد پای مدارک پاک شده و سایهٔ دست‌اندرکاران روی پرونده افتاده است.',
      echoId: 'ECHO_AFTER_ABANDON',
    };
  }

  if (clocks.personalRisk >= 4) {
    return {
      isCritical: true,
      criticalClock: 'personalRisk',
      suggestedEndingId: 'BAD_ENDING_SYNDICATE_ABDUCTION',
      foreshadowHint: 'حرکت نسنجیده در تاریکی شب، حضور سنگین تعقیب‌کنندگان را به نقطهٔ بی‌بازگشت رساند.',
      echoId: 'ECHO_CHASE_ABDUCTION',
    };
  }

  if (clocks.npcPanic >= 4) {
    return {
      isCritical: true,
      criticalClock: 'npcPanic',
      suggestedEndingId: 'BAD_ENDING_INTERNAL_BETRAYAL',
      foreshadowHint: 'فروپاشی کامل اعتماد در سالن کافه باعث شد شواهد شبانه پنهان یا جابه‌جا شوند.',
      echoId: 'ECHO_FALSE_ACCUSATION',
    };
  }

  if (clocks.policeAttention >= 4) {
    return {
      isCritical: true,
      criticalClock: 'policeAttention',
      suggestedEndingId: 'BAD_ENDING_POLICE_SHUTDOWN',
      foreshadowHint: 'سر و صدا و خشونت بی‌موقع، پای پلیس را قبل از کشف حقیقت به کافه باز کرد.',
      echoId: 'ECHO_VIOLENCE_SHUTDOWN',
    };
  }

  return { isCritical: false };
}

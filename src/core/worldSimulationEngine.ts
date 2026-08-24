import type { RunState } from './types.js';

export interface WorldSimulationUpdate {
  npcInitiativeText?: string;
  causalConsequenceText?: string;
  triggerEndingId?: string;
}

/**
 * Simulates causal progression of the world when player stalls, wanders, or abandons the scene.
 * Replaces instant keyword-triggers with step-by-step causal world evolution.
 */
export function processWorldSimulationTurn(
  state: RunState,
  playerInput: string
): WorldSimulationUpdate {
  const norm = playerInput.trim().toLowerCase();
  const isLeaving = /ولش\s*کن|می‌?رم\s*خونه|میرم\s*بخوابم|ترک\s*می‌?کنم|خروج/.test(norm);

  // 1. Causal Abandonment Chain
  if (isLeaving) {
    state.clocks = state.clocks ?? {
      evidenceRemoval: 0,
      factionPressure: 0,
      npcPanic: 0,
      policeAttention: 0,
      personalRisk: 0,
    };
    state.clocks.evidenceRemoval += 2;
    state.clocks.factionPressure += 1;

    if (state.clocks.evidenceRemoval < 4) {
      return {
        causalConsequenceText: `چند قدم از درِ کافه پنتیمنتو دور می‌شوی و به سمت ابتدای کوچه حسینی قدم برمی‌داری. سرمای شب در هوا می‌پیچد.
گوشی‌ات می‌لرزد؛ پیامی اضطراری از سالار می‌رسد: «کجا رفتی؟ نور چراغ‌های یک خودروی تیره سر کوچه روشن شد... اگر نرسی تمام شواهد رو از بین می‌برن!»`,
      };
    } else {
      return {
        triggerEndingId: 'BAD_ENDING_ABANDONMENT_ARSON',
        causalConsequenceText: `بی‌توجه به هشدارها، کوچه حسینی را ترک می‌کنی.
دقایقی بعد، زوزهٔ باد با بوی غلیظ دود و صدای آژیر آتش‌نشانی در آسمان عظیمیه در هم می‌آمیزد. شبکهٔ پلاک ۵۵ ردپای خود را در آتش پاک کرد.`,
      };
    }
  }

  // 2. Goal-Driven NPC Initiatives on Idle/Stall
  const isStalling = /صبر|سکوت|منتظر|هیچ\s*کار|خیره|شمردن/.test(norm);
  if (isStalling) {
    state.scene.turn += 1;
    const currentNode = state.canonical.currentNode;

    if (currentNode === 'NODE_02') {
      return {
        npcInitiativeText: `حانیه تبلت را روی میز کناری می‌گذارد، به سمت فنجان رهاشده خم می‌شود و با نگرانی می‌گوید: «اگر کسی این قهوه رو نمی‌خواد، ببرمش پشت بار؟» در همین حال، پنتی از زیر مبل با احتیاط سرک می‌کشد.`,
      };
    } else if (currentNode === 'NODE_03') {
      return {
        npcInitiativeText: `مانی پارچه نم‌دار را روی پیشخوان می‌کشد و زیر لب به یاشین می‌گوید: «ساعت خروج پلاک ۵۵ رو تو سیستم اصلاح کردی؟ سالار عصبیه.» یاشین با اشارهٔ سر او را به سکوت دعوت می‌کند.`,
      };
    }
  }

  return {};
}

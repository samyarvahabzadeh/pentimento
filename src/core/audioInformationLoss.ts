import type { RunState, AudioLossState, AudioEncounterUtterance } from './types.js';

/**
 * Reusable Information Loss / Acoustic Masking Mechanic for Steam Wand encounters.
 * Does NOT invent canon case facts or hardcode enemy identities.
 */

// Test fixture strictly for verifying partial vs full hearing mechanics during automated tests
export const TEST_FIXTURE_UTTERANCE: AudioEncounterUtterance = {
  utteranceId: 'test_fixture_encounter_line',
  speakerId: 'test_speaker',
  fullText: 'برای سفارش قهوه فردا... باید لیست بسته‌های شیرینی رو هم چک کنیم... وقت تمومه.',
  maskedPortion: 'باید لیست بسته‌های شیرینی رو هم چک کنیم',
  heardFragmentStandard: 'برای سفارش قهوه فردا... [صدای تیز و کرکنندهٔ نازل بخار] ... وقت تمومه.',
  heardFragmentAdvantage: 'برای سفارش قهوه فردا... باید لیست بسته‌های شیرینی رو هم چک کنیم... وقت تمومه.',
};

export function processAudioInformationLoss(
  state: RunState,
  actionId?: string,
  playerInput: string = '',
  encounter?: AudioEncounterUtterance
): AudioLossState | undefined {
  if (state.canonical.currentNode !== 'NODE_04') {
    return undefined;
  }

  const activeEncounter = encounter ?? state.activeAudioEncounter;

  // Generic audio advantage resolution: Requires dedicated focus on listening
  const hasDedicatedFocus = /تمرکز صوتی|شنود دقیق|گوش.*تیز|با.*دقت.*گوش/.test(playerInput);
  const hasAudioAdvantage = hasDedicatedFocus || state.canonical.playerClass === 'coffee_alchemist';

  if (activeEncounter) {
    const isQuestioningLostLine = /چی گفتی|تکرار کن|دوباره بگو|جمله قبلی/.test(playerInput);

    if (isQuestioningLostLine && state.lastAudioLoss) {
      return {
        utteranceId: activeEncounter.utteranceId,
        speakerId: activeEncounter.speakerId,
        fullText: activeEncounter.fullText,
        audibleSegments: ['چیز مهمی نبود، حواست به بخار دستگاه باشه'],
        maskedSegments: [],
        audioConfidence: 'partial',
        heardFragment: '«چیز مهمی نبود، حواست به بخار داغ دستگاه باشه.»',
      };
    }

    const audioState: AudioLossState = {
      utteranceId: activeEncounter.utteranceId,
      speakerId: activeEncounter.speakerId,
      fullText: activeEncounter.fullText,
      audibleSegments: hasAudioAdvantage
        ? [activeEncounter.fullText]
        : activeEncounter.heardFragmentStandard.split('[صدای تیز و کرکنندهٔ نازل بخار]').map(s => s.trim()),
      maskedSegments: hasAudioAdvantage ? [] : [activeEncounter.maskedPortion],
      audioConfidence: hasAudioAdvantage ? 'full' : 'partial',
      heardFragment: hasAudioAdvantage
        ? activeEncounter.heardFragmentAdvantage
        : activeEncounter.heardFragmentStandard,
    };

    // Store the spoken truth in the actual speaker's memory if entity exists
    if (activeEncounter.speakerId && state.npcMemory[activeEncounter.speakerId]) {
      const alreadyStored = state.npcMemory[activeEncounter.speakerId].beliefs.some(b => b.summary.includes(activeEncounter.utteranceId));
      if (!alreadyStored) {
        state.npcMemory[activeEncounter.speakerId].beliefs.push({
          summary: `گوینده جمله «${activeEncounter.fullText}» را در میان صدای بخار بیان کرد [${activeEncounter.utteranceId}]`,
          confidence: 'high',
        });
      }
    }

    return audioState;
  }

  // Standard NODE 04 ambient exploration without active encounter dialogue
  return {
    speakerId: 'ambient_steam',
    fullText: 'صدای سوت ممتد نازل بخار',
    audibleSegments: ['صدای خروج بخار پرفشار'],
    maskedSegments: [],
    audioConfidence: hasAudioAdvantage ? 'full' : 'partial',
    heardFragment: hasAudioAdvantage
      ? 'صدای خروج بخار پرفشار از نازل استیل را با تفکیک واضح فرکانس‌ها می‌شنوی.'
      : 'صدای تیز و ممتد خروج بخار از نازل استیل، فضای صوتی اطراف دستگاه را پوشانده است.',
  };
}

import type { DirectorContext, TurnRankerPacket } from '../core/types.js';

export function buildSystemPrompt(): string {
  return `You are a strict, bounded Intent Ranker for the interactive mystery RPG Pentimento.
Your task is ONLY to select the single most accurate candidateId from the given candidates list based on the player's text.
Do NOT invent actions, objects, NPCs, clues, lore, or endings.
Return JSON only:
{
  "candidateId": "<one exact id from candidates>",
  "confidence": <float 0.0 to 1.0>,
  "speechAct": "<question|statement|threat|action|other>",
  "tone": "<neutral|suspicious|aggressive|curious|friendly>",
  "targetNpc": "<npcId or null>"
}`;
}

export function buildRankerUserPrompt(packet: TurnRankerPacket): string {
  return JSON.stringify(packet, null, 2);
}

export function buildUserPrompt(context: DirectorContext): string {
  return `════ وضعیت جاری صحنه (کافه پنتیمنتو، عظیمیه کرج) ════
نود: ${context.canonical.currentNode} | صحنه: ${context.scene.sceneId} | نوبت: ${context.scene.turn}
لنز تحلیلی بازیکن: ${context.canonical.playerClass ?? 'observer'}
ورودی فعلی بازیکن:
«${context.playerInput}»`;
}

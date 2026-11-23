/**
 * Living Dialogue Engine — Powers dynamic, in-character, living conversation for NPCs in Pentimento.
 * Uses structured context injection from the Character Bible and game state,
 * and parses structured JSON responses that update trust, tension, and memory.
 */
import type { RunState } from './types.js';
import type { LLMTransport, ChatMessage } from '../transport/llmTransport.js';
import { CHARACTER_BIBLE } from '../canon/characterBible.js';
import { INITIAL_NPC_GOAL_PROFILES } from './npcGoals.js';
import { LOCATION_REGISTRY } from './worldAffordances.js';

export interface LivingDialogueResult {
  dialogue: string;
  gesture?: string;
  narrative: string;
  trustDelta: number;
  pressureDelta: number;
  memoryTag?: string;
  revealedFactIds?: string[];
  provider?: string;
  model?: string;
}

const NPC_SECRET_BOUNDARIES: Record<string, string[]> = {
  yashin: [
    'یاشین می‌داند شات اسپرسوی ۰۰:۱۷ را مانی زده و خودش سر میز برده، اما از برادرش محافظت می‌کند.',
    'یاشین کاغذ افتاده روی سنگ‌فرش را دیده اما تا زمانی که اعتماد به ۲ نرسد، اعتراف نمی‌کند که کاغذ رسید خیس بوده.',
    'یاشین درباره قهوه فوق‌تخصص دارد اما ادعاهایش درباره تاریخ یا بردهای فیفا کری‌خوانی و اغراق است.',
    'هرگز به طور قطعی نمی‌گوید چه کسی پشت توطئه پلاک ۵۵ است چون خودش هم دقیق نمی‌داند.',
  ],
  mani: [
    'مانی بوی حلال شیمیایی روی فنجان را حس کرده و نگران است که تقصیر گردن او بیفتد.',
    'مانی به شدت به کافه آرتور ارومیه و یاد رفیق درگذشته‌اش (راتین) حساس و وفادار است.',
    'در برابر تهدید یا تحقیر واکنش تند و شوخ‌طبعی گزنده نشان می‌دهد.',
    'هرگز اجازه نمی‌دهد به یاشین آسیبی برسد و حاضر است خودش را سپر کند.',
  ],
  haniyeh: [
    'حانیه عکسی از مرد پالتوپوش با دستکش قرمز روی تبلت دارد اما سالار خواسته فعلاً پخش نکند.',
    'حانیه به شدت نگران بچه گربه (پنتی) است و اگر بحث خشونت یا درگیری شود اصرار به ترک کافه می‌کند.',
    'گوش حساسی برای صداها و ویس‌های ضبط‌شده دارد و صدای غیرطبیعی را سریع متوجه می‌شود.',
  ],
  salar: [
    'سالار زیر بار بدهی و چک‌های سنگین است و تماس خریدار پلاک ۵۵ او را در تنگنا گذاشته.',
    'سعی می‌کند اضطرابش را مخفی کند و مدیریت صحنه را از دست ندهد.',
    'اگر بازیکن دوست قدیمی‌اش باشد با او درد دل می‌کند، اما اگر احساس پلیس‌بازی کند محتاط می‌شود.',
  ],
  collector: [
    'نماینده خریدار سرد، محاسبه‌گر و پشت خط است؛ با پول خرد یا تهدید توخالی تکان نمی‌خورد.',
    'هدفش پس گرفتن تابلوی پنتیمنتو قبل از طلوع آفتاب است.',
  ],
  exiting_man: [
    'مرد پالتوپوش با دستکش قرمز؛ کم‌حرف، هوشیار و آماده فرار یا گزارش دادن به شبکه پلاک ۵۵.',
  ],
};

export async function generateLivingDialogue(
  npcId: string,
  playerInput: string,
  state: RunState,
  transport?: LLMTransport
): Promise<LivingDialogueResult | null> {
  if (!transport || typeof transport.generateChat !== 'function') {
    return null;
  }

  const profile = state.npcGoalProfiles?.[npcId] ?? INITIAL_NPC_GOAL_PROFILES[npcId];
  const bible = CHARACTER_BIBLE[npcId];
  const npcNameFa = profile?.nameFa ?? bible?.formalName ?? npcId;

  const currentSceneId = state.canonical.currentScene || state.scene.sceneId;
  const currentSceneNameFa = (LOCATION_REGISTRY as any)[currentSceneId]?.nameFa ?? 'کافه پنتیمنتو';

  const presentCharacters = (state.scene.activeEntityIds ?? [])
    .map(id => INITIAL_NPC_GOAL_PROFILES[id]?.nameFa ?? id)
    .join('، ');

  const currentTrust = state.npcTrust?.[npcId] ?? 0;
  const currentPressure = state.npcPressure?.[npcId] ?? 0;
  const playerRole = state.canonical.playerClass ?? 'observer';

  const historyKey = npcId;
  if (!state.environmentState) state.environmentState = {};
  if (!state.environmentState.livingDialogueHistory) state.environmentState.livingDialogueHistory = {};
  const recentHistory = state.environmentState.livingDialogueHistory[historyKey] ?? [];

  const secretBoundaries = NPC_SECRET_BOUNDARIES[npcId] ?? [
    'اطلاعات پنهان را تا زمان اثبات اعتماد لو نده.',
  ];

  const systemPrompt = `شما در نقش شخصیت «${npcNameFa}» در بازی نقش‌آفرینی کارآگاهی نوآر «پنتیمنتو» (در کافه پنتیمنتو، عظیمیه کرج) بازی می‌کنید.
شخصیت و روان‌شناسی شما:
- کهن‌الگو و رفتار: ${bible?.coreArchetype ?? profile?.goals?.join('، ') ?? 'حاضر در کافه'}
- ضعف اجتماعی: ${bible?.socialWeakness ?? 'محتاط در پاسخگویی'}
- لحن گفتار: کاملاً طبیعی، زنده، باورپذیر و متناسب با فرهنگ و محاوره معاصر فارسی.
${npcId === 'yashin' ? '- ویژگی‌های کلامی یاشین: معمولاً با «درود بر شما» شروع می‌کند، در اصلاح اشتباهات از «خیر.» استفاده می‌کند، در قهوه بی‌نقص و دقیق است، اما در فیفا لاف قهرمانی می‌زند!' : ''}
${npcId === 'mani' ? '- ویژگی‌های کلامی مانی: لوتی، صمیمی، اهل شوخی، والیبالیست، به شدت وفادار به خاطرات کافه آرتور ارومیه و برادرش یاشین.' : ''}
${npcId === 'haniyeh' ? '- ویژگی‌های کلامی حانیه: گرم، اهل دوبلاژ، مراقب بچه‌گربه (پنتی)، ترسو در برابر خشونت و مخالف به خطر افتادن جان رفقا.' : ''}
${npcId === 'salar' ? '- ویژگی‌های کلامی سالار: مردانه، کاریزماتیک، زیر فشار چک و بدهی، درون‌دار و در تلاش برای حفظ آرامش.' : ''}

خطوط قرمز و رازهای حفاظت‌شده:
${secretBoundaries.map(s => `- ${s}`).join('\n')}

شرایط فعلی:
- مکان: ${currentSceneNameFa}
- افراد حاضر: ${presentCharacters || 'تنها'}
- نقش مخاطب (بازیکن): ${playerRole}
- تراز اعتماد به بازیکن: ${currentTrust}
- تراز فشار/سوءظن: ${currentPressure}

دستورالعمل تولید پاسخ:
پاسخ باید موجز و زنده (حداکثر ۱ یا ۲ جمله کوتاه) باشد تا ریتم بازی حفظ شود.
پاسخ را الزاماً و صرفاً به صورت یک آبجکت JSON معتبر به فرمت زیر برگردانید (بدون هیچ توضیح اضافی خارج از JSON):
{
  "dialogue": "جمله دقیق کاراکتر به زبان فارسی محاوره‌ای و غنی",
  "action_gesture": "یک کنش فیزیکی کوتاه و زبان بدن متناسب (مثلاً: دستمال را روی بار می‌کشد و به چشمانت نگاه می‌کند)",
  "trust_delta": 0, // عدد صحیح بین -1 و +1 (اگر بازیکن همدلی کرد یا سوال هوشمندانه پرسید +1، اگر توهین یا تهدید کرد -1، در غیر این صورت 0)
  "pressure_delta": 0, // 0 یا 1 (اگر تحت فشار یا تهدید یا بازجویی قرار گرفت 1، در غیر این صورت 0)
  "memory_tag": "یک جمله کوتاه از درک درونی کاراکتر درباره این تبادل"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add recent history if available
  for (const item of recentHistory.slice(-3)) {
    messages.push({ role: 'user', content: item.player });
    messages.push({ role: 'assistant', content: item.character });
  }

  messages.push({
    role: 'user',
    content: playerInput,
  });

  try {
    const response = await transport.generateChat(messages, {
      responseFormatJson: true,
      maxTokens: 250,
      temperature: 0.75,
    });

    const parsed = parseLivingDialogueJson(response.rawText, npcNameFa);
    if (!parsed) return null;

    // Apply state mutations
    if (parsed.trust_delta !== 0) {
      state.npcTrust = state.npcTrust ?? {};
      state.npcTrust[npcId] = (state.npcTrust[npcId] ?? 0) + parsed.trust_delta;
    }

    if (parsed.pressure_delta > 0) {
      state.npcPressure = state.npcPressure ?? {};
      state.npcPressure[npcId] = (state.npcPressure[npcId] ?? 0) + parsed.pressure_delta;
    }

    // Record history
    recentHistory.push({
      player: playerInput,
      character: parsed.dialogue,
      memory: parsed.memory_tag,
    });
    state.environmentState.livingDialogueHistory[historyKey] = recentHistory.slice(-8);

    const narrative = parsed.action_gesture
      ? `${npcNameFa} ${parsed.action_gesture}:\n«${parsed.dialogue}»`
      : `${npcNameFa} می‌گوید:\n«${parsed.dialogue}»`;

    return {
      dialogue: parsed.dialogue,
      gesture: parsed.action_gesture,
      narrative,
      trustDelta: parsed.trust_delta ?? 0,
      pressureDelta: parsed.pressure_delta ?? 0,
      memoryTag: parsed.memory_tag,
      provider: response.provider,
      model: response.model,
    };
  } catch (err: any) {
    console.warn(`[LivingDialogue] Failed for ${npcId}: ${err.message}`);
    return null;
  }
}

function parseLivingDialogueJson(raw: string, npcName: string): {
  dialogue: string;
  action_gesture?: string;
  trust_delta: number;
  pressure_delta: number;
  memory_tag?: string;
} | null {
  try {
    let clean = raw.trim();
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      clean = jsonMatch[1].trim();
    }

    // Auto-repair if truncated
    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      let repaired = clean;
      if (!repaired.endsWith('}')) {
        if (!repaired.endsWith('"')) repaired += '"';
        repaired += '}';
      }
      try {
        parsed = JSON.parse(repaired);
      } catch {}
    }

    if (parsed && typeof parsed.dialogue === 'string' && parsed.dialogue.trim().length > 0) {
      return {
        dialogue: parsed.dialogue.trim(),
        action_gesture: typeof parsed.action_gesture === 'string' ? parsed.action_gesture.trim() : undefined,
        trust_delta: typeof parsed.trust_delta === 'number' ? Math.max(-1, Math.min(1, parsed.trust_delta)) : 0,
        pressure_delta: typeof parsed.pressure_delta === 'number' ? Math.max(0, Math.min(1, parsed.pressure_delta)) : 0,
        memory_tag: typeof parsed.memory_tag === 'string' ? parsed.memory_tag.trim() : undefined,
      };
    }
  } catch (e) {}

  // Fallback 1: Extract dialogue field even if unclosed
  const dialogueMatch = raw.match(/["']dialogue["']\s*:\s*["']([^"'\r\n]+)/);
  if (dialogueMatch) {
    const dialogue = dialogueMatch[1].replace(/["},]+$/, '').trim();
    const gestureMatch = raw.match(/["']action_gesture["']\s*:\s*["']([^"'\r\n]+)/);
    return {
      dialogue,
      action_gesture: gestureMatch ? gestureMatch[1].replace(/["},]+$/, '').trim() : undefined,
      trust_delta: 0,
      pressure_delta: 0,
    };
  }

  // Fallback 2: Raw conversational text
  if (raw.length > 5 && !raw.startsWith('{')) {
    return {
      dialogue: raw.replace(/["{}]+/g, '').trim(),
      trust_delta: 0,
      pressure_delta: 0,
    };
  }

  return null;
}

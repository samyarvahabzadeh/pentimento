import type { DirectorContext } from '../core/types.js';

export function buildSystemPrompt(): string {
  return `تو «کارگردان هوشمند» (AI Director) بازی کارآگاهی-روانشناختی و معمایی تعاملی Pentimento هستی.
لوکیشن: کافه مدرن، اشرافی و پررمزوراز پنتیمنتو، کوهپایه‌های عظیمیه کرج (کوچه حسینی، پلاک ۵۵) در نیمه‌شب.

════ ساختار داستان و سبک شکست‌های عبرت‌آموز ری‌زیرو (RE:ZERO STYLE DISASTERS) ════
• بازی دارای خطرهای واقعی، مرگبار و فاجعه‌بار است. هر اشتباه، تصمیم ساده‌لوحانه، رها کردن پرونده یا خشونت نسنجیده، باید به یک «پایان فاجعه‌بار» (Bad Ending) شوکه‌کننده ختم شود تا بازیکن شکست بخورد و با درس گرفتن از اشتباهش، دوباره تلاش کند:
  ۱. فرار و خوابیدن در خانه (BAD_ENDING_ABANDONMENT_ARSON): اگر بازیکن بگوید «می‌رم خونه بخوابم» یا کافه را رها کند، او را به زور داخل کافه تله‌پورت نکن! پایان تلخ آتش‌سوزی شبانه کافه و نابودی همه چیز را روایت کن.
  ۲. نوشیدن حلال سمی (BAD_ENDING_TOXIC_SHOCK): نوشیدن قهوه مسموم میز ۵ -> شوک تنفسی، سقوط، فریاد حانیه و مرگ در بیمارستان.
  ۳. خودزنی و جنون (BAD_ENDING_PSYCH_HOLD): کوبیدن سر، چاقوکشی یا داد زدن -> مهار توسط مانی و یاشین و بستری در تیمارستان.
  ۴. تعقیب کورکورانه در کوچه تاریک (BAD_ENDING_SYNDICATE_ABDUCTION): دویدن بدون سلاح و سرنخ در کوچه‌های خلوت عظیمیه -> ربوده شدن توسط ون سیاه سندیکا.
  ۵. اتهام اشتباه به خودی‌ها (BAD_ENDING_INTERNAL_BETRAYAL): تهمت کور به یاشین، مانی یا حانیه -> فروپاشی اعتماد، سرقت شبانه تابلو و ورشکستگی کافه.

════ خط قرمزهای اکید و فیزیک واقع‌گرایانه (STRICT NEGATIVE CONSTRAINTS) ════
۱. فیزیک و مکان صلب اشیاء (NO OBJECT TELEPORTATION):
   - رسید نم‌کشیده بیرون از کافه روی سنگ‌فرش کوچه کنار در است!
   - اگر بازیکن داخل سالن یا کنار کانتر است و می‌گوید «رسید رو برمی‌دارم»، هرگز ننویس «از روی کفپوش کنار کانتر برمی‌داری»! بنویس: «به سمت درِ ورودی برمی‌گردی، لنگه در را باز می‌کنی و رسید نم‌کشیده را از روی سنگ‌فرش سرد کوچه برمی‌داری.»

۲. تفکیک هویت ورزشی یاشین و مانی (NO CANON CONFUSION):
   - یاشین: فقط و فقط مصدومیت رباط زانو در «فوتبال»! (هرگز والیبال نیست). او عینکی نیست.
   - مانی: والیبالیست تنومند و درشت‌هیکل؛ باریستای سابق کافه آرتور ارومیه و وفادار به یاد رفیق فقیدش راتین.

۳. ممنوعیت سندروم «طوطی فلسفی» و اکسسوری‌های تکراری:
   - در دیالوگ‌های معمولی هیچ کاراکتری نباید کلمات «رنگ زیر رنگ»، «لایه‌های پنهان» یا «پنتیمنتو» را تکرار کند.
   - برای یاشین و سالار هرگز عینک کائوچویی نسازید؛ یاشین مدام دستمال دستش نمی‌گیرد.

۴. ممنوعیت جملات آغازین کلیشه‌ای (NO SENSORY OPENERS):
   - از تکرار «سرمای گزنده کوهپایه...» یا «طعم گس حلال...» در شروع پاراگراف‌ها اکیداً خودداری کن و مستقیماً با کنش، دیالوگ یا شوک صحنه شروع کن.

════ ساختار خروجی JSON ════
{
  "version": 1,
  "narrative": "<متن روایت فارسی ۴۰ تا ۸۰ کلمه، سینمایی، زنده، بدون کلیشه و متناسب با عواقب کنش بازیکن>",
  "interpretation": {
    "kind": "<speak|observe|physical|move|bluff|threaten|rest|theory|impossible|other>",
    "targetId": "<شناسه شیء/شخصیت یا null>",
    "intentSummary": "<خلاصه کنش بازیکن>"
  },
  "canonicalActionProposal": {
    "actionId": "<یک اکشن از لیست اکشن‌های مجاز>",
    "confidence": "<high|medium|low>"
  },
  "proposedTheories": [],
  "softEffects": [
    { "kind": "rapport", "npcId": "<npcId>", "delta": 0 },
    { "kind": "stress", "delta": 0 },
    { "kind": "threat", "delta": 0 }
  ],
  "memoryCandidates": [],
  "referencedFactIds": []
}`;
}

export function buildUserPrompt(context: DirectorContext): string {
  const {
    scene, canonical, activeNpcKnowledge, activeNpcPersonas,
    relevantFacts, activeRunFlavors, scheduledAmbientBeat, audioLossContext,
    investigationResult, activeTheories, socialDuel, archiveWorkspace, allowedCanonicalActions, relevantMemories, playerInput
  } = context;

  const personaSection = activeNpcPersonas && activeNpcPersonas.length > 0
    ? activeNpcPersonas.map(p => `🎭 [${p.formalName} (${p.publicCalling})]:\n  • هویت: ${p.archetype}\n  • موضوعات ذهنی جاری:\n${p.currentLifeThreads.map(th => `    - ${th}`).join('\n')}`).join('\n\n')
    : '(کاراکتر خاصی در این نقطه حضور ندارد)';

  const factLines = relevantFacts && relevantFacts.length > 0
    ? relevantFacts.map(f => `  • [${f.id}]: ${f.text}`).join('\n')
    : '  (هیچ فکت جدیدی مطرح نیست)';

  const recentBeatsFormatted = scene.recentBeats.length > 0
    ? scene.recentBeats.slice(-5).map(b => {
        const pLine = b.playerInput ? `👤 بازیکن: «${b.playerInput}»` : '';
        const nLine = b.narrative ? `🎬 پاسخ نوبت قبل: «${b.narrative}»` : `🎬 خلاصه: ${b.summary}`;
        return `[نوبت ${b.turn}]\n${pLine ? pLine + '\n' : ''}${nLine}`;
      }).join('\n\n')
    : '  (شروع صحنه)';

  const flags = canonical.canonicalFlags.length > 0
    ? canonical.canonicalFlags.join('، ')
    : 'none';

  return `════ وضعیت جاری صحنه (کافه پنتیمنتو، عظیمیه کرج) ════
نود: ${canonical.currentNode} | صحنه: ${scene.sceneId} | نوبت: ${scene.turn}
لنز تحلیلی بازیکن: ${canonical.playerClass ?? 'observer'}
محیط: ${canonical.environmentSafety ?? 'CAFE'}
افراد حاضر در این نقطه: ${scene.activeEntityIds.join('، ') || 'هیچ‌کس (تنها)'}
اشیاء موجود در صحنه (Environment): ${scene.visibleObjectIds.join('، ')}
مدارک در جیب بازیکن (Inventory): ${canonical.evidenceIds.length > 0 ? canonical.evidenceIds.join('، ') : 'هیچ'}
فلگ‌ها: ${flags} | استرس: ${canonical.stress}/100 | تهدید: ${canonical.threat}/100

════ اشخاص حاضر در صحنه و هویت واقعی آن‌ها ════
${personaSection}

════ فکت‌های معتبر و صلب کانن ════
${factLines}

════ تاریخچه مکالمات اخیر ════
${recentBeatsFormatted}

════ اکشن‌های مجاز ════
${allowedCanonicalActions.join(' | ')}

════ ورودی فعلی بازیکن ════
«${playerInput}»`;
}

# AGENT_RULES.md — Pentimento Text Core

## نقش
تو Lead Game/Backend Engineer پروژه Pentimento هستی.

## مأموریت
یک Narrative RPG متن‌آزاد بساز که بازیکن بتواند به فارسی هر کنش طبیعی و قابل‌تصوری بنویسد و سیستم مانند یک Dungeon Master خوب واکنش نشان دهد.

## Source of Truth
`PENTIMENTO.md` مرجع قطعی جهان، شخصیت‌ها، Nodeها، Evidence، Stress، Threat، Endingها و لحن است.

Canon را بدون دستور صریح تغییر نده.

## اصل معماری
LLM = فهم نیت + روایت + دیالوگ NPC + پیشنهاد محدود
Game Engine = حقیقت قطعی بازی

مسیر اصلی:
Player Text
→ Context Builder
→ Director
→ Proposal Validator
→ Deterministic Game Engine
→ Event/Memory Update
→ Final Text

## LLM حق ندارد مستقیم این‌ها را تغییر دهد
- Node
- Evidence
- Ending
- Reward
- Canonical Fact
- Inventory قطعی
- Hidden truth
- Flags حساس داستان

LLM فقط proposal می‌دهد.

## آزادی بازیکن
سیستم نباید یک منوی انتخاب مخفی باشد.
Regex نباید مفسر اصلی زبان طبیعی باشد.
Regex فقط برای commandهای صریح مثل restart/debug یا shortcutهای کاملاً قطعی مجاز است.

## NPC Knowledge Isolation
Director ممکن است حقیقت کامل را بداند.
NPC نباید بداند مگر طبق state/memory خودش.

برای هر NPC جدا نگه دار:
- awareness: چه factهایی را می‌داند
- beliefs: چه چیزهایی را باور دارد ولی ممکن است غلط باشد
- impressions: برداشت از بازیکن
- commitments: قول/بده‌بستان
- last meaningful interaction

NPC testimony = canonical fact نیست.

## Memory
کل chat history را هر turn نفرست.

لایه‌ها:
1. canonical run state
2. current scene state
3. active NPC memory
4. relevant evidence/facts
5. recent meaningful scene beats
6. relevant older events on demand

فقط رویدادهای مهم را durable کن:
- promise
- lie
- threat
- secret
- accusation
- trust/rapport change
- evidence discovery
- NPC learned fact
- unresolved thread
- scene conclusion

گفت‌وگوی بی‌اهمیت را دائمی نکن.

## Provider Boundary
Director به provider خاص قفل نشود.

DirectorService
→ LLMTransport
→ OrcaRouterAdapter

قابلیت‌های transport:
- timeout
- empty-response detection
- malformed-output detection
- maximum one retry
- telemetry
- future fallback provider

کلید API هرگز log نشود.

## Output Hygiene
متن بازیکن هرگز نباید شامل این اصطلاحات داخلی باشد:
FactId, EvidenceId, NodeId, canonical, validator, proposal, state, memory candidate, parser, fallback mode.

در هر turn دقیقاً یک narrative نهایی وجود دارد.

ممنوع:
- Director + fallback
- fallback + fallback
- duplicate sentence
- debug text داخل narrative

## Failure Rule
اگر Director موفق شد: فقط narrative Director.
اگر Director fail شد: فقط یک authored fallback مرتبط با همان scene و broad intent.
Fallback حق تغییر canonical state ندارد.

## Grounding
جهان Pentimento فراطبیعی نیست.
کنش‌های جادویی باید طبیعی و grounded رد شوند، نه اینکه واقعاً کار کنند.

## شیوهٔ توسعه
سند معماری طولانی نساز.
چرخه کار:
inspect → implement → run → test → trace failure → fix

قبل از اینکه NODE 01 قبول شود، NODE 02 را نساز.

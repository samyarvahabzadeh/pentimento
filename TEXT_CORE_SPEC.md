# TEXT_CORE_SPEC.md

## Scope
نسخهٔ اول فقط CLI/Text Harness است.
UI، Telegram و Browser در این milestone وجود ندارند.

فرمان هدف:
`npm run game:text`

نمونه تجربه:

PENTIMENTO
عظیمیه، کرج — ۰۰:۱۷

مردی از کافه بیرون می‌آید. در را برایت نگه می‌دارد.
«هنوز بازه.»

> اسمت چیه؟

[پاسخ طبیعی و مستقیم]

>

---

# 1. Runtime Flow

هر turn:

1. دریافت raw player text
2. Load RunState
3. Build minimal relevant context
4. Call Director
5. Parse Director result
6. Validate proposals
7. Apply accepted canonical/soft effects through engine
8. Compile important memory/event
9. Persist state
10. Render exactly one player-facing narrative

---

# 2. First Milestone: NODE 01 Only

وضعیت آغازین:
- لوکیشن: سردر پنتیمنتو
- مردی از کافه خارج می‌شود
- در را برای بازیکن نگه می‌دارد
- می‌گوید: «هنوز بازه.»
- بازیکن هیچ سؤالی نکرده بود

از canon فقط اطلاعاتی را استفاده کن که در PENTIMENTO.md وجود دارد.

مرد ناشناس نباید اسم، سابقه یا affiliation قطعی جدید بگیرد مگر canon آن را تعریف کرده باشد.

بازیکن می‌تواند:
- سؤال کند
- نگاه کند
- وارد شود
- دنبالش کند
- بی‌تفاوت باشد
- بلوف بزند
- تهدید کند
- هل بدهد/مشت بزند
- عکس بگیرد
- کار عجیب ولی ممکن انجام دهد
- تلاش غیرممکن/فراطبیعی کند

هر حرکت لزوماً plot را جلو نمی‌برد.

---

# 3. Context Builder

برای NODE 01 فقط این packet ساخته شود:

- world constraints مرتبط
- scene id / node id
- current canonical meters
- present entities/NPCs
- visible objects
- player-known canonical facts
- NPC-specific awareness اگر NPC پاسخ می‌دهد
- allowed canonical actions
- recent 6–10 meaningful beats
- relevant durable memories
- current raw player input

ارسال نشود:
- کل PENTIMENTO.md
- کل transcript
- اطلاعات hidden غیرلازم
- memory NPCهای غایب
- Ending conditions غیرمرتبط

---

# 4. Director Responsibilities

Director باید خروجی‌ای تولید کند که شامل این مفاهیم باشد:

- interpretation.kind
- target
- intent summary
- narrative
- optional canonicalActionId proposal
- soft effect proposals
- memory candidates
- referenced fact IDs

Director حق ندارد Evidence/Node/Ending را مستقیم set کند.

### intent kinds
حداقل:
- speak
- observe
- physical
- move
- bluff
- threaten
- rest
- theory
- impossible
- other

---

# 5. Canonical Actions NODE 01

حداقل actionهای قطعی اولیه:

- ENTER_CAFE
- OBSERVE_EXITING_MAN
- OBSERVE_ENTRANCE
- FOLLOW_EXITING_MAN
- IGNORE_AND_WAIT

اگر طراحی فعلی PENTIMENTO.md action قطعی دیگری را لازم می‌داند اضافه کن.

Director فقط actionId پیشنهاد می‌دهد.
Validator legality را بررسی می‌کند.
Engine transition را انجام می‌دهد.

مثال:
«بی‌خیالش می‌شم و می‌رم داخل.»
→ proposed action: ENTER_CAFE
→ validator accepts
→ engine changes canonical node/scene

---

# 6. Non-Canonical / Soft Turns

«اسمت چیه؟»

اگر نام canonical نداریم:
- اسم جعلی به‌عنوان حقیقت نساز.
- مرد می‌تواند طفره برود، سؤال را برگرداند، جواب ندهد یا واکنش متناسب بدهد.

«با مشت می‌زنمش»
- intent = physical/aggressive
- target = exiting man
- روایت باید مستقیم به تلاش برای ضربه واکنش نشان دهد
- ممکن است soft effect محدود proposal شود
- evidence یا node مجانی ایجاد نشود

«دستم رو می‌کنم تو جیبم»
- مدل باید ambiguity را در صحنه مدیریت کند
- لازم نیست حتماً progression رخ دهد
- واکنش محیط/NPC باید به حرکت مربوط باشد

«ذهنش رو می‌خونم»
- intent = impossible
- جهان grounded باقی بماند
- هیچ اطلاعات hidden آشکار نشود

---

# 7. Soft Effects

در V1 محدود نگه دار.

نمونه:
- rapport delta: -2..+2
- stress delta: -2..+2
- threat delta: -2..+2

فقط اگر policy/scene اجازه دهد.
Validator clamp و presence check انجام دهد.

Soft effect هرگز shortcut برای Evidence/Node progression نیست.

---

# 8. Event Ledger

Append-only.

حداقل:
- turn.received
- director.completed
- director.failed
- proposal.accepted
- proposal.rejected
- canonical.transition
- memory.compiled

برای debug هر turn بتوان pipeline را trace کرد.

---

# 9. Memory V1

بدون vector DB.

SceneBeat:
- summary
- actors
- topics
- turn
- importance

NpcMemory:
- awareness fact IDs
- impressions
- commitments
- lastInteraction
- optional rapport

MemoryCompiler فقط validated/observed event را می‌گیرد.
مدل نمی‌تواند memory را به canonical fact تبدیل کند.

---

# 10. Director Prompt Rules

Director prompt باید:
- لحن noir/realistic را حفظ کند
- کوتاه و reactive باشد
- عمل بازیکن را تکرار نکند مگر لازم
- توضیح سیستمی ندهد
- mystery را بی‌جهت reveal نکند
- NPC را با knowledge خودش محدود کند
- اگر action مبهم است، بهترین تفسیر grounded را انتخاب کند؛ لازم نیست هر بار clarification بخواهد

هدف narrative معمولاً 40–120 واژه فارسی است.
کیفیت مهم‌تر از طول است.

---

# 11. Dev Debug Mode

CLI flag یا env:
`PENTIMENTO_DEBUG=1`

بعد از narrative، جدا از متن بازیکن، debug نشان بده:
- source: director/fallback/deterministic
- provider/model
- latency
- interpretation kind
- target
- proposed action
- validator result
- accepted effects
- rejected effects
- state diff
- memory writes

این block در production narrative وارد نشود.

---

# 12. Provider

Primary:
OrcaRouter OpenAI-compatible API

Config:
- ORCAROUTER_API_KEY
- ORCAROUTER_BASE_URL=https://api.orcarouter.ai/v1
- ORCAROUTER_MODEL=<configured model>

قبل از integration، direct probe واقعی بزن.
HTTP 200 به‌تنهایی موفقیت نیست.
موفقیت یعنی:
- non-empty content
- parse success
- valid Director contract
- usable final narrative

یک retry حداکثر.
اگر باز هم fail شد: authored fallback.

---

# 13. No-Go Items

در این milestone نساز:
- React
- Telegram
- CSS
- WebSocket
- streaming UI
- reward
- account system
- vector DB
- Mem0
- Graphiti
- LangChain
- AutoGen
- multi-agent orchestration
- generalized 18-node campaign engine beyond what NODE 01 needs

---

# 14. Definition of Done

NODE 01 باید:
- حداقل 30 free-text input متفاوت را بگذراند
- حداقل یک transcript واقعی 15-turn coherent داشته باشد
- intentهای متفاوت پاسخ متفاوت بگیرند
- internal terminology leak نکند
- duplicate narrative نداشته باشد
- hallucinated canonical fact نداشته باشد
- impossible action grounded باشد
- aggressive action aggression فهمیده شود
- continuity چند turn حفظ شود
- state فقط از validator/engine تغییر کند
- real OrcaRouter call تست شده باشد

تا این معیارها پاس نشده‌اند NODE 02 ممنوع.

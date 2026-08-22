import type {
  RunState,
  EndingId,
  EndingEvaluationResult,
  PreservationProfile,
  PlayerClassId,
} from './types.js';
import { CANONICAL_TIMELINE_CONSTRAINTS } from '../canon/node17.js';
import { validateTimeline } from './timelineEngine.js';

/**
 * Deterministically calculates the multi-dimensional Preservation Profile.
 * Tracks 4 independent behavioral axes.
 */
export function calculatePreservationProfile(state: RunState): PreservationProfile {
  const flags = state.canonical.canonicalFlags;
  const ev = state.canonical.evidenceIds;
  const facts = state.scene.establishedFactIds;
  const stress = state.canonical.stress;
  const threat = state.canonical.threat;

  // 1. People Preservation (0 - 100)
  let people = 50;
  if (facts.includes('observed_penti_avoidance') || ev.includes('penti_avoids_new_object')) people += 10;
  if (facts.includes('talked_to_haniyeh')) people += 10;
  const maniRapport = state.npcMemory.mani?.rapport ?? 0;
  const yashinRapport = state.npcMemory.yashin?.rapport ?? 0;
  people += Math.max(-20, Math.min(20, (maniRapport + yashinRapport) * 5));
  if (flags.includes('withdrew_from_collector_meeting') || flags.includes('protected_group')) people += 15;
  if (flags.includes('attempted_damage_to_art')) people -= 15;
  if (threat >= 60 && !flags.includes('arian_g_intervention_eligible')) people -= 15;
  people = Math.max(0, Math.min(100, people));

  // 2. Truth Preservation (0 - 100)
  let truth = 30;
  if (flags.includes('rejected_financial_offer')) truth += 25;
  if (flags.includes('timeline_synthesis_finalized')) truth += 25;
  if (facts.includes('analyzed_invoice_forgery') || ev.includes('invoice_is_forged')) truth += 15;
  if (facts.includes('footage_was_never_written') || ev.includes('footage_was_never_written')) truth += 15;
  if (flags.includes('retracted_false_theory')) truth += 15;
  if (flags.includes('accepted_financial_offer')) truth -= 40;
  truth = Math.max(0, Math.min(100, truth));

  // 3. Reputation Preservation (0 - 100)
  let reputation = 50;
  if (facts.includes('asked_salar_about_invoice')) reputation += 15;
  if (facts.includes('asked_mehri_about_cameras')) reputation += 15;
  if (flags.includes('leaked_evidence_publicly')) reputation -= 45;
  if (flags.includes('accused_witness_of_lying') && !facts.includes('fact_route_testimony_conflict')) reputation -= 25;
  reputation = Math.max(0, Math.min(100, reputation));

  // 4. Financial Preservation (0 - 100)
  let financial = 25;
  if (flags.includes('accepted_financial_offer')) financial += 50;
  if (facts.includes('examined_office_ledger')) financial += 20;
  if (facts.includes('examined_pos_orders')) financial += 10;
  if (stress >= 70 && !flags.includes('rejected_financial_offer')) financial += 15;
  financial = Math.max(0, Math.min(100, financial));

  return {
    peoplePreservation: people,
    truthPreservation: truth,
    reputationPreservation: reputation,
    financialPreservation: financial,
  };
}

/**
 * Calculates raw Truth Discovery Score (0 - 100).
 * Finding clues, facts, and physical items.
 */
export function calculateTruthDiscovery(state: RunState): number {
  const ev = state.canonical.evidenceIds;
  const facts = state.scene.establishedFactIds;
  const flags = state.canonical.canonicalFlags;

  let score = 0;

  // 1. Raw Clues & Physical Evidence (max 40 pts)
  const coreEvidence = [
    'invoice_is_forged',
    'seven_minute_camera_gap',
    'footage_was_never_written',
    'old_ownership_label',
    'label_numbers_14_3_7_55',
    'unusually_clean_box',
    'object_has_different_cleaner_smell',
    'red_stain_saucer',
    'red_glove_object',
  ];
  let evidenceCount = 0;
  for (const item of coreEvidence) {
    if (ev.includes(item) || facts.includes(item)) evidenceCount++;
  }
  score += Math.min(40, evidenceCount * 5);

  // 2. The Four Ending Seeds (max 60 pts = 15 each)
  // HAND: Exiting man hands notable
  if (facts.includes('fact_exiting_man_hands_notable') || facts.includes('observed_exiting_man')) score += 15;
  // CUP: Espresso cup placement on table 5
  if (facts.includes('fact_espresso_cup_placement') || facts.includes('examined_espresso_cup')) score += 15;
  // WINDOW: Painting window reflection
  if (facts.includes('fact_painting_window_reflection') || facts.includes('underpaint_line_visible')) score += 15;
  // SHADOW: Finalized timeline / shadow seed confirmable
  if (flags.includes('shadow_seed_confirmable') || flags.includes('timeline_synthesis_finalized')) score += 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates Truth Interpretation Score (0 - 100).
 * Understanding causal order, meaning of 55, and discarding false theories.
 */
export function calculateTruthInterpretation(state: RunState): number {
  let score = 0;

  // 1. Timeline Consistency in Archive Workspace (max 35 pts)
  if (state.archiveWorkspace && state.archiveWorkspace.timelineClaims.length > 0) {
    const res = validateTimeline(state.archiveWorkspace.timelineClaims, CANONICAL_TIMELINE_CONSTRAINTS);
    if (res.isConsistent && !res.hasCycle) {
      score += 35;
    } else if (res.contradictedRelations.length === 0) {
      score += 15;
    }
  }

  // 2. Retracted / Cleaned Theories (max 25 pts)
  if (state.theories) {
    const theories = Object.values(state.theories);
    const retracted = theories.filter(t => t.status === 'ABANDONED' || t.status === 'REFUTED');
    const openContradictory = theories.filter(t => t.status === 'OPEN' && (t.id.includes('gang') || t.id.includes('mafia')));
    score += Math.min(25, retracted.length * 10);
    if (openContradictory.length > 0) score -= 15;
  } else {
    score += 15; // Clean initial baseline
  }

  // 3. Contradiction Resolution (max 20 pts)
  const facts = state.scene.establishedFactIds;
  if (facts.includes('fact_route_testimony_conflict') && facts.includes('fact_witness_clock_discrepancy')) score += 20;

  // 4. Provenance Chain Understanding (max 20 pts)
  if (state.canonical.canonicalFlags.includes('provenance_chain_understood') || state.canonical.canonicalFlags.includes('timeline_synthesis_finalized')) {
    score += 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates Trust Score (0 - 100).
 * Social cohesion, relationships, and absence of reckless accusations.
 */
export function calculateTrustScore(state: RunState): number {
  let score = 40; // Neutral baseline

  // 1. NPC Rapports
  const salar = state.npcMemory.salar?.rapport ?? 0;
  const haniyeh = state.npcMemory.haniyeh?.rapport ?? 0;
  const mani = state.npcMemory.mani?.rapport ?? 0;
  const yashin = state.npcMemory.yashin?.rapport ?? 0;
  const mehri = state.npcMemory.arian_mehri?.rapport ?? 0;
  const totalRapport = salar + haniyeh + mani + yashin + mehri;
  score += totalRapport * 4;

  // 2. Absence of False Accusations
  const flags = state.canonical.canonicalFlags;
  if (flags.includes('accused_insider_falsely')) score -= 40;
  if (flags.includes('accused_witness_of_lying')) score -= 20;
  if (flags.includes('shared_findings_with_salar')) score += 15;
  if (flags.includes('protected_group')) score += 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * The Master Ending Resolver Algorithm.
 * Resolves the 6 canonical endings + variants deterministically.
 */
export function resolveEnding(state: RunState): EndingEvaluationResult {
  const preservation = calculatePreservationProfile(state);
  const truthDiscovery = calculateTruthDiscovery(state);
  const truthInterpretation = calculateTruthInterpretation(state);
  const trustScore = calculateTrustScore(state);
  const flags = state.canonical.canonicalFlags;
  const playerClass: PlayerClassId = state.canonical.playerClass ?? 'observer';

  const reasons: string[] = [];
  let endingId: EndingId;
  let priceVariant: 'THE_PRICE_SIMPLE' | 'THE_PRICE_SACRIFICE' | undefined;
  let wrongManVariant: 'accidental_suspicion' | 'destructive_false_accusation' | undefined;
  let vetoApplied: string | undefined;

  // ── PRIORITY 1: Hard Veto — Financial Settlement (THE_PRICE) ──
  if (flags.includes('accepted_financial_offer')) {
    endingId = 'THE_PRICE';
    vetoApplied = 'accepted_financial_offer';
    if (truthDiscovery >= 70 && truthInterpretation >= 60) {
      priceVariant = 'THE_PRICE_SACRIFICE';
      reasons.push('بازیکن حقیقت کامل را کشف کرد اما آگاهانه برای نجات کافه و بدهی‌های سالار مصالحه مالی را پذیرفت.');
    } else {
      priceVariant = 'THE_PRICE_SIMPLE';
      reasons.push('پیشنهاد مالی در نود ۱۶ پیش از درک کامل زنجیره پذیرفته شد.');
    }
  }

  // ── PRIORITY 2: Hard Rupture — False Insider Accusation (WRONG_MAN) ──
  else if (flags.includes('accused_insider_falsely')) {
    endingId = 'WRONG_MAN';
    vetoApplied = 'destructive_false_accusation';
    if (flags.includes('retracted_false_theory') || flags.includes('apologized_to_witness')) {
      wrongManVariant = 'accidental_suspicion';
      reasons.push('اتهام عجولانه مطرح شد اما با پس‌گرفتن فرضیه، بی‌اعتمادی نسبی ترمیم یافت.');
    } else {
      wrongManVariant = 'destructive_false_accusation';
      reasons.push('یکی از اعضای خودی بدون مدرک متهم شد و انسجام داخلی کافه فروپاشید.');
    }
  }

  // ── PRIORITY 3: Reckless Public Leak (EXPOSURE) ──
  else if (flags.includes('leaked_evidence_publicly') || (preservation.reputationPreservation < 20 && preservation.truthPreservation > 65 && trustScore < 40)) {
    endingId = 'EXPOSURE';
    reasons.push('مدارک خام در فضای مجازی منتشر شدند و در هیاهوی تئوری‌های توطئه گم گشتند.');
  }

  // ── PRIORITY 4: Mastery & Illumination (TRUE_ENDING) ──
  else if (
    truthDiscovery >= 70 &&
    truthInterpretation >= 65 &&
    trustScore >= 55 &&
    !flags.includes('accepted_financial_offer')
  ) {
    endingId = 'TRUE_ENDING';
    reasons.push('درک کامل زنجیرهٔ چهارگانه مالکیت (HAND, CUP, WINDOW, SHADOW) و پلاک ۵۵، همراه با انسجام تایم‌لاین و حفظ اعتماد گروه.');
  }

  // ── PRIORITY 5: Sacrificial Family Bond (BROTHERS) ──
  else if (
    state.canonical.threat >= 25 &&
    (state.npcMemory.mani?.rapport ?? 0) >= 2 &&
    (state.npcMemory.yashin?.rapport ?? 0) >= 2 &&
    preservation.peoplePreservation >= 65
  ) {
    endingId = 'BROTHERS';
    reasons.push('پیوند و فداکاری برادران شجاعی در اوج تهدید مانع از نابودی مدارک و کافه شد.');
  }

  // ── PRIORITY 6: Default Safe Status Quo (ESPRESSO) ──
  else {
    endingId = 'ESPRESSO';
    reasons.push('بخش کوچکی از معما حل شد و کافه نجات یافت، اما راز بنیادین در لایه‌های پنهان باقی ماند.');
  }

  // Generate Variant ID
  let variantPrefix = endingId;
  if (priceVariant) variantPrefix = priceVariant as any;
  if (wrongManVariant) variantPrefix = `${endingId}_${wrongManVariant.toUpperCase()}` as any;
  const variantId = `${variantPrefix}__${playerClass.toUpperCase()}`;

  // Generate Epilogue Text based on Ending + Variant + Role Lens + Truth Metrics
  const epilogueText = generateEpilogueText(
    endingId,
    variantId,
    playerClass,
    priceVariant,
    wrongManVariant,
    truthDiscovery,
    truthInterpretation
  );

  return {
    endingId,
    variantId,
    truthDiscovery,
    truthInterpretation,
    trustScore,
    preservation,
    epilogueText,
    explanation: {
      reasons,
      vetoApplied,
      roleLensUsed: playerClass,
      priceVariant,
      wrongManVariant,
    },
    evaluatedAtTurn: state.scene.turn,
  };
}

/**
 * Generates the authentic 24-variant authored Persian Epilogue text.
 */
function generateEpilogueText(
  endingId: EndingId,
  variantId: string,
  role: PlayerClassId,
  priceVariant?: string,
  wrongManVariant?: string,
  truthDiscovery = 0,
  truthInterpretation = 0
): string {
  // ── 1. TRUE_ENDING (PENTIMENTO) ──
  if (endingId === 'TRUE_ENDING') {
    const base = `صبح شده است.
نور ملایم طلوع خورشید از پنجره‌های قدی کافه به سالن می‌تابد و بخار اولین شات اسپرسوی صبحگاهی هوا را پر می‌کند.
پنتی روی صندلی چوبی کنار میز ۵ آرام خوابیده است.
یاشین پورتافیلتر را پاک می‌کند و سالار به انتهای سالن نگاه می‌کند — جایی که تابلوی نقاشی اکنون معنای دیگری یافته است.

تو چهار تصویر را کنار هم می‌گذاری:
دست. پنجره. فنجان. سایه.

نقشه‌ای برای یک گنج مخفی در کار نبود.
این‌ها چهار مرحلهٔ یک زنجیرهٔ انسانی بودند؛ زنجیره‌ای از انتقال و پشیمانی که در نهایت به پلاک ۵۵ ختم شد. پنتیمنتو.`;

    if (role === 'art_historian') {
      return base + `\n\nبه عنوان یک مورخ هنری می‌دانی: تابلوها به کسی که پولشان را می‌دهد تعلق ندارند؛ به چشم‌هایی تعلق دارند که لایه‌های زیرین را می‌بینند. اثر زنده ماند، چون تاریخش پاک نشد.`;
    } else if (role === 'coffee_alchemist') {
      return base + `\n\nبه عنوان یک کیمیاگر قهوه حس می‌کنی: ارزش کافه به عتیقه‌های پنهان نبود؛ به بوی قهوهٔ تازه، گرمای فنجان میز ۵ و جای پای پنتی است که دوباره در آرامش سالن راه می‌رود.`;
    } else if (role === 'systems_analyst') {
      return base + `\n\nبه عنوان یک تحلیلگر سیستم درمی‌یابی: تمام سیستم‌ها خطاها را ثبت می‌کنند؛ اما آن هفت دقیقه‌ای که هرگز روی دیسک نوشته نشد، جایی بود که ارادهٔ انسان‌ها تاریخ را تغییر داد.`;
    } else {
      return base + `\n\nبه عنوان یک کارآگاه درک می‌کنی: پرونده با پیدا کردن یک مجرم بسته نشد؛ با فهمیدن این حقیقت بسته شد که چرا هر کس نقاب خودش را به صورت زده بود و در نهایت برای حفظ این خانه ایستاد.`;
    }
  }

  // ── 2. THE_PRICE ──
  if (endingId === 'THE_PRICE') {
    if (priceVariant === 'THE_PRICE_SACRIFICE') {
      return `چک بانکی پذیرفته شد.
بدهی‌های لبنیات سالار تسویه شدند و خطر بسته شدن کافه از میان رفت.
تو حقیقت کامل زنجیرهٔ ۵۵ را می‌دانستی، اما بهای آرامش دوستانت را با یک سکوت آگاهانه پرداخت کردی.
دیوار انتهای سالن سفید و خالی است. سالار دیگر به آن نقطه نگاه نمی‌کند.`;
    } else {
      return `پیشنهاد مالی پذیرفته شد.
پول منتقل شد و بدهی‌ها پرداخت گردید.
تابلو از دیوار برداشته شد و یک مستطیل خالی روی گچ دیوار ماند.
آدم‌ها همان آدم‌ها هستند، فقط سکوت سنگین‌تری میان میزها نشسته است.
ENDING: THE PRICE`;
    }
  }

  // ── 3. BROTHERS ──
  if (endingId === 'BROTHERS') {
    return `در اوج تنش و تهدید، پیوند مانی و یاشین مانع از فروپاشی شد.
یکی از برادران خطر را به جان خرید تا مدارک حفظ شوند و کافه از گزند بگذرد.
شاید تمام تاریخچهٔ باستانی کشف نشد، اما وفاداری خانواده شجاعی محکم‌تر از هر سندی بر جای ماند.
ENDING: BROTHERS`;
  }

  // ── 4. ESPRESSO ──
  if (endingId === 'ESPRESSO') {
    if (truthDiscovery >= 70 && truthInterpretation < 65) {
      return `صبح شده است و نور خورشید از شیشه‌های قدی کافه به سالن می‌تابد.
تو تمام تکه‌ها را پیدا کرده بودی — فاکتور، برچسب کهنه، هفت دقیقه سکوت دوربین‌ها، بوی شویندهٔ انبار. همهٔ مدارک روی میز چیده شده بودند، اما سکوت آدم‌های پشت کانتر سنگین‌تر از کاغذها بود.
بدون فهمیدن اینکه چه کسی از چه چیزی می‌ترسید و چرا ساعتی ۵ دقیقه عقب مانده بود، تکه‌ها فقط اشیاء بی‌صدا باقی ماندند.
سالار چک‌ها را پاس کرد، مانی به شوخی‌هایش ادامه داد و کافه زنده ماند. آرامش بازگشت، اما راز تابلوی ۵۵ در لایه‌های زیرین رنگ خوابید... چون گاهی داشتن تمام مدارک، برای باز کردن دل آدم‌ها کافی نیست.
ENDING: ESPRESSO (UNRESOLVED HUMAN HEART)`;
    }
    return `بخش کوچکی از معما حل شد و فشار از روی کافه برداشته شد.
کافه پنتیمنتو به کار خود ادامه می‌دهد و مشتریان در ساعت‌های عادی قهوه‌شان را می‌نوشند.
اما راز لایه‌های زیرین تابلو در سکوت باقی ماند؛ رازی که شاید روزی دیگر دوباره از زیر رنگ‌ها نمایان شود.
ENDING: ESPRESSO`;
  }

  // ── 5. EXPOSURE ──
  if (endingId === 'EXPOSURE') {
    return `مدارک به سرعت در فضای مجازی و شبکه‌های اجتماعی منتشر شدند.
هزاران پیام، تئوری‌های متناقض و ترول‌های اینترنتی اسناد واقعی را احاطه کردند.
حقیقت منتشر شد، و دقیقاً به همین دلیل دیگر هیچ‌کس آن را باور نکرد.
ENDING: EXPOSURE`;
  }

  // ── 6. WRONG_MAN ──
  if (endingId === 'WRONG_MAN') {
    return `اتهام نسنجیده به یکی از اعضای خودی، فضای اعتماد کافه را در هم شکست.
نیازی به دخالت دشمن نبود؛ سوءظن درونی کار خود را کرد.
کافه سرد شد و هر کس در سکوت به گوشه‌ای خیره ماند.
ENDING: WRONG MAN`;
  }

  return `پروندهٔ پنتیمنتو به پایان رسید.`;
}

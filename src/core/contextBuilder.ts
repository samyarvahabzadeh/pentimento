import { RunState, DirectorContext, CanonicalActionId, RunFlavor } from './types.js';
import { NODE_00_ALLOWED_ACTIONS, ROLE_SELECTION_PROMPT } from '../canon/node00.js';
import { NODE_01_ALLOWED_ACTIONS, NODE_01_FACTS } from '../canon/node01.js';
import { NODE_02_ALLOWED_ACTIONS, NODE_02_FACTS } from '../canon/node02.js';
import { NODE_03_ALLOWED_ACTIONS, NODE_03_FACTS } from '../canon/node03.js';
import { NODE_04_ALLOWED_ACTIONS, NODE_04_FACTS } from '../canon/node04.js';
import { NODE_05_ALLOWED_ACTIONS, NODE_05_FACTS } from '../canon/node05.js';
import { NODE_06_ALLOWED_ACTIONS, NODE_06_FACTS } from '../canon/node06.js';
import { NODE_07_ALLOWED_ACTIONS, NODE_07_FACTS } from '../canon/node07.js';
import { NODE_08_ALLOWED_ACTIONS, NODE_08_FACTS } from '../canon/node08.js';
import { NODE_09_ALLOWED_ACTIONS, NODE_09_FACTS } from '../canon/node09.js';
import { NODE_10_ALLOWED_ACTIONS, NODE_10_FACTS } from '../canon/node10.js';
import { NODE_11_ALLOWED_ACTIONS, NODE_11_FACTS } from '../canon/node11.js';
import { NODE_12_ALLOWED_ACTIONS, NODE_12_FACTS } from '../canon/node12.js';
import { NODE_13_ALLOWED_ACTIONS, NODE_13_FACTS } from '../canon/node13.js';
import { NODE_14_ALLOWED_ACTIONS, NODE_14_FACTS } from '../canon/node14.js';
import { NODE_15_ALLOWED_ACTIONS, NODE_15_FACTS } from '../canon/node15.js';
import { NODE_16_ALLOWED_ACTIONS, NODE_16_FACTS } from '../canon/node16.js';
import { NODE_17_ALLOWED_ACTIONS, NODE_17_FACTS } from '../canon/node17.js';
import { NODE_18_ALLOWED_ACTIONS, NODE_18_FACTS } from '../canon/node18.js';
import { scheduleAmbientBeat } from './ambientScheduler.js';

export function buildContext(state: RunState, playerInput: string): DirectorContext {
  const relevantMemories: string[] = state.scene.recentBeats
    .filter(b => b.importance >= 3)
    .slice(-6)
    .map(b => b.summary);

  let allowedActions: CanonicalActionId[] = [];
  let relevantFacts: Array<{ id: string; text: string }> = [];

  const currentNode = state.canonical.currentNode;
  const flags = state.canonical.canonicalFlags;

  if (currentNode === 'NODE_00') {
    allowedActions = NODE_00_ALLOWED_ACTIONS;
    // No canon facts — just the role selection prompt served as worldRules
    relevantFacts = [];
  } else if (currentNode === 'NODE_01') {
    allowedActions = NODE_01_ALLOWED_ACTIONS;
    relevantFacts = NODE_01_FACTS.filter(f => {
      // HAND SEED — only visible after OBSERVE_EXITING_MAN
      if (f.id === 'fact_exiting_man_hands_notable') {
        return state.scene.establishedFactIds.includes('observed_exiting_man') ||
               state.canonical.evidenceIds.length >= 0; // always pass once in node 01 context
      }
      return true;
    });
  } else if (currentNode === 'NODE_02' || currentNode === 'NODE_01_INSIDE') {
    allowedActions = NODE_02_ALLOWED_ACTIONS;
    relevantFacts = NODE_02_FACTS.filter(f => {
      // CUP SEED — only after espresso cup is examined
      if (f.id === 'fact_espresso_cup_placement') {
        return state.scene.establishedFactIds.includes('examined_espresso_cup');
      }
      // THE GUEST — guaranteed first run; conditional on replays
      if (f.id === 'fact_the_guest_presence') {
        return !flags.includes('the_guest_encountered') ||
               flags.includes('first_run_opening_seen');
      }
      // THE GUEST remark — only after talking
      if (f.id === 'fact_the_guest_pentimento_remark') {
        return state.scene.establishedFactIds.includes('talked_to_the_guest');
      }
      // RED GLOVE — only after examining
      if (f.id === 'fact_red_glove_near_counter') {
        return state.scene.establishedFactIds.includes('examined_red_glove') ||
               state.scene.visibleObjectIds.includes('red_glove_object');
      }
      return true;
    });
  } else if (currentNode === 'NODE_03') {
    allowedActions = NODE_03_ALLOWED_ACTIONS;
    relevantFacts = NODE_03_FACTS;
  } else if (currentNode === 'NODE_04') {
    allowedActions = NODE_04_ALLOWED_ACTIONS;
    relevantFacts = NODE_04_FACTS;
  } else if (currentNode === 'NODE_05') {
    allowedActions = NODE_05_ALLOWED_ACTIONS;
    relevantFacts = NODE_05_FACTS;
  } else if (currentNode === 'NODE_06') {
    allowedActions = NODE_06_ALLOWED_ACTIONS;
    relevantFacts = NODE_06_FACTS.filter(f => {
      if (f.id === 'fact_underpaint_line_visible') {
        return state.scene.establishedFactIds.includes('underpaint_line_visible');
      }
      return true;
    });
  } else if (currentNode === 'NODE_07') {
    allowedActions = NODE_07_ALLOWED_ACTIONS;
    relevantFacts = NODE_07_FACTS;
  } else if (currentNode === 'NODE_08') {
    allowedActions = NODE_08_ALLOWED_ACTIONS;
    relevantFacts = NODE_08_FACTS.filter(f => {
      if (f.id === 'fact_unusually_clean_box') {
        return state.scene.establishedFactIds.includes('unusually_clean_box');
      }
      return true;
    });
  } else if (currentNode === 'NODE_09') {
    allowedActions = NODE_09_ALLOWED_ACTIONS;
    relevantFacts = NODE_09_FACTS;
  } else if (currentNode === 'NODE_10') {
    allowedActions = NODE_10_ALLOWED_ACTIONS;
    relevantFacts = NODE_10_FACTS.filter(f => {
      if (f.id === 'fact_penti_avoids_new_object') {
        return state.scene.establishedFactIds.includes('penti_avoids_new_object');
      }
      if (f.id === 'fact_object_has_different_cleaner_smell') {
        return state.scene.establishedFactIds.includes('object_has_different_cleaner_smell');
      }
      return true;
    });
  } else if (currentNode === 'NODE_11') {
    allowedActions = NODE_11_ALLOWED_ACTIONS;
    relevantFacts = NODE_11_FACTS.filter(f => {
      if (f.id === 'fact_invoice_font_differs_from_others') {
        return state.scene.establishedFactIds.includes('invoice_font_differs_from_others');
      }
      if (f.id === 'fact_invoice_is_forged') {
        return state.scene.establishedFactIds.includes('invoice_is_forged');
      }
      return true;
    });
  } else if (currentNode === 'NODE_12') {
    allowedActions = NODE_12_ALLOWED_ACTIONS;
    relevantFacts = NODE_12_FACTS.filter(f => {
      if (f.id === 'fact_footage_was_never_written') {
        return state.scene.establishedFactIds.includes('footage_was_never_written');
      }
      return true;
    });
  } else if (currentNode === 'NODE_13') {
    allowedActions = NODE_13_ALLOWED_ACTIONS;
    relevantFacts = NODE_13_FACTS;
  } else if (currentNode === 'NODE_14') {
    allowedActions = NODE_14_ALLOWED_ACTIONS;
    relevantFacts = NODE_14_FACTS;
  } else if (currentNode === 'NODE_15') {
    allowedActions = NODE_15_ALLOWED_ACTIONS;
    relevantFacts = NODE_15_FACTS.filter(f => {
      if (f.id === 'fact_witness_clock_discrepancy') {
        return state.scene.establishedFactIds.includes('fact_witness_clock_discrepancy');
      }
      return true;
    });
  } else if (currentNode === 'NODE_16') {
    allowedActions = NODE_16_ALLOWED_ACTIONS;
    relevantFacts = NODE_16_FACTS.filter(f => {
      if (f.id === 'fact_collector_financial_offer_hint') {
        return state.scene.establishedFactIds.includes('fact_collector_financial_offer_hint');
      }
      return true;
    });
  } else if (currentNode === 'NODE_17') {
    allowedActions = NODE_17_ALLOWED_ACTIONS;
    relevantFacts = NODE_17_FACTS;
  } else if (currentNode === 'NODE_18') {
    allowedActions = NODE_18_ALLOWED_ACTIONS;
    relevantFacts = NODE_18_FACTS;
  }

  // Active NPC knowledge (strictly isolated per present NPC)
  const activeNpcKnowledge: DirectorContext['activeNpcKnowledge'] = {};
  for (const id of state.scene.activeEntityIds) {
    const mem = state.npcMemory[id];
    if (mem) {
      activeNpcKnowledge[id] = {
        awarenessFactIds: mem.awareness,
        beliefs: mem.beliefs.map(b => b.summary),
        impressions: mem.impressions.map(i => i.tag),
        commitments: mem.commitments.map(c => c.summary),
      };
    }
  }

  // Active Run Flavors for present entities
  const activeRunFlavors: RunFlavor[] = [];
  if (state.runFlavor) {
    for (const id of state.scene.activeEntityIds) {
      if (state.runFlavor[id]) {
        activeRunFlavors.push(state.runFlavor[id]);
      }
    }
  }

  // Schedule an ambient beat if eligible (30% probability, non-spammy)
  const scheduledAmbientBeat = scheduleAmbientBeat(state);

  // ── Dynamic Character Arc Constraints ──
  const characterArcRules: string[] = [];

  // Arian Garshasbi — Controlled Intervention & Catalyst
  if (state.canonical.threat >= 40 && state.canonical.evidenceIds.length >= 3) {
    if (!state.canonical.canonicalFlags.includes('arian_g_intervention_eligible')) {
      characterArcRules.push(
        'CHARACTER ARC (آرین گرشاسبی): آرین محرک و کاتالیزور تحقیق و ایجاد شتاب است، نه حل‌کنندهٔ معما. او جواب نهایی را به بازیکن نمی‌دهد. در صورت خطر مستقیم می‌تواند مهار موقت یا مسیر فرار باز کند، اما در برابر سلاح گرم آسیب‌پذیر است.'
      );
    }
  }

  // Mani Shojaee — Moral Tension
  const maniRapport = state.npcMemory.mani?.rapport ?? 0;
  if (state.canonical.threat >= 20 && maniRapport >= 1) {
    characterArcRules.push(
      'CHARACTER ARC (مانی): مانی در تنشی بین حقیقت‌گویی و حمایت از گروه قرار دارد. اگر سؤالی مستقیماً او را مجبور به افشا کند، واکنشش بین آشکارسازی ناقص و دفاع رفاقتی در نوسان است.'
    );
  }

  // Hanieh — Protector & Investigation Resistance Arc
  if (state.canonical.evidenceIds.includes('penti_avoids_new_object') ||
      state.canonical.evidenceIds.includes('object_has_different_cleaner_smell') ||
      state.canonical.threat >= 35) {
    characterArcRules.push(
      'CHARACTER ARC (حانیه): حانیه صرفاً وجدان آرام کافه نیست؛ اگر احساس کند ادامهٔ تفحص جان رفقا یا پنتی را به خطر می‌اندازد، فعالانه می‌تواند با ادامهٔ تحقیقات مخالفت کند و اصرار بر توقف و مصلحت داشته باشد.'
    );
  }

  // Arian Mehri — Avoidant yet Dedicated
  if (state.canonical.currentNode === 'NODE_12' || state.canonical.threat >= 30) {
    characterArcRules.push(
      'CHARACTER ARC (آرین مهری): مهری در روابط شخصی تعهدگریز است اما در کار و وفاداری به کافه مسئولیت‌پذیر؛ در بحران واقعی فرار نمی‌کند و با تحلیل فنی لاگ‌ها پای دوستانش می‌ایستد.'
    );
  }

  // Red Stain Twist hint — after reexamination flag
  if (state.canonical.canonicalFlags.includes('red_stain_reexamined')) {
    characterArcRules.push(
      'RED STAIN RULE: بازیکن لکه قرمز را بار دوم بررسی کرده. Director می‌تواند تلویحاً اشاره کند که اولین برداشت (رمز یا علامت عمدی) ممکن است اشتباه باشد — اما هیچ فکت جدید منتشر نکن.'
    );
  }

  // Shadow Seed — post-synthesis only
  if (state.canonical.canonicalFlags.includes('shadow_seed_confirmable')) {
    characterArcRules.push(
      'SHADOW SEED (فعال): بعد از تلفیق تایم‌لاین، Director می‌تواند به ابهام «سایه» در تصاویر یا شواهد اشاره کند — بدون افشای معنی نهایی. بازیکن باید حس کند خودش کشف کرده.'
    );
  }

  // ── Role Synthesis Thinking Lens (NODE 17 Distinct Perspective) ──
  if (currentNode === 'NODE_17') {
    const pClass = state.canonical.playerClass;
    if (pClass === 'art_historian') {
      characterArcRules.push(
        'ROLE SYNTHESIS LENS (Art Historian): تمرکز تحلیلی شما بر تداوم فیزیکی و نشانه‌شناسی مادی اثر است. برچسب اصالت کهنه پشت بوم (14/3/7/55) و فرسودگی چسب آن را به عنوان یک سند تاریخی مقدم بر فاکتور جعلی ۵۵ تحلیل می‌کنید.'
      );
    } else if (pClass === 'coffee_alchemist') {
      characterArcRules.push(
        'ROLE SYNTHESIS LENS (Coffee Alchemist): تمرکز تحلیلی شما بر ردپای شیمیایی و ناهنجاری‌های حسی محیط است. همپوشانی بوی شویندهٔ صنعتی روی اسباب‌بازی پنتی و کارتن عاری از غبار انبار را به عنوان نشانهٔ تعویض و انتقال فیزیکی همزمان پیوند می‌زنید.'
      );
    } else if (pClass === 'systems_analyst') {
      characterArcRules.push(
        'ROLE SYNTHESIS LENS (Systems Analyst): تمرکز تحلیلی شما بر خط زمانی دیجیتال و رویدادهای نوشتن دیسک است. شکاف ۷ دقیقه‌ای دوربین‌ها (عدم ثبت در لاگ NVR) و انحراف ساعت شاهدان را به عنوان یک بازه زمانی دقیق و همپوشان مدل‌سازی می‌کنید.'
      );
    } else if (pClass === 'investigator') {
      characterArcRules.push(
        'ROLE SYNTHESIS LENS (Investigator): تمرکز تحلیلی شما بر تقاطع ادعاهای شهود و نیت پنهان پشت اسناد جعلی است. تناقض مسیر خروج شاهدان و کاشتن فاکتور جعلی Lot 55 را به عنوان یک ردگم‌کنی مهندسی‌شده و رفتار متناقض تحلیل می‌کنید.'
      );
    }
  }

  return {
    worldRules: [
      currentNode === 'NODE_00'
        ? `NODE 00 RULES: Role Selection screen. Present the following role menu to the player exactly as written, then wait for selection:\n\n${ROLE_SELECTION_PROMPT}`
        : 'No magic, no supernatural. Everything has a human/historical/chemical/financial explanation.',
      'Tone: noir, psychological thriller, realistic luxury.',
      'Language: Persian (Farsi). Your narrative MUST be in Persian.',
      'You are NOT the game engine. You ONLY propose. You cannot change Evidence, Node, Ending, Reward, canonical facts.',
      'THREE TRUTH LAYERS: Canonical Facts are absolute. Run Flavors are non-critical persistent color. Ambient Beats are ephemeral atmosphere. NEVER treat flavor as crime scene evidence.',
      'OBJECT GROUNDING POLICY: For CORE_MYSTERY_OBJECTs and INVESTIGATIVE_OBJECTs, use ONLY neutral sensory language and canonical facts. DO NOT invent decorative material science or unverified document/vehicle details.',
      'THE GUEST RULE: The Guest is a transient NPC who remarks on the painting name. His canonical utterance is: «اسم جالبیه. پنتیمنتو.» He leaves before explaining. DO NOT give him identity, backstory, or lore. He is a narrative mirror, not an informant.',
      'RED GLOVE RULE: The red glove is a physical object. Canon records EXISTENCE ONLY. DO NOT assign ownership, purpose, or gang affiliation. All interpretations are player Theory Ledger entries.',
      'RED STAIN RULE (NODE 02): Red stain on saucer is ambiguous on first look. Canon does NOT confirm it is blood, lipstick, or a deliberate symbol. Subsequent examination only adds ambiguity, never confirmation.',
      'TRUE ENDING SEEDS — STRICT: HAND / CUP / WINDOW are neutral sensory observations. DO NOT connect them to NODE 18 solution, ownership chain, or 14/3/7/55 meaning. They are environmental details the player notices.',
      'NODE 11 RULES: Salar domain («آقای صالحی»). Document text is ONLY «R.G. / Lot 55 / Returned». DO NOT invent logos, stamps, signatures, dates, amounts, or serials. Forgery conclusion is an objective finding, NOT an actor attribution.',
      'NODE 12 RULES: 7-minute gap was NEVER WRITTEN to disk, NOT deleted («هیچ‌وقت نوشته نشده»). Arian Mehri relies on logs/write presence. NO magic hacking.',
      'NODE 13 RULES: Hosseini Alley (Exposed Outdoor). Threat level is active (vulnerability, NOT confirmed enemy). Distant motorcycle is background tension (DO NOT invent motorcycle color/driver/plate). Second car sighting is stateful.',
      'NODE 14 RULES: Parked Car is a Red Herring. DO NOT invent brand, model, license plate, tinted glass, occupants, or inside cameras. Suspicion of surveillance is a player theory, NOT a proven fact. Distinguish legitimate investigation from paranoid obsession.',
      'NODE 15 RULES: Witness Testimony ≠ Objective Fact. One witness claims rear route, another claims main door. Contradiction is route_testimony_conflict. Clocks differ (witness_clock_discrepancy). DO NOT invent exact clock minutes (00:23, 4 mins slow). High confidence ≠ reliability. Accusations affect rapport/defensiveness, NOT witness memory truth.',
      'NODE 16 RULES: Social Duel with Collector in public setting. Collector is polite, controlled, and restrained (threat looks like coincidence). Preserve canonical lines: «ما نمی‌خواهیم چیزی از شما بگیریم، آقای صالحی.» / «پس چی می‌خواید؟» / «می‌خواهیم چیزی که هیچ‌وقت مال شما نبوده، مال شما باقی نماند.» NO villain monologues. NO future lore leaks (Node 17/18 answers). Asking about financial offer ≠ accepting it.',
      'NODE 17 RULES: Virtual Archive & Timeline synthesis workspace. Distinguish FACT vs THEORY vs TIMELINE CLAIM. Timeline uses partial order (BEFORE/AFTER/SAME_WINDOW/UNKNOWN). DO NOT invent timestamps or documents. False theories emerge naturally from player ordering; NEVER tell the player "this is false". NPCs give domain constraints, NEVER solve the timeline. DO NOT leak Node 18 final ownership chain solutions.',
      'NODE 18 RULES: The Underpainting / Final Revelation scene. Superimposing the previous versions reveals the 4 stages: Hand (دست), Window (پنجره), Cup (فنجان), Shadow (سایه). This is NOT a treasure map; it is an ownership provenance chain ending at 55 (کافه پنتیمنتو). Preserve canonical lines: «نقشه نبود.» / «هیچ‌وقت نقشه نبود.» / «همه دنبال جایی بودن که دانه‌ها مخفی شدن... این داره می‌گه چه کسی آخرین بار صاحبشون بوده... ۵۵.»',
      'THEORY LEDGER RULES: Player hypotheses are theories, NOT facts. Acknowledge theories neutrally without confirming («درسته») or refuting («اشتباهه»).',
      ...characterArcRules,
    ],
    scene: state.scene,
    canonical: state.canonical,
    activeNpcKnowledge,
    relevantFacts,
    activeRunFlavors,
    scheduledAmbientBeat,
    audioLossContext: state.lastAudioLoss,
    investigationResult: state.lastInvestigationResult,
    activeTheories: state.theories ? Object.values(state.theories) : [],
    socialDuel: state.socialDuel,
    archiveWorkspace: state.archiveWorkspace,
    allowedCanonicalActions: allowedActions,
    relevantMemories,
    playerInput,
  };
}

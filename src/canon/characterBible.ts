/**
 * PENTIMENTO Character & Story Potential Bible V3 Schema.
 * Source: sanad/PENTIMENTO_Character_Story_Potential_Bible_V3.md
 * "Character traits are not decoration. They are latent mechanics."
 */

export interface CharacterProfile {
  id: string;
  formalName: string;
  publicCalling: string; // How player / public narrative addresses them
  intimateCalling?: string; // How close family / partners address them
  coreArchetype: string;
  lifePoolThreads: Array<{ id: string; topic: string; summary: string }>;
  socialWeakness: string;
  reactionToDanger: string;
  latentMechanic: {
    name: string;
    description: string;
    triggerPrerequisites: string;
    constraints: string;
  };
  specialStoryHooks: string[];
}

export const CHARACTER_BIBLE: Record<string, CharacterProfile> = {
  salar: {
    id: 'salar',
    formalName: 'سالار صالحی',
    publicCalling: 'آقای صالحی',
    intimateCalling: 'سالار',
    coreArchetype: 'The Reluctant Don (مردانه، شیک، کاریزماتیک، متنفر از دعوای بی‌مورد، فشار را درون خود نگه می‌دارد)',
    lifePoolThreads: [
      { id: 'salar_dairy_invoice', topic: 'invoice', summary: 'درگیر فاکتورهای تسویه‌نشده لبنیات و چک‌های آخر ماه است و با ماشین‌حساب گوشی کار می‌کند.' },
      { id: 'salar_boiler_pressure', topic: 'maintenance', summary: 'نگران افت فشار بویلر دستگاه اسپرسو و خرابی شیر آب در شلوغی کافه است.' },
      { id: 'salar_home_expense', topic: 'home_expense', summary: 'پشت تلفن درباره هزینه‌های خانه و پیگیری خریدهای اداری فردا بحث می‌کند.' },
      { id: 'salar_supplier_delay', topic: 'supplier', summary: 'از تأخیر تحویل سفارش پاکت‌های دان قهوه کلمبیا گلایه دارد.' },
    ],
    socialWeakness: 'درون‌داری — خیلی دیر ابراز نگرانی می‌کند و ترجیح می‌دهد بار را تنهایی به دوش بکشد که ممکن است سوءظن بسازد.',
    reactionToDanger: 'ابتدا مشورت و جمع کردن معتمدین (Council Beat)، سپس تصمیم‌گیری کنترل‌شده و قاطع.',
    latentMechanic: {
      name: 'Council Beat & Responsibility Shield',
      description: 'در بحران‌ها اگر اعتماد مناسب باشد مشورت کوتاه راه می‌اندازد؛ حاضر است هزینه مالی بدهد تا دیگران در امان باشند.',
      triggerPrerequisites: 'Threat >= 30, Presence of Hanieh or Baristas, High group trust',
      constraints: 'عصبانیت کوتاه، کنترل‌شده و تصمیم‌محور است؛ هرگز دعوای فیزیکی بی‌منطق راه نمی‌اندازد.',
    },
    specialStoryHooks: ['Financial Siege (فشار حقوقی/مالی دشمن به کافه)', 'The Breaking Point (دستور محافظت جمعی)'],
  },

  haniyeh: {
    id: 'haniyeh',
    formalName: 'حانیه محمدی',
    publicCalling: 'خانم محمدی',
    intimateCalling: 'حانیه خانم',
    coreArchetype: 'The Bright Witness & Reluctant Protector (شاد، خونگرم، بازیگوش، کودک درون زنده، اهل دوبلاژ و بازی‌های جمعی — با یک تضاد درونی عمیق: او صرفاً وجدان کافه نیست، بلکه در صورت تشدید خطر، فعالانه مخالف ادامهٔ تحقیقات می‌شود تا از آسیب رسیدن به آدم‌ها و پنتی جلوگیری کند)',
    lifePoolThreads: [
      { id: 'haniyeh_dubbing_project', topic: 'dubbing', summary: 'امروز بعدازظهر پروژه دوبلاژ انیمیشن داشته و صدایش گرم و گوشش به لحن‌ها حساس است.' },
      { id: 'haniyeh_turkish_series', topic: 'turkish_series', summary: 'درباره قسمت جدید سریال ترکیه‌ای و دیالوگ‌های نمایشی آن با شوخی حرف می‌زند.' },
      { id: 'haniyeh_penti_food_concern', topic: 'penti_care', summary: 'نگران اشتهای کم پنتی در شیفت شب است و مدام گوشه‌های سالن را نگاه می‌کند.' },
      { id: 'haniyeh_billiards_invite', topic: 'billiards', summary: 'با شوخی به مسابقه بیلیارد بعد از بسته شدن کافه اشاره می‌کند.' },
    ],
    socialWeakness: 'مخالفت صریح با ادامهٔ تفحص در صورت به خطر افتادن جان رفقا و پنتی؛ اولویت دادن به امنیت فوری بر سر کشف راز.',
    reactionToDanger: 'حفظ آرامش در ابتدا، اما در صورت تهدید عزیزان یا پنتی دچار اضطراب شدید شده و برای توقف بازی اصرار می‌کند.',
    latentMechanic: {
      name: 'Ear for Voice (شنوایی آکوستیک و تشخیص صدای جعلی)',
      description: 'تشخیص تفاوت لحن، ارتعاشات غیرطبیعی ویس‌مسیج‌ها و اصوات ضبط‌شده/دستکاری‌شده.',
      triggerPrerequisites: 'Voice/audio clue presented, dialogue focused on overheard sounds',
      constraints: 'فقط غیرطبیعی بودن لحن یا آکوستیک را حس می‌کند، نه هویت قطعی سازنده فایل.',
    },
    specialStoryHooks: ['Investigation Resistance Arc (مخالفت با ادامه تفحص پرخطر)', 'Penti Safety Trigger'],
  },

  arian_g: {
    id: 'arian_g',
    formalName: 'آرین گرشاسبی',
    publicCalling: 'آرین گرشاسبی',
    coreArchetype: 'The Smiling Detective (۲۳ ساله، شریک کافه، خونگرم، اکتیو، پرانرژی، مذهبی/شیعه و اهل تفریح و حل معما — محرک و کاتالیزور تحقیق است، نه حل‌کنندهٔ معما؛ فشار و شتاب ایجاد می‌کند اما جواب را به بازیکن نمی‌دهد)',
    lifePoolThreads: [
      { id: 'arian_g_ninjutsu_soreness', topic: 'ninjutsu', summary: 'بعد از تمرین نینجوتسو بدن‌درد دارد و با خنده حرکات کششی انجام می‌دهد.' },
      { id: 'arian_g_zombies_easter_egg', topic: 'black_ops_zombies', summary: 'درباره ایستر اگ یک مرحله Black Ops III Zombies و تطبیقش با معماهای واقعی حرف می‌زند.' },
      { id: 'arian_g_friend_gathering', topic: 'gaming', summary: 'سعی می‌کند بقیه را برای بازی دوستانه جمع کند.' },
    ],
    socialWeakness: 'پیشروی بیش از حد (Overextension) و ناتوانی در دست کشیدن از سرنخ‌ها؛ جلوتر از داده‌ها حرکت می‌کند.',
    reactionToDanger: 'کنجکاوی + تحرک فیزیکی سریع و باز کردن مسیرهای فرار.',
    latentMechanic: {
      name: 'Controlled Intervention (محرک تحقیق و مداخله نینجوتسو / فرار و مهار)',
      description: 'مهار موقت مهاجم، ایجاد مسیر فرار، دنبال کردن افراد از پشت‌بام یا تعقیب فیزیکی سریع برای نجات دوستان بدون حل کردن معمای داستان.',
      triggerPrerequisites: 'Immediate threat to friends (Salar, Mani, Hanieh, Mehri), physical barrier or attacker',
      constraints: 'ابرقهرمان نیست، در برابر سلاح گرم بی‌پناه است و هرگز جواب نهایی معما را اسپویل نمی‌کند.',
    },
    specialStoryHooks: ['Rooftop Pursuit', 'Friend Trigger (فداکاری پرخطر برای دوستان)'],
  },

  aydin: {
    id: 'aydin',
    formalName: 'آیدین گرشاسبی',
    publicCalling: 'آیدین گرشاسبی',
    coreArchetype: 'The Black Card (برادر بزرگ‌تر آرین گرشاسبی؛ بسیار کم‌حضور، مقتدر، دارای زندگی مجزا و کانکشن‌های پرنفوذ — هرگز Deus Ex Machina نیست و معما را حل نمی‌کند؛ پایان مستقل ندارد و فقط به عنوان پیامد پرهزینه در صورت خطر جانی آرین گ. زمان یا مسیر جایگزین می‌خرد)',
    lifePoolThreads: [
      { id: 'aydin_distant_business', topic: 'external_affairs', summary: 'درگیر کارهای پیچیده و جلسات خارج از کافه است و تماس‌های بسیار کوتاه دارد.' },
    ],
    socialWeakness: 'فاصله‌گیری عاطفی و ورود صرفاً به عنوان اهرم فشار پرهزینه.',
    reactionToDanger: 'ارزیابی سرد سطح خطر، ورود ناگهانی و تحمیل بدهی و تعهد سنگین بر پرونده در صورت خطر جانی برای آرین.',
    latentMechanic: {
      name: 'Brother Trigger (ورود ناگهانی و خرید زمان در ازای تعهد سنگین)',
      description: 'ایجاد مسیرهای امن و اعمال نفوذ نامحسوس خارج از کافه؛ حل‌کننده معما نیست بلکه تاوان ایجاد می‌کند.',
      triggerPrerequisites: 'Extreme lethal threat to Arian Gharshasbi',
      constraints: 'پایان مستقل نمی‌سازد؛ فقط به عنوان واریانت/پیامد زیر پایان‌های موجود مدیریت می‌شود.',
    },
    specialStoryHooks: ['Safe Passage Extraction', 'Power Network Warning'],
  },

  yashin: {
    id: 'yashin',
    formalName: 'یاشین شجاعی',
    publicCalling: 'یاشین',
    coreArchetype: 'The Young King (خودانگاره Zeus؛ محاوره‌ای باکلاس با واژگان قوی و پرستیژ بالا؛ شروع با «درود» و طرح سوال چالشی، سپس پاسخ با «خیر.» و ارائه فکت دقیق تخصصی قهوه و تاریخ؛ کنایه‌های شیک در صورت بی‌محلی)',
    lifePoolThreads: [
      { id: 'yashin_yemen_roast_test', topic: 'coffee_roast', summary: 'نمونه رست جدید با اسیدیته میوه‌ای را تست کرده و مشتاق توضیح تخصصی آن است.' },
      { id: 'yashin_coffee_lineage_article', topic: 'coffee_history', summary: 'مقاله‌ای درباره تجارت قدیمی قهوه و خانواده‌های یمنی خوانده و در ذهن دارد.' },
      { id: 'yashin_aroma_focus', topic: 'perfume_aroma', summary: 'روی تداخل بوی عطرهای تند با فضای آروماتیک قهوه‌های بار حساس شده است.' },
      { id: 'yashin_football_regret', topic: 'football_injury', summary: 'با حسرت ملایمی از دوران قبل از آسیب‌دیدگی زانو و بازی فوتبال یاد می‌کند.' },
    ],
    socialWeakness: 'Confident Misinformation — بیان دانستههای نیمه‌مطمئن و شنیده‌ها با اعتمادبه‌نفس بالا خارج از حوزه قهوه.',
    reactionToDanger: 'تلاش برای حفظ پرستیژ و کنترل موقعیت از طریق استدلال و پرسشگری.',
    latentMechanic: {
      name: 'Sensory Coffee Provenance & Anchor Question',
      description: 'تشخیص فوق‌تخصصی دانه‌ها، فرآوری و اصالت قهوه؛ طرح سؤال «شما می‌دونستید...؟» برای هدایت مکالمه.',
      triggerPrerequisites: 'Examine coffee beans, sensory tasting, or barista dialogue',
      constraints: 'در حوزه عمومی ممکن است اطلاعات ناقص را با اعتمادبه‌نفس بگوید؛ این‌ها سرنخ پرونده نیستند.',
    },
    specialStoryHooks: ['Coffee Provenance Inconsistency', 'Zeus Correction Clash with Mani'],
  },

  mani: {
    id: 'mani',
    formalName: 'مانی شجاعی',
    publicCalling: 'مانی',
    coreArchetype: 'The Jester Knight (برادر کوچک‌تر، درشت‌هیکل، والیبالیست، شوخ‌طبع، جویای تایید، حساس به سرکوفت)',
    lifePoolThreads: [
      { id: 'mani_urmia_cafe_arthur', topic: 'urmia_arthur', summary: 'دوران زندگی در ارومیه و باریستایی در کافه آرتور (خیابان استادان) که با غیرت و تعصب و افتخار از آن یاد می‌کند.' },
      { id: 'mani_ratin_memorial', topic: 'ratin_memory', summary: 'یاد رفیق صمیمی و فقیدش راتین در ارومیه که دلیل تصمیم‌های ارزشی و فداکاری‌هایش برای رفقاست.' },
      { id: 'mani_volleyball_passion', topic: 'volleyball', summary: 'تمرین والیبال و شوخ‌طبعی‌های ورزشی دوستانه.' },
      { id: 'mani_latte_art', topic: 'latte_art', summary: 'علاقه به تکنیک‌های لته‌آرت و پذیرایی گرم از مهمانان.' },
    ],
    socialWeakness: 'بردطلبی و واکنش دفاعی/شوخی گزنده در صورت اصلاح شدن یا انتقاد در حضور جمع.',
    reactionToDanger: 'محافظت احساسی و ریسک‌پذیری بالا (Risky Loyalty) برای دوستانش.',
    latentMechanic: {
      name: 'Athletic Utility & Risky Loyalty',
      description: 'قدرت بدنی، پرش و واکنش حرکتی سریع؛ آمادگی برای پذیرش ریسک‌های خارج از منطق در دفاع از دوستان.',
      triggerPrerequisites: 'Physical obstacle, urgent protection of evidence/friend',
      constraints: 'زانویش در تعقیب‌های طولانی محدودیت ایجاد می‌کند؛ مهارت رزمی حرفه‌ای ندارد.',
    },
    specialStoryHooks: [
      'Ratin Memorial History (فقط در فضای گفت‌وگوی عمیق و اعتماد بالا باز می‌شود)',
      'Decoy Maneuver (طعمه شدن خودخواسته برای فراری دادن بقیه)',
    ],
  },

  arian_mehri: {
    id: 'arian_mehri',
    formalName: 'آرین مهری',
    publicCalling: 'آرین مهری',
    coreArchetype: 'The Charming Non-Committal (۱۹ ساله، پنگول، قدبلند، ترک، شوخ‌طبع، آشپز متعهد و به شدت دقیق در کار، اما تعهدگریز در روابط عاطفی و بار احساسی سنگین — مشکل او بی‌مسئولیتی در کار نیست، بلکه فرار از تعهد عاطفی است؛ اما وقتی پای کافه و رفقا در میان باشد، برخلاف الگوی شخصی‌اش می‌ایستد)',
    lifePoolThreads: [
      { id: 'mehri_dating_dilemma', topic: 'dating_chaos', summary: 'درگیر پیام‌های همزمان چند رابطهٔ کوتاه و پیچاندن قرارهای جدی با خنده و طنز است.' },
      { id: 'mehri_deploy_logs', topic: 'devops_deploy', summary: 'از مقایسه لاگ‌های دیسک با صداقت انسان‌ها حرف می‌زند و می‌گوید لاگ‌ها هیچ‌وقت دروغ نمی‌گویند.' },
      { id: 'mehri_kitchen_recipe', topic: 'kitchen_chaos', summary: 'درگیر تست یک سس یا ترکیب غذایی جدید برای آشپزخانه است و نظر می‌خواهد.' },
      { id: 'mehri_commitment_dodge', topic: 'avoidance', summary: 'به محض جدی شدن بار عاطفی موضوع را با شوخی عوض می‌کند اما وظیفه آشپزی را بی‌نقص تحویل می‌دهد.' },
    ],
    socialWeakness: 'فرار از تعهدات عاطفی و درگیری‌های احساسی شدید؛ تلاش برای سبک نگه داشتن روابط شخصی.',
    reactionToDanger: 'در ابتدا شوخی و عقب‌نشینی ظاهری، اما در بحران واقعی کافه، با تحلیل فنی لاگ‌ها پشت دوستانش می‌ایستد.',
    latentMechanic: {
      name: 'Systems Access & Infra Exploitation (با هم‌افزایی Systems Analyst)',
      description: 'نفوذ فنی به لاگ‌ها، متادیتای لینک، آی‌پی‌ها و سرورهای آسیب‌پذیر مرتبط با انجمن.',
      triggerPrerequisites: 'Player has Systems Analyst class/skills, Trust with Mehri, Real access vector clue (WiFi/config/link)',
      constraints: 'کل معما را حل نمی‌کند؛ فقط یک لایه، قطعه لاگ یا تایم‌استمپ می‌دهد و تراز Threat را بالا می‌برد.',
    },
    specialStoryHooks: ['Digital Infrastructure Breach', 'Honeytoken Trap'],
  },

  penti: {
    id: 'penti',
    formalName: 'پنتی',
    publicCalling: 'پنتی',
    coreArchetype: 'The Emotional Pressure Point & Environmental Anchor (بچه‌گربه دوماهه، لنگر عاطفی کل کافه)',
    lifePoolThreads: [
      { id: 'penti_cautious_wandering', topic: 'kitten_mood', summary: 'میان صندلی‌ها نرم راه می‌رود اما از پایه‌های میز ۵ به خاطر بوی مواد شوینده فاصله می‌گیرد.' },
    ],
    socialWeakness: 'آسیب‌پذیری فیزیکی و وابستگی به خانم محمدی.',
    reactionToDanger: 'پنهان شدن در فضاهای تاریک و باریک کافه.',
    latentMechanic: {
      name: 'Controlled Disappearance Arc (فشار روانی بدون خشونت مستقیم)',
      description: 'ابزار اعمال فشار انجمن از طریق ناپدید شدن موقت و ارسال تصویر تهدیدآمیز بدون آسیب مستقیم به حیوان.',
      triggerPrerequisites: 'Threat >= 60, Canonical high-tension arc trigger',
      constraints: 'پنتی زنده و سالم می‌ماند؛ وحشت از نزدیکی دشمن است نه خشونت فیزیکی.',
    },
    specialStoryHooks: ['Controlled Disappearance', 'Acoustic / Visual Rescue Tracking'],
  },
};

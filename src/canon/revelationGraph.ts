import type { ProofDomain } from '../core/types.js';

export interface RevelationAct {
  actId: string;
  nameFa: string;
  summary: string;
  requiredNodes: string[];
  proofDomainFocus: ProofDomain[];
  coreRevelationFactIds: string[];
}

export const REVELATION_GRAPH: RevelationAct[] = [
  {
    actId: 'ACT_0_HOOK',
    nameFa: 'پرده ۰: قلاب اولیه (ورود به کوچه حسینی)',
    summary: 'پیام اضطراری نیمه‌شب سالار، ساعت ۰۰:۱۷، پلاک ۵۵، خروج مرد پالتوپوش با دستکش قرمز و رسید نم‌کشیده روی زمین.',
    requiredNodes: ['NODE_00', 'NODE_01'],
    proofDomainFocus: ['SOCIAL', 'SYS'],
    coreRevelationFactIds: ['fact_time_0017', 'fact_wet_receipt', 'fact_red_glove_man'],
  },
  {
    actId: 'ACT_1_LOCAL_CONTRADICTIONS',
    nameFa: 'پرده ۱: تناقضات محلی صحنه',
    summary: 'تفکیک شاخه‌های تحقیق: فنجان قهوه میز ۵، بوی حلال، ناهماهنگی زمانی دوربین‌ها و اضطراب پرسنل کافه.',
    requiredNodes: ['NODE_02', 'NODE_03', 'NODE_04', 'NODE_05'],
    proofDomainFocus: ['CHEM', 'SYS', 'SOCIAL'],
    coreRevelationFactIds: ['fact_solvent_smell_cup', 'fact_steam_wand_noise_mask', 'fact_table5_active_window'],
  },
  {
    actId: 'ACT_2_CROSS_LINK',
    nameFa: 'پرده ۲: تقاطع مدارک و شواهد',
    summary: 'اتصال دو دامنهٔ اثبات مجزا به یکدیگر: فنجان + خط زمانی = میز ۵ در بازهٔ ۰۰:۱۵ فعال بوده؛ فاکتور + قاب تابلو = دستکاری تعمدی.',
    requiredNodes: ['NODE_06', 'NODE_07', 'NODE_08', 'NODE_09', 'NODE_10'],
    proofDomainFocus: ['ART', 'CHEM', 'SYS'],
    coreRevelationFactIds: ['fact_underpainting_hidden_layer', 'fact_clean_box_swap', 'fact_penti_solvent_reaction'],
  },
  {
    actId: 'ACT_3_FOUR_MARKS',
    nameFa: 'پرده ۳: چهار نشانهٔ مرموز (دست، پنجره، فنجان، سایه)',
    summary: 'کشف الگوی ۴ نماد در فاکتورهای دفتر حسابداری، لاگ‌های دوربین و شواهد فیزیکی کوچه حسینی.',
    requiredNodes: ['NODE_11', 'NODE_12', 'NODE_13', 'NODE_14', 'NODE_15'],
    proofDomainFocus: ['SYS', 'SOCIAL', 'ART', 'FACTION'],
    coreRevelationFactIds: ['fact_invoice_lot55_seal', 'fact_camera_7min_unwritten_gap', 'fact_conflicting_witness_routes'],
  },
  {
    actId: 'ACT_4_LOCAL_SOLUTION',
    nameFa: 'پرده ۴: حل پروندهٔ امشب کافه',
    summary: 'رویارویی با کلکسیونر، بازسازی خط زمانی کامل و اثبات نحوهٔ جابه‌جایی اسناد و هویت خریدار پلاک ۵۵.',
    requiredNodes: ['NODE_16', 'NODE_17'],
    proofDomainFocus: ['SOCIAL', 'SYS', 'ART'],
    coreRevelationFactIds: ['fact_collector_settlement_motive', 'fact_final_timeline_synthesis'],
  },
  {
    actId: 'ACT_5_HISTORICAL_BREACH',
    nameFa: 'پرده ۵: رخنهٔ تاریخی و افشای شبکهٔ دستکش قرمز',
    summary: 'کشف لایهٔ پنهان باستانی پشت سند کارگاه فلورانسی؛ پروندهٔ محلی بسته می‌شود اما معمای بزرگ‌تر شبکهٔ تاریخی باز می‌گردد.',
    requiredNodes: ['NODE_18'],
    proofDomainFocus: ['FACTION', 'ART'],
    coreRevelationFactIds: ['fact_florence_historical_breach', 'fact_meta_red_glove_unresolved'],
  },
];

export function getActForNode(nodeId: string): RevelationAct {
  for (const act of REVELATION_GRAPH) {
    if (act.requiredNodes.includes(nodeId)) {
      return act;
    }
  }
  return REVELATION_GRAPH[0];
}

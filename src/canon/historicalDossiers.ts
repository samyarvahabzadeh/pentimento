import type { HistoricalDossier } from '../core/types.js';

export const HISTORICAL_DOSSIERS: Record<string, HistoricalDossier> = {
  leonardo: {
    id: 'leonardo',
    name: 'Leonardo da Vinci (1452–1519)',
    verifiedHistory: [
      {
        id: 'hist_leo_verrocchio',
        dateOrEra: '1466–1476',
        location: 'Florence',
        fact: 'شاگردی در کارگاه آندرئا دل وروکیو و تسلط بر تکنیک‌های شیمی رنگ و طراحی مقدماتی.',
        source: 'Vasari, Lives of the Artists',
      },
      {
        id: 'hist_leo_underdrawing',
        dateOrEra: '1481',
        location: 'Florence',
        fact: 'استفاده از لایه‌بندی‌های زیرین (Pentimento) در آثاری چون نیایش مغان (Adoration of the Magi).',
        source: 'Uffizi Gallery Technical Analysis',
      },
      {
        id: 'hist_leo_mirror_script',
        dateOrEra: '1482–1499',
        location: 'Milan',
        fact: 'نگارش یادداشت‌ها به خط آینه‌ای و استفاده از نشانه‌ها و رمزبندی‌های شخصی در دفاتر دست‌نویس.',
        source: 'Codex Atlanticus',
      },
    ],
    fictionalOverlay: [
      {
        id: 'fict_leo_courier_mark',
        historicalAnchorId: 'hist_leo_verrocchio',
        narrativeOverlay: 'یک نشان کارگاهی واسطه که قرابت ساختاری با موتیف دستکش دارد در حاشیهٔ صورت‌جلسهٔ خرید رنگ فلورانسی دیده می‌شود.',
        symbolMotifs: ['hand', 'shadow'],
        loreStageRequired: 2,
      },
      {
        id: 'fict_leo_sketch_grammar',
        historicalAnchorId: 'hist_leo_underdrawing',
        narrativeOverlay: 'بررسی لایه‌های زیرین قاب نشان می‌دهد که چینش چهار علامت در نسخهٔ اولیه بوم با الگوی تناسبات کارگاه فلورانسی هم‌پوشانی دارد.',
        symbolMotifs: ['hand', 'window', 'cup', 'shadow'],
        loreStageRequired: 3,
      },
    ],
    rumors: [
      'شایعهٔ عضویت لئوناردو در انجمن‌های مخفی رنسانس (در حد تئوری‌های اثبات‌نشدهٔ عامه‌پسند باقی می‌ماند).',
    ],
    forbiddenClaims: [
      'لئوناردو داوینچی رسماً عضو فرقهٔ دستکش قرمز بوده است.',
      'داوینچی بنیان‌گذار این شبکه بوده است.',
      'پروندهٔ امشب مستقیماً توسط شخص داوینچی طراحی شده است.',
    ],
  },

  michelangelo: {
    id: 'michelangelo',
    name: 'Michelangelo Buonarroti (1475–1564)',
    verifiedHistory: [
      {
        id: 'hist_mich_ghirlandaio',
        dateOrEra: '1488',
        location: 'Florence',
        fact: 'کارآموزی نزد دومنیکو گیرلاندایو و آشنایی با فرسکو و لایه‌های گچ‌کاری دیواری.',
        source: 'Condivi, Life of Michelangelo',
      },
      {
        id: 'hist_mich_rivalry',
        dateOrEra: '1504',
        location: 'Florence',
        fact: 'رقابت هنری با لئوناردو داوینچی در نقاشی‌های تالار پانصد نفره (Salone dei Cinquecento).',
        source: 'Florentine State Archives',
      },
    ],
    fictionalOverlay: [
      {
        id: 'fict_mich_plaster_cover',
        historicalAnchorId: 'hist_mich_rivalry',
        narrativeOverlay: 'در یادداشت‌های یک متولی اموال مدیچی، اشاره شده که پوشاندن تعمدی برخی نمادها روی دیواره‌ها برای ممانعت از کشف نشانه‌های واسطه صورت گرفته است.',
        symbolMotifs: ['window', 'shadow'],
        loreStageRequired: 2,
      },
    ],
    rumors: [
      'شایعهٔ نزاع دو هنرمند بر سر دسترسی به یک سند مرموز باستانی.',
    ],
    forbiddenClaims: [
      'میکل‌آنژ عضو یا هم‌پیمان سازمان دستکش قرمز بوده است.',
      'میکل‌آنژ برای محافظت از شبکه دست به سانسور زده است.',
    ],
  },
};

export function getDossier(id: 'leonardo' | 'michelangelo'): HistoricalDossier {
  return HISTORICAL_DOSSIERS[id];
}

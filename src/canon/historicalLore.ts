/**
 * Pentimento — Historical Dossier & Lore Matrix
 * Verified historical facts paired with strictly delineated fictional overlays.
 */

export interface HistoricalFigureDossier {
  id: string;
  name: string;
  period: string;
  location: string;
  verifiedHistory: string;
  fictionalOverlay: string;
  allowedRevelations: string[];
  forbiddenClaims: string[];
  sourceNotes: string;
}

export const FLORENCE_WORKSHOP_DOSSIER: HistoricalFigureDossier = {
  id: 'florence_1481_underpainting',
  name: 'کارگاه فلورانس و تکنیک لایه‌پوشانی (Pentimento)',
  period: '1481–1504 میلادی',
  location: 'فلورانس، توسکانی (ایتالیا)',
  verifiedHistory: `در اواخر سدهٔ پانزدهم، هنرمندان فلورانسی مانند لئوناردو داوینچی و کارگاه وروکیو از زیرسازی‌های چندلایه با روغن گردو، دوده و چسب استخوان استفاده می‌کردند. در آثاری چون «ستایش مغان» (۱۴۸۱)، لایه‌های زیرین متعددی از طرح‌های اولیه زیر رنگ قهوه‌ای پنهان ماندند که در اصطلاح مرمت «پنتیمنتو» (ندامت/تغییر نظر هنرمند) نامیده می‌شوند.`,
  fictionalOverlay: `یک شبکهٔ غیررسمی از مرمت‌کاران و حامیان هنر در ایتالیا، از تکنیک لایه‌پوشانی برای ثبت اسناد مالکیتی، مهرهای صنفی کارگاهی و مسیرهای انتقال آثار به دور از چشم تفتیش عقاید استفاده می‌کردند. نشان چهارگانهٔ کارگاهی (دست، پنجره، فنجان، سایه) به عنوان رمز اصالت اسناد محرمانه در لایهٔ زیرین بوم‌ها الصاق می‌شد.`,
  allowedRevelations: [
    'تکنیک حلال استفاده‌شده روی فنجان، ریشه در فرمول‌های مرمت لایه‌های روغنی سده‌های ۱۵ و ۱۶ دارد.',
    'برچسب پشت تابلو با شماره‌های ۱۴-۳-۷ ارجاع به یک کاتالوگ کارگاهی کهن دارد.',
    'مهر چهارگوشه فاکتور شماره ۵۵ با سربرگ آر.جی با نشان‌های کارگاهی تاریخی انطباق دارد.',
  ],
  forbiddenClaims: [
    'لئوناردو داوینچی یا میکل‌آنژ فرقهٔ شیطانی یا جادویی تأسیس کرده‌اند (ممنوع - کاملاً غیرعلمی).',
    'دستکش قرمز یک نیروی ماوراءالطبیعه است (ممنوع - یک نماد تشکیلاتی انسانی و زمینی است).',
    'کل تاریخ هنر یک دروغ یکدست بوده است (ممنوع - فقط یک رخنهٔ اسنادی تاریخی کشف شده است).',
  ],
  sourceNotes: 'بر اساس بررسی‌های فنی کارگاه‌های رنسانس و مطالعات رادیوگرافی و مادون‌قرمز تابلوی Adoration of the Magi (موریتسیو سراچینی، ۲۰۰۲).',
};

export const HISTORICAL_DOSSIERS = [FLORENCE_WORKSHOP_DOSSIER];

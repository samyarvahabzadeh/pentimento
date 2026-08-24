import type { PlayerClassId, ProofDomain } from '../core/types.js';

export interface RoleProfile {
  id: PlayerClassId;
  nameFa: string;
  fantasy: string;
  primaryProofDomain: ProofDomain;
  secondaryProofDomain?: ProofDomain;
  mechanicalAdvantages: string[];
  exclusiveBeatIds: string[];
  naturalWeakness: string;
}

export const ROLE_PROFILES: Record<PlayerClassId, RoleProfile> = {
  art_historian: {
    id: 'art_historian',
    nameFa: 'مورخ هنری',
    fantasy: 'چیزی را می‌بینم که دیگران فقط نگاهش می‌کنند.',
    primaryProofDomain: 'ART',
    secondaryProofDomain: 'FACTION',
    mechanicalAdvantages: [
      'کشف سریع‌تر لایه‌های زیرین بوم و دستکاری رنگ (Underpainting)',
      'تشخیص زودهنگام تناقض در شجره‌نامه و فاکتورهای تابلو (Provenance)',
      'فعال‌شدن پیوندهای تاریخی هنگام مشاهده نشانه‌های باستانی (Symbol Grammar)',
    ],
    exclusiveBeatIds: [
      'beat_art_underpainting_hidden_layer',
      'beat_art_workshop_vs_artist_mark',
      'beat_art_early_provenance_reconstruction',
      'beat_art_florence_workshop_anomaly',
    ],
    naturalWeakness: 'در صورت نتیجه‌گیری زودهنگام، برای کاراکترهای عمل‌گرا مثل مانی مانند یک داستان‌باف به نظر می‌رسد.',
  },

  coffee_alchemist: {
    id: 'coffee_alchemist',
    nameFa: 'کیمیاگر قهوه',
    fantasy: 'اتاق برای من بو و دما و residue دارد؛ نه فقط دیالوگ.',
    primaryProofDomain: 'CHEM',
    secondaryProofDomain: 'ART',
    mechanicalAdvantages: [
      'شناسایی فوری بوها، بقایای شیمیایی، حلال‌ها و دمای سطوح',
      'تشخیص خطرات تنفسی و آلودگی‌های مایعات بدون نیاز به تجهیزات آزمایشگاهی',
      'ردیابی مسیر فیزیکی جابه‌جایی اشیاء از روی لکه و اثر انگشت روغنی',
    ],
    exclusiveBeatIds: [
      'beat_chem_detergent_vs_cup_solvent',
      'beat_chem_residue_warehouse_link',
      'beat_chem_foreign_contamination_proof',
      'beat_chem_solvent_layer_breach',
    ],
    naturalWeakness: 'شواهد اداری و اسناد دیجیتال به طور مستقیم برای این لنز قابل خوانش فنی نیستند.',
  },

  systems_analyst: {
    id: 'systems_analyst',
    nameFa: 'تحلیل‌گر سیستم‌ها',
    fantasy: 'آدم‌ها دروغ می‌گویند؛ timestampها سخت‌تر.',
    primaryProofDomain: 'SYS',
    secondaryProofDomain: 'FACTION',
    mechanicalAdvantages: [
      'تشخیص ناهماهنگی بین ساعت دستگاه پوز، دوربین مداربسته و فیش سفارش',
      'تبدیل فقدان داده لاگ به مدرک قطعی دستکاری هدفمند (Absence of Write Event)',
      'ترسیم بازه زمانی جابه‌جایی بدون نیاز به اعترافات شفاهی شاهدان',
    ],
    exclusiveBeatIds: [
      'beat_sys_pos_camera_clock_drift',
      'beat_sys_unwritten_audit_gap',
      'beat_sys_direct_timeline_proof',
      'beat_sys_impossible_continuity_breach',
    ],
    naturalWeakness: 'برخورد سرد و ریاضی‌وار با شاهدان ممکن است اعتماد اجتماعی را کاهش دهد.',
  },

  investigator: {
    id: 'investigator',
    nameFa: 'کارآگاه اجتماعی',
    fantasy: 'قبل از اینکه مدرک حرف بزند، آدم‌ها حرف می‌زنند.',
    primaryProofDomain: 'SOCIAL',
    secondaryProofDomain: 'SYS',
    mechanicalAdvantages: [
      'رویت زبان بدن، اضطراب‌های پنهان و الگوهای دروغ‌گویی شاهدان',
      'اجرای دوئل‌های کلامی، مانورهای سنجیده و بلوف‌های کنترل‌شده',
      'استخراج ناگفته‌ها در لحظات فشار یا اعتماد حداکثری',
    ],
    exclusiveBeatIds: [
      'beat_social_confront_without_accusing',
      'beat_social_controlled_bluff_leak',
      'beat_social_trust_confession_bridge',
      'beat_social_collector_mask_crack',
    ],
    naturalWeakness: 'اتهام بدون مدرک هزینه اجتماعی سنگین‌تری نسبت به سایر نقش‌ها دارد.',
  },

  observer: {
    id: 'observer',
    nameFa: 'ناظر بی‌طرف',
    fantasy: 'همه چیز را با نگاهی متعادل و بدون پیش‌فرض بررسی می‌کنم.',
    primaryProofDomain: 'SOCIAL',
    mechanicalAdvantages: ['رویکرد خنثی در تعاملات'],
    exclusiveBeatIds: [],
    naturalWeakness: 'فاقد مزایای شتاب‌دهنده اختصاصی.',
  },
};

export function getRoleProfile(roleId: PlayerClassId): RoleProfile {
  return ROLE_PROFILES[roleId] || ROLE_PROFILES.art_historian;
}

import type { LoopEcho } from '../core/types.js';

export const LOOP_ECHOES: Record<string, LoopEcho> = {
  ECHO_AFTER_ABANDON: {
    id: 'ECHO_AFTER_ABANDON',
    sourceEnding: 'BAD_ENDING_ABANDONMENT_ARSON',
    hint: 'در خبر صبحگاهی حادثه، متوجه شدی آتش از راهروی انبار و پشت کانتر شروع شده بود. در لوپ جدید حس عجیبی نسبت به آن گوشه داری.',
    unlocksCandidateIds: ['inspect_service_corridor_early', 'check_rear_exit_early'],
    maxUses: 1,
  },
  ECHO_TOXIC_SHOCK: {
    id: 'ECHO_TOXIC_SHOCK',
    sourceEnding: 'BAD_ENDING_TOXIC_SHOCK',
    hint: 'سوزش تلخ در مجاری تنفسی یادت می‌آورد که بوی فنجان ناشی از شویندهٔ معمولی نبوده، بلکه یک حلال صنعتی فرّار است.',
    unlocksCandidateIds: ['detect_industrial_solvent_early'],
    maxUses: 1,
  },
  ECHO_CHASE_ABDUCTION: {
    id: 'ECHO_CHASE_ABDUCTION',
    sourceEnding: 'BAD_ENDING_SYNDICATE_ABDUCTION',
    hint: 'تصویر گنگ قبل از تاریکی نشان داد خودروی کمین‌کرده در کوچه حسینی دقیقاً در انتظار خروج مدارک از در پشتی بود.',
    unlocksCandidateIds: ['observe_rear_alley_ambush_early'],
    maxUses: 1,
  },
  ECHO_FALSE_ACCUSATION: {
    id: 'ECHO_FALSE_ACCUSATION',
    sourceEnding: 'BAD_ENDING_INTERNAL_BETRAYAL',
    hint: 'یادت می‌آید که اتهام نابجا به مانی دفاع او را بالا برد؛ اما اشارهٔ محترمانه به یاد دوستش راتین می‌تواند قفل سکوتش را باز کند.',
    unlocksCandidateIds: ['approach_mani_with_ratin_respect'],
    maxUses: 1,
  },
  ECHO_VIOLENCE_SHUTDOWN: {
    id: 'ECHO_VIOLENCE_SHUTDOWN',
    sourceEnding: 'BAD_ENDING_POLICE_SHUTDOWN',
    hint: 'در هنگام پلمب کافه، دیدی که کلید دفتر مدیریت فقط در اختیار یاشین و خود سالار است.',
    unlocksCandidateIds: ['ask_yashin_about_office_key'],
    maxUses: 1,
  },
};

export function getLoopEcho(echoId: string): LoopEcho | undefined {
  return LOOP_ECHOES[echoId];
}

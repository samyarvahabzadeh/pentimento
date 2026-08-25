import { Bot, webhookCallback, InputFile } from 'grammy';
import * as dotenv from 'dotenv';
import * as http from 'node:http';
dotenv.config();

import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import {
  getRunByTelegramUser,
  saveRun,
  deleteRunsByTelegramUser,
  resetAllRuns,
  isAccessGranted,
  grantAccess,
  revokeAccess,
} from '../storage/db.js';
import { ROLE_SELECTION_PROMPT } from '../canon/node00.js';
import { getCoverPath, getPendingMediaForTurn } from './mediaDispatcher.js';
import { createInitialRunState } from '../core/initialState.js';
import type { RunState } from '../core/types.js';
import { computeBuildAttestation } from '../core/buildAttestation.js';
import {
  AccessAttemptLimiter,
  readAccessPasswordConfig,
  verifyAccessPassword,
} from './accessControl.js';
import { buildPlayerHelp, buildRecapPanel, buildWherePanel } from './playerPanel.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('[Bot] TELEGRAM_BOT_TOKEN not set.');
  process.exit(1);
}

const bot = new Bot(token);
const transport = createTransport();
const buildAttestation = computeBuildAttestation();
const accessPasswordConfig = readAccessPasswordConfig();
const accessAttemptLimiter = new AccessAttemptLimiter();

const adminUserIds = new Set(
  (process.env.PENTIMENTO_ADMIN_USER_IDS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const adminUsernames = new Set(
  (process.env.PENTIMENTO_ADMIN_USERNAMES ?? '')
    .split(',')
    .map(value => value.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean)
);

function isAdminContext(ctx: any): boolean {
  const id = ctx.from?.id?.toString();
  const username = ctx.from?.username?.toLowerCase();
  return Boolean(
    (id && adminUserIds.has(id)) ||
    (username && adminUsernames.has(username))
  );
}

console.log(`[Bot] Active provider: ${process.env.ACTIVE_PROVIDER ?? 'gemini'}`);
console.log(`[Bot] Runtime build fingerprint: ${buildAttestation.fingerprint}`);
console.log(`[Bot] Private alpha access gate: ${accessPasswordConfig.active ? 'ACTIVE' : 'MISCONFIGURED'}`);

// Per-user debug mode toggle
const userDebugModes = new Map<number, boolean>();

// Per-user turn lock
const userTurnLocks = new Map<string, Promise<void>>();

function createNewState(): RunState {
  return createInitialRunState();
}

/** Helper for resilient message sending (falls back to plain text if Markdown fails) */
async function safeReply(ctx: any, text: string, options: any = {}) {
  try {
    return await ctx.reply(text, options);
  } catch (err: any) {
    console.warn('[Bot] Reply with options failed, falling back to plain text:', err.message);
    const plainOptions = { ...options };
    delete plainOptions.parse_mode;
    return await ctx.reply(text, plainOptions);
  }
}

/** Canonical intro message: three-line dialogue + role selection menu. */
function buildIntroMessage(): string {
  return ROLE_SELECTION_PROMPT;
}

function isAuthorizedContext(ctx: any): boolean {
  if (isAdminContext(ctx)) return true;
  const userId = ctx.from?.id?.toString();
  return Boolean(
    userId &&
    accessPasswordConfig.active &&
    accessPasswordConfig.fingerprint &&
    isAccessGranted(userId, accessPasswordConfig.fingerprint)
  );
}

async function sendAccessPrompt(ctx: any): Promise<void> {
  if (!accessPasswordConfig.active) {
    await ctx.reply('ورود آزمایشی موقتاً بسته است؛ رمز دسترسی روی سرور درست پیکربندی نشده. مدیر پروژه باید تنظیم PENTIMENTO_ACCESS_PASSWORD را بررسی کند.');
    return;
  }
  await ctx.reply('🔐 این نسخه خصوصی است. رمز آزمایش را همین‌جا در یک پیام جدا بفرست. پیام رمز تا حد امکان بعد از بررسی پاک می‌شود.');
}

async function ensureAuthorized(ctx: any): Promise<boolean> {
  if (isAuthorizedContext(ctx)) return true;
  await sendAccessPrompt(ctx);
  return false;
}

async function sendCover(ctx: any, caption?: string): Promise<void> {
  const cover = getCoverPath();
  if (!cover) return;
  try {
    await ctx.replyWithPhoto(new InputFile(cover), caption ? { caption } : undefined);
  } catch (e: any) {
    console.error('[Bot] Error sending cover photo:', e.message);
  }
}

async function beginFreshRun(ctx: any, userId: string, restarted = false): Promise<void> {
  deleteRunsByTelegramUser(userId);
  const state = createNewState();
  saveRun(state.canonical.runId, userId, state);
  await sendCover(ctx, restarted ? '🔄 ماجرا بازنشانی شد.' : undefined);
  await safeReply(ctx, buildIntroMessage(), { parse_mode: 'Markdown' });
}

async function resumeOrBeginRun(ctx: any, userId: string): Promise<void> {
  const record = getRunByTelegramUser(userId);
  if (!record) {
    await beginFreshRun(ctx, userId);
    return;
  }
  if (record.state.canonical.currentNode === 'NODE_00') {
    await safeReply(ctx, buildIntroMessage(), { parse_mode: 'Markdown' });
    return;
  }
  await ctx.reply(`اجرای ذخیره‌شده‌ات ادامه دارد.\n\n${buildRecapPanel(record.state)}`);
}

// Global logger middleware
bot.use(async (ctx, next) => {
  const messageText = ctx.message?.text;
  const updateKind = messageText?.startsWith('/')
    ? `command:${messageText.split(/\s+/, 1)[0]}`
    : messageText
      ? `text:length=${Array.from(messageText).length}`
      : ctx.callbackQuery?.data
        ? 'callback'
        : 'media/action';
  console.log(`[Bot] Incoming update (${ctx.from?.id}): ${updateKind}`);
  await next();
});

// ─── /start ────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  console.log(`[Bot] Handling /start for user ${userId}`);
  if (!(await ensureAuthorized(ctx))) return;
  await resumeOrBeginRun(ctx, userId);
});

// ─── /restart ──────────────────────────────────────────────────────
bot.command('restart', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;
  if (!(await ensureAuthorized(ctx))) return;

  console.log(`[Bot] Handling /restart for user ${userId}`);
  await beginFreshRun(ctx, userId, true);
});

// ─── Player-facing control panel (never consumes story time) ─────
bot.command('continue', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId || !(await ensureAuthorized(ctx))) return;
  await resumeOrBeginRun(ctx, userId);
});

bot.command('where', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId || !(await ensureAuthorized(ctx))) return;
  const record = getRunByTelegramUser(userId);
  if (!record) {
    await ctx.reply('هنوز اجرایی نداری. /continue را بزن تا ماجرا شروع شود.');
    return;
  }
  await ctx.reply(buildWherePanel(record.state));
});

bot.command('recap', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId || !(await ensureAuthorized(ctx))) return;
  const record = getRunByTelegramUser(userId);
  if (!record) {
    await ctx.reply('هنوز اجرایی نداری. /continue را بزن تا ماجرا شروع شود.');
    return;
  }
  await ctx.reply(buildRecapPanel(record.state));
});

bot.command('help', async (ctx) => {
  if (!(await ensureAuthorized(ctx))) return;
  await ctx.reply(buildPlayerHelp());
});

bot.command('logout', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;
  revokeAccess(userId);
  if (ctx.from?.id) userDebugModes.delete(ctx.from.id);
  await ctx.reply(isAdminContext(ctx)
    ? 'حساب مدیر از قفل آزمایش عبور می‌کند؛ اجرای داستانت دست‌نخورده باقی ماند.'
    : '🔒 دسترسی این حساب بسته شد. اجرای داستانت پاک نشده؛ برای بازگشت /start را بزن و رمز را دوباره بفرست.');
});

// ─── /debug_version ────────────────────────────────────────────────
bot.command('debug_version', async (ctx) => {
  if (!isAdminContext(ctx)) {
    await ctx.reply('این فرمان فقط برای مدیر پیکربندی‌شده فعال است.');
    return;
  }
  const info = [
    `📦 *Pentimento Engine Build Manifest*`,
    `• *Build ID:* \`pentimento-private-character-alpha-20260825\``,
    `• *Story Schema Version:* \`v2.11.0-private-character-alpha\``,
    `• *Runtime SHA256:* \`${buildAttestation.fingerprint}\``,
    `• *Attested Files:* \`${buildAttestation.fileCount}\``,
    `• *Private Alpha Gate:* \`${accessPasswordConfig.active ? 'ACTIVE' : 'MISCONFIGURED'}\``,
    `• *Player Panel:* \`START/CONTINUE/WHERE/RECAP/HELP/RESTART/LOGOUT\``,
    `• *Generic Dispatch:* \`SCENE_GROUNDED\``,
    `• *Conversational Contract:* \`TOPIC MEMORY / COMPOSITE IDENTITY / REPORTED SPEECH\``,
    `• *Spatial Continuity:* \`SCENE-BOUND NPC / DOOR STATE / CALL LOCATION\``,
    `• *Evidence Gating:* \`LAYERED / NO REWARD FARMING\``,
    `• *NPC Knowledge Cards:* \`ACTIVE\``,
    `• *Yashin Character DNA:* \`EXECUTABLE / COFFEE-RELIABLE / FIFA-BOAST / KHEIR-CORRECTION\``,
    `• *Authored NPC Intent:* \`QUESTION TOPIC / CLAIM MEMORY / STRATEGIC DISCLOSURE\``,
    `• *Situation Fronts:* \`3 ACTIVE / FAIL-FORWARD\``,
    `• *Clue Structure:* \`CONSTELLATIONS / NON-LINEAR\``,
    `• *Persistent Commitments:* \`COURIER REPORT / FRONT ECHO / CRISIS\``,
    `• *Agency Validator:* \`ACTIVE\``,
    `• *Canon Injection Guard:* \`ACTIVE\``,
  ].join('\n');
  await safeReply(ctx, info, { parse_mode: 'Markdown' });
});

// ─── /whoami (safe identity helper for admin configuration) ──────
bot.command('whoami', async (ctx) => {
  const id = ctx.from?.id?.toString() ?? 'unknown';
  const username = ctx.from?.username ? `@${ctx.from.username}` : 'none';
  await ctx.reply(`Telegram user ID: ${id}\nUsername: ${username}`);
});

// ─── /reset_all (Admin Reset) ──────────────────────────────────────
bot.command('reset_all', async (ctx) => {
  if (!isAdminContext(ctx)) {
    await ctx.reply('این فرمان فقط برای مدیر پیکربندی‌شده فعال است.');
    return;
  }
  resetAllRuns();
  await safeReply(ctx, '🧹 *تمام پروفایل‌های فعال و حافظه تمام بازیکنان با موفقیت ریست شد.*', { parse_mode: 'Markdown' });
});

// ─── /debug ────────────────────────────────────────────────────────
bot.command('debug', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  if (!isAdminContext(ctx)) {
    await ctx.reply('حالت ممیزی فقط برای مدیر پیکربندی‌شده فعال است.');
    return;
  }
  const current = userDebugModes.get(userId) ?? false;
  userDebugModes.set(userId, !current);
  await ctx.reply(`Debug mode: ${!current ? 'ON 🔍' : 'OFF'}`);
});

// ─── /audit_last_turn (actual persisted state delta, not prose) ──
bot.command('audit_last_turn', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;
  if (!isAdminContext(ctx)) {
    await ctx.reply('این فرمان فقط برای مدیر پیکربندی‌شده فعال است.');
    return;
  }

  const record = getRunByTelegramUser(userId);
  const trace = record?.state.lastTurnTrace;
  if (!trace) {
    await ctx.reply('برای این اجرا هنوز trace قابل‌ممیزی ثبت نشده است.');
    return;
  }

  await ctx.reply(JSON.stringify({
    runtimeSha256: buildAttestation.fingerprint,
    turn: record?.state.scene.turn,
    trace,
  }, null, 2));
});

// ─── /state ────────────────────────────────────────────────────────
bot.command('state', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;
  if (!isAdminContext(ctx)) {
    await ctx.reply('این فرمان فقط برای مدیر پیکربندی‌شده فعال است. برای وضعیت بازیکن از /recap یا /where استفاده کن.');
    return;
  }

  const record = getRunByTelegramUser(userId);
  if (!record) {
    await ctx.reply('No active run. Use /start.');
    return;
  }

  const { canonical, scene } = record.state;
  const summary = [
    `Node: ${canonical.currentNode}`,
    `Turn: ${scene.turn}`,
    `Stress: ${canonical.stress}/100`,
    `Threat: ${canonical.threat}/100`,
    `Evidence: ${canonical.evidenceIds.length > 0 ? canonical.evidenceIds.join(', ') : 'none'}`,
    `Flags: ${canonical.canonicalFlags.length > 0 ? canonical.canonicalFlags.join(', ') : 'none'}`,
    `Entities: ${scene.activeEntityIds.join(', ')}`,
  ].join('\n');

  await safeReply(ctx, `\`\`\`\n${summary}\n\`\`\``, { parse_mode: 'Markdown' });
});

async function handleAccessCandidate(ctx: any, userId: string, candidate: string): Promise<void> {
  // Passwords must never remain in application logs. Telegram deletion is
  // best-effort because private-chat permissions can vary by platform policy.
  await ctx.deleteMessage().catch(() => {});

  if (!accessPasswordConfig.active || !accessPasswordConfig.normalizedPassword || !accessPasswordConfig.fingerprint) {
    await sendAccessPrompt(ctx);
    return;
  }

  const beforeAttempt = accessAttemptLimiter.status(userId);
  if (!beforeAttempt.allowed) {
    const minutes = Math.max(1, Math.ceil(beforeAttempt.retryAfterSeconds / 60));
    await ctx.reply(`تلاش‌های ناموفق زیاد بوده. حدود ${minutes} دقیقه بعد دوباره امتحان کن.`);
    return;
  }

  if (verifyAccessPassword(candidate, accessPasswordConfig.normalizedPassword)) {
    accessAttemptLimiter.recordSuccess(userId);
    grantAccess(userId, accessPasswordConfig.fingerprint);
    await ctx.reply('✅ دسترسی فعال شد. بازی هر نفر جدا ذخیره می‌شود و می‌توانی هر کاری را به زبان خودت انجام بدهی.');
    await resumeOrBeginRun(ctx, userId);
    return;
  }

  const afterFailure = accessAttemptLimiter.recordFailure(userId);
  if (!afterFailure.allowed) {
    await ctx.reply('رمز درست نبود. برای محافظت از نسخهٔ خصوصی، ورود تا ۱۵ دقیقه موقتاً بسته شد.');
    return;
  }
  await ctx.reply(`رمز درست نبود. ${afterFailure.remainingAttempts} تلاش دیگر پیش از توقف موقت باقی مانده است.`);
}

// ─── Text messages -> resolvePlayerTurn ──────────────────────────
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Skip commands
  if (ctx.message.text.startsWith('/')) return;

  const userIdStr = userId.toString();
  if (!isAuthorizedContext(ctx)) {
    await handleAccessCandidate(ctx, userIdStr, ctx.message.text);
    return;
  }

  // Enqueue per-user turn to avoid race conditions
  const currentLock = userTurnLocks.get(userIdStr) ?? Promise.resolve();
  const nextLock = currentLock
    .then(async () => {
      let record = getRunByTelegramUser(userIdStr);
      if (!record) {
        const state = createNewState();
        saveRun(state.canonical.runId, userIdStr, state);
        record = { runId: state.canonical.runId, state };
      }


      await ctx.replyWithChatAction('typing').catch(() => {});

      try {
        const result = await resolvePlayerTurn(record.state, ctx.message.text, transport);
        saveRun(record.runId, userIdStr, result.stateAfter);

        let reply = result.narrative;

        if (userDebugModes.get(userId)) {
          const dbg = (result as any)._debugInfo ?? {};
          const trace = dbg.trace ?? result.stateAfter.lastTurnTrace;
          const effects = result.validation.acceptedSoftEffects;
          const efStr = effects.length > 0
            ? effects.map((e: any) => `${e.kind}${e.delta > 0 ? '+' : ''}${e.delta}`).join(', ')
            : 'none';

          reply += [
            '',
            '```',
            `src: ${result.source}`,
            `prv: ${dbg.provider ?? '?'} | mdl: ${(dbg.model ?? '?').split('/').pop()}`,
            `lat: ${dbg.latency ?? 0}ms`,
            `int: ${result.interpretation.kind}->${result.interpretation.targetId ?? '-'}`,
            `act: ${result.validation.acceptedActionId ?? 'none'}`,
            `eff: ${efStr}`,
            `path: ${trace?.resolutionPath ?? '?'}`,
            `scene: ${trace?.sceneBefore ?? '?'}->${trace?.sceneAfter ?? '?'}`,
            `evidence+: ${(trace?.evidenceAdded ?? []).join(',') || 'none'}`,
            `proofΔ: ${JSON.stringify(trace?.proofDelta ?? {})}`,
            `build: ${buildAttestation.fingerprint.slice(0, 16)}`,
            `s/t: ${result.stateBefore.canonical.stress}->${result.stateAfter.canonical.stress} / ${result.stateBefore.canonical.threat}->${result.stateAfter.canonical.threat}`,
            '```',
          ].join('\n');
        }

        const isRoleSelection = record.state.canonical.currentNode === 'NODE_00';

        // Check if any milestone media should be shown
        const media = getPendingMediaForTurn(
          record.state,
          result.stateAfter,
          result.validation.acceptedActionId
        );

        if (media) {
          saveRun(record.runId, userIdStr, result.stateAfter);
          try {
            await ctx.replyWithPhoto(new InputFile(media.mediaPath));
          } catch (e: any) {
            console.error('[Bot] Error sending turn photo:', e.message);
          }
        }

        await safeReply(ctx, reply, {
          parse_mode: userDebugModes.get(userId) ? 'Markdown' : undefined,
          reply_markup: isRoleSelection ? { remove_keyboard: true } : undefined,
        });

      } catch (err: any) {
        console.error('[Bot] Error processing turn:', err.message);
        await ctx.reply('خطایی رخ داد. دوباره تلاش کنید.');
      }
    })
    .catch((err) => {
      console.error('[Bot] Lock chain error:', err);
    });

  userTurnLocks.set(userIdStr, nextLock);
  await nextLock;
});

// ─── Error handler ────────────────────────────────────────────────
bot.catch((err) => {
  console.error('[Bot] Uncaught error:', err.message);
});

async function configurePlayerCommands(): Promise<void> {
  await bot.api.setMyCommands([
    { command: 'start', description: 'ورود یا ادامهٔ اجرای ذخیره‌شده' },
    { command: 'continue', description: 'ادامهٔ ماجرا بدون پاک شدن پیشرفت' },
    { command: 'where', description: 'دیدن موقعیت فعلی بدون گذشت زمان' },
    { command: 'recap', description: 'یادآوری یافته‌ها و وضعیت فعلی' },
    { command: 'help', description: 'راهنمای بازی آزاد' },
    { command: 'restart', description: 'پاک کردن اجرا و شروع دوباره' },
    { command: 'logout', description: 'بستن دسترسی، بدون پاک کردن اجرا' },
  ]);
  console.log('[Bot] Player-facing Telegram commands configured.');
}


// ── HTTP Health Check & Webhook Server ──
const PORT = process.env.PORT || 3000;
const isRender = !!process.env.RENDER;
const webhookPath = '/webhook';

let webhookCallbackHandler: any = null;
if (isRender) {
  webhookCallbackHandler = webhookCallback(bot, 'http');
}

const server = http.createServer(async (req, res) => {
  if (isRender && req.method === 'POST' && req.url === webhookPath && webhookCallbackHandler) {
    try {
      return await webhookCallbackHandler(req, res);
    } catch (e: any) {
      console.error('[Bot] Webhook error:', e.message);
      res.writeHead(500);
      return res.end();
    }
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Pentimento Telegram Bot is running live.');
});

server.listen(PORT, async () => {
  console.log(`[Bot] HTTP Server listening on port ${PORT}`);
  try {
    await configurePlayerCommands();
  } catch (e: any) {
    console.error('[Bot] Failed to configure player commands:', e.message);
  }
  
  if (isRender) {
    const webhookUrl = process.env.RENDER_EXTERNAL_URL 
      ? `${process.env.RENDER_EXTERNAL_URL}${webhookPath}`
      : `https://pentimento-bot.onrender.com${webhookPath}`;
      
    console.log(`[Bot] Configuring Telegram Webhook to ${webhookUrl}...`);
    try {
      await bot.api.setWebhook(webhookUrl, { drop_pending_updates: false });
      console.log(`[Bot] ✅ Telegram Webhook registered at ${webhookUrl}!`);
    } catch (e: any) {
      console.error('[Bot] Failed to register Telegram Webhook:', e.message);
    }
  } else {
    console.log('[Bot] Running via Long Polling in local mode...');
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: false });
      await bot.init();
      bot.start({
        drop_pending_updates: false,
        onStart: (botInfo) => {
          console.log(`[Bot] ✅ @${botInfo.username} is running live via Long Polling!`);
        },
      });
    } catch (err: any) {
      console.error('[Bot] Startup error:', err.message);
    }
  }
});

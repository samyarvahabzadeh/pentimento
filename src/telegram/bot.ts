import { Bot, webhookCallback, Keyboard, InputFile } from 'grammy';
import * as dotenv from 'dotenv';
import * as http from 'node:http';
dotenv.config();

import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { getRunByTelegramUser, saveRun, deleteRun, deleteRunsByTelegramUser, resetAllRuns } from '../storage/db.js';
import { INTRO_DIALOGUE, ROLE_SELECTION_PROMPT } from '../canon/node00.js';
import { getCoverPath, getPendingMediaForTurn } from './mediaDispatcher.js';
import { createInitialRunState } from '../core/initialState.js';
import type { RunState } from '../core/types.js';
import { computeBuildAttestation } from '../core/buildAttestation.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('[Bot] TELEGRAM_BOT_TOKEN not set.');
  process.exit(1);
}

const bot = new Bot(token);
const transport = createTransport();
const buildAttestation = computeBuildAttestation();

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

// Per-user debug mode toggle
const userDebugModes = new Map<number, boolean>();

// Per-user turn lock
const userTurnLocks = new Map<string, Promise<void>>();

function createNewState(): RunState {
  return createInitialRunState();
}

const roleKeyboard = new Keyboard()
  .text('1. مورخ هنری 📜').text('2. کیمیاگر قهوه ☕').row()
  .text('3. تحلیل‌گر سیستم 💻').text('4. کارآگاه 🔍')
  .resized()
  .oneTime();

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

// Global logger middleware
bot.use(async (ctx, next) => {
  const text = ctx.message?.text || ctx.callbackQuery?.data || '[media/action]';
  console.log(`[Bot] Incoming update (${ctx.from?.id}): ${text}`);
  await next();
});

// ─── /start ────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  console.log(`[Bot] Handling /start for user ${userId}`);
  deleteRunsByTelegramUser(userId);
  const state = createNewState();
  saveRun(state.canonical.runId, userId, state);

  const cover = getCoverPath();
  if (cover) {
    try {
      await ctx.replyWithPhoto(new InputFile(cover));
    } catch (e: any) {
      console.error('[Bot] Error sending cover photo:', e.message);
    }
  }

  await safeReply(ctx, buildIntroMessage(), {
    parse_mode: 'Markdown'
  });
});

// ─── /restart ──────────────────────────────────────────────────────
bot.command('restart', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  console.log(`[Bot] Handling /restart for user ${userId}`);
  deleteRunsByTelegramUser(userId);

  const state = createNewState();
  saveRun(state.canonical.runId, userId, state);

  const cover = getCoverPath();
  if (cover) {
    try {
      await ctx.replyWithPhoto(new InputFile(cover), {
        caption: '🔄 *ماجرا بازنشانی شد.*',
        parse_mode: 'Markdown'
      });
    } catch (e: any) {
      console.error('[Bot] Error sending cover photo on restart:', e.message);
    }
  }

  await safeReply(ctx, buildIntroMessage(), {
    parse_mode: 'Markdown'
  });
});

// ─── /debug_version ────────────────────────────────────────────────
bot.command('debug_version', async (ctx) => {
  const info = [
    `📦 *Pentimento Engine Build Manifest*`,
    `• *Build ID:* \`pentimento-conversational-freedom-20260825\``,
    `• *Story Schema Version:* \`v2.8.0-conversational-freedom\``,
    `• *Runtime SHA256:* \`${buildAttestation.fingerprint}\``,
    `• *Attested Files:* \`${buildAttestation.fileCount}\``,
    `• *Generic Dispatch:* \`SCENE_GROUNDED\``,
    `• *Conversational Contract:* \`FREE IDENTITY / ADDRESSEE AWARE / NATURAL SCENE QUESTIONS\``,
    `• *Evidence Gating:* \`LAYERED / NO REWARD FARMING\``,
    `• *NPC Knowledge Cards:* \`ACTIVE\``,
    `• *Situation Fronts:* \`3 ACTIVE / FAIL-FORWARD\``,
    `• *Clue Structure:* \`CONSTELLATIONS / NON-LINEAR\``,
    `• *Persistent Commitments:* \`ACTIVE\``,
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

// ─── Text messages -> resolvePlayerTurn ──────────────────────────
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Skip commands
  if (ctx.message.text.startsWith('/')) return;

  const userIdStr = userId.toString();

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


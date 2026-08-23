import { Bot, webhookCallback, Keyboard, InputFile } from 'grammy';
import * as dotenv from 'dotenv';
import * as http from 'node:http';
dotenv.config();

import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { getRunByTelegramUser, saveRun, deleteRun, resetAllRuns } from '../storage/db.js';
import { INTRO_DIALOGUE, ROLE_SELECTION_PROMPT } from '../canon/node00.js';
import { getCoverPath, getPendingMediaForTurn } from './mediaDispatcher.js';
import { createInitialRunState } from '../core/initialState.js';
import type { RunState } from '../core/types.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('[Bot] TELEGRAM_BOT_TOKEN not set.');
  process.exit(1);
}

const bot = new Bot(token);
const transport = createTransport();

console.log(`[Bot] Active provider: ${process.env.ACTIVE_PROVIDER ?? 'gemini'}`);

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
    parse_mode: 'Markdown',
    reply_markup: roleKeyboard
  });
});

// ─── /restart ──────────────────────────────────────────────────────
bot.command('restart', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  console.log(`[Bot] Handling /restart for user ${userId}`);
  const existing = getRunByTelegramUser(userId);
  if (existing) deleteRun(existing.runId);

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
    parse_mode: 'Markdown',
    reply_markup: roleKeyboard
  });
});

// ─── /reset_all (Admin Reset) ──────────────────────────────────────
bot.command('reset_all', async (ctx) => {
  resetAllRuns();
  await safeReply(ctx, '🧹 *تمام پروفایل‌های فعال و حافظه تمام بازیکنان با موفقیت ریست شد.*', { parse_mode: 'Markdown' });
});

// ─── /debug ────────────────────────────────────────────────────────
bot.command('debug', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  const current = userDebugModes.get(userId) ?? false;
  userDebugModes.set(userId, !current);
  await ctx.reply(`Debug mode: ${!current ? 'ON 🔍' : 'OFF'}`);
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
      const record = getRunByTelegramUser(userIdStr);
      if (!record) {
        await ctx.reply('بازی فعالی وجود ندارد. برای شروع /start را ارسال کنید.');
        return;
      }

      await ctx.replyWithChatAction('typing').catch(() => {});

      try {
        const result = await resolvePlayerTurn(record.state, ctx.message.text, transport);
        saveRun(record.runId, userIdStr, result.stateAfter);

        let reply = result.narrative;

        if (userDebugModes.get(userId)) {
          const dbg = (result as any)._debugInfo ?? {};
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


// ── HTTP Health Check Server (Required for Render Web Service) ──
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Pentimento Telegram Bot is running live.');
});
server.listen(PORT, () => {
  console.log(`[Bot] HTTP Health server listening on port ${PORT}`);
});

// ─── Launcher ─────────────────────────────────────────────────────
console.log('[Bot] Initializing Telegram Long Polling...');
bot.api.deleteWebhook({ drop_pending_updates: true }).then(() => {
  console.log('[Bot] Webhook deleted & old pending updates dropped.');
  return bot.start({
    onStart: (botInfo) => {
      console.log(`[Bot] ✅ @${botInfo.username} is running live via Long Polling!`);
    },
  });
}).catch((err) => {
  console.error('[Bot] Startup error:', err.message);
});

import { Bot } from 'grammy';
import * as dotenv from 'dotenv';
import * as http from 'node:http';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { getRunByTelegramUser, saveRun, deleteRun } from '../storage/db.js';
import { INTRO_DIALOGUE, ROLE_SELECTION_PROMPT } from '../canon/node00.js';
import type { RunState } from '../core/types.js';

// Minimal HTTP health-check server for Render Web Service
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Pentimento Telegram Bot is running live.');
});
server.listen(port, () => {
  console.log(`[Bot] Health check server listening on port ${port}`);
});

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('[Bot] TELEGRAM_BOT_TOKEN not set.');
  process.exit(1);
}

const bot = new Bot(token);
const transport = createTransport();

console.log(`[Bot] Active provider: ${process.env.ACTIVE_PROVIDER ?? 'groq'}`);

// Per-user debug mode toggle (persists in memory, resets on restart)
const userDebugModes = new Map<number, boolean>();

import { createInitialRunState } from '../core/initialState.js';

function createNewState(): RunState {
  return createInitialRunState();
}

/** Canonical intro message: three-line dialogue + role selection menu. */
function buildIntroMessage(): string {
  const lines = (INTRO_DIALOGUE as ReadonlyArray<{ speaker: string; text: string }>).map(d => {
    if (d.speaker === 'Unknown') return `ناشناس:\n«${d.text}»`;
    if (d.speaker === 'Player') return `تو:\n«${d.text}»`;
    return `«${d.text}»`;
  });
  return lines.join('\n\n') + '\n\n' + '—'.repeat(24) + '\n\n' + ROLE_SELECTION_PROMPT;
}

// ── /start ────────────────────────────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const state = createNewState();
  saveRun(state.canonical.runId, userId, state);
  await ctx.reply(buildIntroMessage());
});

// ── /restart ──────────────────────────────────────────────────────────────────
bot.command('restart', async (ctx) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const existing = getRunByTelegramUser(userId);
  if (existing) deleteRun(existing.runId);

  const state = createNewState();
  saveRun(state.canonical.runId, userId, state);
  await ctx.reply('🔄 Run reset.\n\n' + buildIntroMessage());
});

// ── /debug ────────────────────────────────────────────────────────────────────
bot.command('debug', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  const current = userDebugModes.get(userId) ?? false;
  userDebugModes.set(userId, !current);
  await ctx.reply(`Debug mode: ${!current ? 'ON 🔍' : 'OFF'}`);
});

// ── /state ────────────────────────────────────────────────────────────────────
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

  await ctx.reply(`\`\`\`\n${summary}\n\`\`\``, { parse_mode: 'Markdown' });
});

// ── Text messages → resolvePlayerTurn ─────────────────────────────────────────
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Skip commands (already handled above)
  if (ctx.message.text.startsWith('/')) return;

  const userIdStr = userId.toString();
  const record = getRunByTelegramUser(userIdStr);
  if (!record) {
    await ctx.reply('بازی فعالی وجود ندارد. برای شروع /start را ارسال کنید.');
    return;
  }

  try {
    const result = await resolvePlayerTurn(record.state, ctx.message.text, transport);
    saveRun(record.runId, userIdStr, result.stateAfter);

    let reply = result.narrative;

    if (userDebugModes.get(userId)) {
      const dbg = (result as any)._debugInfo ?? {};
      const out = (result as any)._output ?? {};
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
        `int: ${result.interpretation.kind}→${result.interpretation.targetId ?? '-'}`,
        `act: ${result.validation.acceptedActionId ?? 'none'}`,
        `eff: ${efStr}`,
        `s/t: ${result.stateBefore.canonical.stress}→${result.stateAfter.canonical.stress} / ${result.stateBefore.canonical.threat}→${result.stateAfter.canonical.threat}`,
        '```',
      ].join('\n');
    }

    await ctx.reply(reply, { parse_mode: userDebugModes.get(userId) ? 'Markdown' : undefined });

  } catch (err: any) {
    console.error('[Bot] Error processing turn:', err.message);
    await ctx.reply('خطایی رخ داد. دوباره تلاش کنید.');
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
bot.catch((err) => {
  console.error('[Bot] Uncaught error:', err.message);
});

console.log('[Bot] Starting long polling...');
bot.start();

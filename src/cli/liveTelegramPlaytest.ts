import { Bot, Keyboard, InputFile } from 'grammy';
import * as dotenv from 'dotenv';
dotenv.config();

import { resolvePlayerTurn } from '../core/resolvePlayerTurn.js';
import { createTransport } from '../transport/transportFactory.js';
import { getRunByTelegramUser, saveRun, deleteRun, deleteRunsByTelegramUser, resetAllRuns } from '../storage/db.js';
import { ROLE_SELECTION_PROMPT } from '../canon/node00.js';
import { getCoverPath, getPendingMediaForTurn } from '../telegram/mediaDispatcher.js';
import { createInitialRunState } from '../core/initialState.js';
import type { RunState } from '../core/types.js';

export interface TelegramTurnInteraction {
  turnIndex: number;
  playerInput: string;
  botReply: string;
  mediaSent?: string[];
  stateSnapshot?: {
    node: string;
    turn: number;
    evidence: string[];
    inventory: string[];
    clocks: any;
    proofs: any;
    trust: any;
    pressure: any;
    environment: any;
  };
  critiqueNotes?: string[];
}

export class LiveTelegramBotHarness {
  private bot: Bot;
  private transport = createTransport();
  private capturedReplies: string[] = [];
  private capturedPhotos: string[] = [];
  private currentUserId = 99887766;
  private messageCounter = 100;

  constructor() {
    // Create Grammy bot instance with token and botInfo
    const token = process.env.TELEGRAM_BOT_TOKEN || '123456789:TEST_MOCK_TOKEN';
    this.bot = new Bot(token, {
      botInfo: {
        id: 8998292391,
        is_bot: true,
        first_name: 'Pentimento Bot',
        username: 'pentimento_game_bot',
        can_join_groups: false,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
        can_connect_to_business: false,
        has_main_web_app: false,
      } as any,
    });

    // Intercept outbound Telegram API calls to capture replies
    this.bot.api.config.use(async (prev, method, payload, signal) => {
      if (method === 'sendMessage') {
        const text = (payload as any).text || '';
        this.capturedReplies.push(text);
        return { ok: true, result: { message_id: ++this.messageCounter, text } } as any;
      }
      if (method === 'sendPhoto') {
        const caption = (payload as any).caption || '[Photo Attachment]';
        this.capturedPhotos.push(caption);
        this.capturedReplies.push(caption);
        return { ok: true, result: { message_id: ++this.messageCounter, caption } } as any;
      }
      if (method === 'sendChatAction') {
        return { ok: true, result: true } as any;
      }
      if (method === 'deleteWebhook' || method === 'setWebhook') {
        return { ok: true, result: true } as any;
      }
      return { ok: true, result: {} } as any;
    });

    this.setupBotHandlers();
  }

  private setupBotHandlers() {
    const roleKeyboard = new Keyboard()
      .text('1. مورخ هنری 📜').text('2. کیمیاگر قهوه ☕').row()
      .text('3. تحلیل‌گر سیستم 💻').text('4. کارآگاه 🔍')
      .resized()
      .oneTime();

    this.bot.command('start', async (ctx) => {
      const userId = ctx.from?.id?.toString();
      if (!userId) return;

      deleteRunsByTelegramUser(userId);
      const state = createInitialRunState();
      saveRun(state.canonical.runId, userId, state);

      const cover = getCoverPath();
      if (cover) {
        try {
          await ctx.replyWithPhoto(new InputFile(cover));
        } catch (e) {}
      }

      await ctx.reply(ROLE_SELECTION_PROMPT, {
        reply_markup: roleKeyboard
      });
    });

    this.bot.command('restart', async (ctx) => {
      const userId = ctx.from?.id?.toString();
      if (!userId) return;

      deleteRunsByTelegramUser(userId);

      const state = createInitialRunState();
      saveRun(state.canonical.runId, userId, state);

      const cover = getCoverPath();
      if (cover) {
        try {
          await ctx.replyWithPhoto(new InputFile(cover), {
            caption: '🔄 *ماجرا بازنشانی شد.*',
            parse_mode: 'Markdown'
          });
        } catch (e) {}
      }

      await ctx.reply(ROLE_SELECTION_PROMPT, {
        reply_markup: roleKeyboard
      });
    });

    this.bot.on('message:text', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;
      if (ctx.message.text.startsWith('/')) return;

      const userIdStr = userId.toString();
      let record = getRunByTelegramUser(userIdStr);
      if (!record) {
        const state = createInitialRunState();
        saveRun(state.canonical.runId, userIdStr, state);
        record = { runId: state.canonical.runId, state };
      }

      try {
        const result = await resolvePlayerTurn(record.state, ctx.message.text, this.transport);
        saveRun(record.runId, userIdStr, result.stateAfter);

        const isRoleSelection = record.state.canonical.currentNode === 'NODE_00';

        const media = getPendingMediaForTurn(
          record.state,
          result.stateAfter,
          result.validation.acceptedActionId
        );

        if (media) {
          saveRun(record.runId, userIdStr, result.stateAfter);
          try {
            await ctx.replyWithPhoto(new InputFile(media.mediaPath));
          } catch (e) {}
        }

        await ctx.reply(result.narrative, {
          reply_markup: isRoleSelection ? { remove_keyboard: true } : undefined,
        });

      } catch (err: any) {
        await ctx.reply(`خطایی رخ داد: ${err.message}`);
      }
    });
  }

  async sendUserMessage(text: string, userId: number = this.currentUserId): Promise<{ reply: string; state: RunState }> {
    this.capturedReplies = [];
    this.capturedPhotos = [];

    const isCmd = text.startsWith('/');
    const update = {
      update_id: ++this.messageCounter,
      message: {
        message_id: ++this.messageCounter,
        date: Math.floor(Date.now() / 1000),
        chat: {
          id: userId,
          type: 'private',
          first_name: 'LivePlaytester',
        },
        from: {
          id: userId,
          is_bot: false,
          first_name: 'LivePlaytester',
        },
        text,
        entities: isCmd ? [{ type: 'bot_command', offset: 0, length: text.length }] : undefined,
      },
    };

    await this.bot.handleUpdate(update as any);

    const record = getRunByTelegramUser(userId.toString());
    const replyText = this.capturedReplies.join('\n\n');

    return {
      reply: replyText,
      state: record ? record.state : createInitialRunState(),
    };
  }

  async restartSession(userId: number = this.currentUserId): Promise<{ reply: string; state: RunState }> {
    return this.sendUserMessage('/restart', userId);
  }
}

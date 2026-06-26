import { Telegraf, session } from 'telegraf';
import { BotContext } from '../../types/context';
import { startCommand } from './commands/start';
import { assignCommand } from './commands/assign';
import { acceptAction } from './actions/acceptAction';
import { rejectAction } from './actions/rejectAction';
import { rejectReasonHandler } from './actions/rejectReasonAction';

export function createAssigningBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.use(session());

  // Commands
  bot.command('start', startCommand);
  bot.command('assign', assignCommand);

  // Actions
  bot.action(/accept_(\d+)/, acceptAction);
  bot.action(/reject_(\d+)/, rejectAction);

  // Command cancel - harus sebelum bot.on('text')
  bot.command('cancel', async (ctx) => {
    if (!ctx.session?.assignmentId) {
      return ctx.reply('Tidak ada proses yang sedang berjalan\\.',
        { parse_mode: 'MarkdownV2' });
    }

    const assignmentId = ctx.session.assignmentId;
    const messageId = ctx.session.assignmentMessageId;
    const originalText = ctx.session.assignmentMessageText;

    ctx.session.assignmentId = undefined;
    ctx.session.assignmentMessageId = undefined;
    ctx.session.assignmentMessageText = undefined;

    // Hapus pesan /cancel dari user
    try {
      await ctx.deleteMessage();
    } catch {
      // skip
    }

    if (messageId && originalText) {
      try {
        // Kembalikan pesan asli dengan tombol Accept/Reject
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          messageId,
          undefined,
          originalText,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Accept', callback_data: `accept_${assignmentId}` },
                { text: '❌ Reject', callback_data: `reject_${assignmentId}` },
              ]],
            },
          }
        );
      } catch {
        await ctx.reply(
          '✅ Dibatalkan\\. Silakan pilih kembali:',
          {
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Accept', callback_data: `accept_${assignmentId}` },
                { text: '❌ Reject', callback_data: `reject_${assignmentId}` },
              ]],
            },
          }
        );
      }
    }
  });

  // Handler alasan reject - setelah command cancel
  bot.on('text', async (ctx, next) => {
    if (ctx.session?.assignmentId) {
      return rejectReasonHandler(ctx);
    }
    return next();
  });

  bot.on('text', async (ctx) => {
    await ctx.reply(
      'Gunakan perintah berikut:\n' +
      '/assign [WP_ID] \\- Menugaskan Work Package\n' +
      'Contoh: /assign AFC\\-001/1\\.1\\.1',
    );
  });

  return bot;
}

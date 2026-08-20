import { Telegraf, session } from 'telegraf';
import { BotContext } from '../../types/context';
import { approveAction } from './actions/approveAction';
import { declineAction } from './actions/declineAction';
import { declineNotesHandler } from './actions/declineNotesAction';

export function createSubmittingBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.use(session());

  // Commands
  bot.command('start', async (ctx) => {
    await ctx.reply('Bot Submitting aktif. Anda akan menerima notifikasi submission di sini.');
  });

  // Actions
  bot.action(/approve_(\d+)/, approveAction);
  bot.action(/decline_(\d+)/, declineAction);

  // Command cancel - harus sebelum bot.on('text')
  bot.command('cancel', async (ctx) => {
    if (!ctx.session?.submissionId) {
      return ctx.reply('Tidak ada proses yang sedang berjalan\\.', {
        parse_mode: 'MarkdownV2',
      });
    }

    const submissionId = ctx.session.submissionId;
    const messageId = ctx.session.approvalMessageId;
    const originalText = ctx.session.approvalMessageText;

    ctx.session.submissionId = undefined;
    ctx.session.approvalMessageId = undefined;
    ctx.session.approvalMessageText = undefined;

    // Hapus pesan /cancel dari user
    try {
      await ctx.deleteMessage();
    } catch {
      // skip
    }

    if (messageId && originalText) {
      try {
        // Kembalikan pesan asli dengan tombol Approve/Decline
        await ctx.telegram.editMessageText(
          ctx.chat!.id,
          messageId,
          undefined,
          originalText,
          {
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Approve', callback_data: `approve_${submissionId}` },
                  { text: '❌ Decline', callback_data: `decline_${submissionId}` },
                ],
              ],
            },
          }
        );
      } catch {
        await ctx.reply('✅ Dibatalkan\\. Silakan pilih kembali:', {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_${submissionId}` },
                { text: '❌ Decline', callback_data: `decline_${submissionId}` },
              ],
            ],
          },
        });
      }
    }
  });

  // Handler alasan decline - jika ada session aktif
  bot.on('text', async (ctx, next) => {
    if (ctx.session?.submissionId) {
      return declineNotesHandler(ctx);
    }
    return next();
  });

  // Default Fallback Handler - jika pesan teks tidak masuk kondisi di atas
  bot.on('text', async (ctx) => {
    await ctx.reply('Tidak ada proses persetujuan yang berjalan. Ketik /start untuk melihat opsi.');
  });

  return bot;
}

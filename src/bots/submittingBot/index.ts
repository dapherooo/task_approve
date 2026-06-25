import { Telegraf, session } from 'telegraf';
import { BotContext } from '../../types/context';
import { approveAction } from './actions/approveAction';
import { declineAction } from './actions/declineAction';
import { declineNotesHandler } from './actions/declineNotesAction';

export function createSubmittingBot(token: string) {
  const bot = new Telegraf<BotContext>(token);

  bot.use(session()); // ← pastikan ini ada

  bot.action(/approve_(\d+)/, approveAction);
  bot.action(/decline_(\d+)/, declineAction);

  bot.on('text', async (ctx, next) => {
    if (ctx.session?.submissionId) {
      return declineNotesHandler(ctx);
    }
    return next();
  });

  bot.command('cancel', async (ctx) => {
  if (!ctx.session?.submissionId) {
    return ctx.reply('Tidak ada proses yang sedang berjalan\\.',
      { parse_mode: 'MarkdownV2' });
  }

  const submissionId = ctx.session.submissionId;
  ctx.session.submissionId = undefined;

  await ctx.reply(
    '✅ Dibatalkan\\. Silakan pilih kembali:',
    {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Approve', callback_data: `approve_${submissionId}` },
          { text: '❌ Decline', callback_data: `decline_${submissionId}` },
        ]],
      },
    }
  );
});

  return bot;
}

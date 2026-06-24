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
    return ctx.reply('Tidak ada proses yang sedang berjalan.');
  }

  const submissionId = ctx.session.submissionId;
  ctx.session.submissionId = undefined;

  // Ambil data submission untuk rebuild tombol
  const { prisma } = await import('../../prisma/client');
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignee: true, user: true, pm: true },
  });

  if (!submission) {
    return ctx.reply('❌ Data tidak ditemukan.');
  }

  // Kembalikan status ke SUBMITTED
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'SUBMITTED' },
  });

  await ctx.reply(
    '✅ Dibatalkan\\. Silakan pilih kembali:',
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

  return bot;
}

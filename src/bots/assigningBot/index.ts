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

  // Handler alasan reject
  bot.on('text', async (ctx, next) => {
    if (ctx.session?.assignmentId) {
      return rejectReasonHandler(ctx);
    }
    return next();
  });

  bot.on('text', async (ctx) => {
    await ctx.reply(
      'Gunakan perintah berikut:\n' +
        '/assign [WP_ID] - Menugaskan Work Package\n' +
        'Contoh: /assign AFC-001/1.1.1',
    );
  });

  return bot;
}

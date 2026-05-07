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

  return bot;
}

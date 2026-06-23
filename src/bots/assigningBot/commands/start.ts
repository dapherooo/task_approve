import { BotContext } from '../../../types/context';

export const startCommand = async (ctx: BotContext) => {
  const name = ctx.from?.first_name ?? 'sana';
  await ctx.reply(
    `Halo ${name}! 👋\n\n` +
      `Selamat datang di Velo Assignment\n\n` +
      `Gunakan perintah berikut:\n` +
      `/assign [ID Work Package]\n\n` +
      `Contoh:\n` +
      `/assign AFC-001/1.1.1`,
  );
};

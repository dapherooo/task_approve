import { BotContext } from '../../../types/context';
import { assignmentService } from '../../../services/assignment.service';
import { Markup } from 'telegraf';

// Tambah flag untuk mencegah double processing
let isProcessing = false;

export const assignCommand = async (ctx: BotContext) => {
  console.log(
    '📨 assignCommand dipanggil, message_id:',
    ctx.message?.message_id,
  );
  console.log('👤 dari user:', ctx.from?.id, ctx.from?.username);
  if (isProcessing) {
    return ctx.reply('⏳ Sedang memproses permintaan sebelumnya...');
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const wpId = text.split(' ').slice(1).join(' ').trim();
  const telegramId = ctx.from?.id.toString() ?? '';

  if (!wpId) {
    return ctx.reply(
      '❌ Format salah!\n\n' +
        'Gunakan: /assign [WP_ID]\n' +
        'Contoh: /assign AFC-001/1.1.1',
    );
  }

  isProcessing = true;
  const loadingMsg = await ctx.reply('⏳ Memproses penugasan...');

  try {
    const result = await assignmentService.processAssignment(wpId, telegramId);

    await ctx.deleteMessage(loadingMsg.message_id);

    if (!result.success) {
      return ctx.reply(result.message);
    }

    // Kirim pesan sukses ke PM
    if (result.pmMessage) {
      await ctx.reply(result.pmMessage, { parse_mode: 'MarkdownV2' });
    }
    
    // Kirim pesan ke Assignee
    if (result.assigneeTelegramId && result.assigneeMessage) {
      await ctx.telegram.sendMessage(
        result.assigneeTelegramId,
        result.assigneeMessage,
        {
          parse_mode: 'MarkdownV2',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Accept', `accept_${result.assignment!.id}`),
              Markup.button.callback('❌ Reject', `reject_${result.assignment!.id}`),
            ],
          ]),
        }
      );
    }
  } catch (error) {
    await ctx.deleteMessage(loadingMsg.message_id);
    console.error('❌ Error assign command:', error);
    await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    isProcessing = false;
  }
};

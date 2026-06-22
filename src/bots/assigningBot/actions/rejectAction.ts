import { BotContext } from '../../../types/context';
import { assignmentRepository } from '../../../repositories/assignment.repository';
import { notionWpService } from '../../../services/notion.wp.service';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const rejectAction = async (ctx: BotContext) => {
  try {
    const assignmentId = parseInt(ctx.match[1]);
    const respondAt = new Date();

    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ctx.answerCbQuery('❌ Data penugasan tidak ditemukan.');
    }

    await assignmentRepository.updateAssigneeLog(assignmentId, {
      respond: 'Reject',
      respondAt,
    });

    await assignmentRepository.updateStatus(assignment.id, 'REJECTED');

    if (assignment.notionPageId) {
      try {
        await notionWpService.updateAssigningRespond(
          assignment.notionPageId,
          'Reject',
        );
      } catch (notionError: any) {
        console.log('⚠️ Skip update Notion:', notionError?.message);
      }
    }

    await ctx.answerCbQuery('❌ Tugas ditolak.');

    if (!ctx.session) (ctx as any).session = {};
    ctx.session.assignmentId = assignmentId;

    // Ambil teks pesan lama
    const originalMessage =
      ctx.callbackQuery &&
      'message' in ctx.callbackQuery &&
      ctx.callbackQuery.message &&
      'text' in ctx.callbackQuery.message
        ? ctx.callbackQuery.message.text
        : '';

    // Hapus baris ke-1 (index 0) dan ke-12 (index 11)
    const filteredMessage = originalMessage
      .split('\n')
      .filter((_, index) => index !== 0 && index !== 11)
      .join('\n')
      .trimStart();

    await ctx.editMessageText(
      `${filteredMessage}\n` +
      `----------------------------------------------------\n` +
      `Anda telah menolak tugas ini\\.\n\n` +
      `Silakan tuliskan alasan penolakan Anda:`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ Error reject action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

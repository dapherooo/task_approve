import { BotContext } from '../../../types/context';
import { assignmentRepository } from '../../../repositories/assignment.repository';
import { notionWpService } from '../../../services/notion.wp.service';

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
      await notionWpService.updateAssigningRespond(
        assignment.notionPageId,
        'Reject',
      );
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

    await ctx.editMessageText(
      `${originalMessage}\n` +
        `----------------------------------------------------\n` +
        `Anda telah menolak tugas ini.\n\n` +
        `Silakan tuliskan alasan penolakan Anda:`,
    );
  } catch (error) {
    console.error('❌ Error reject action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

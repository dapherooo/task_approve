import { BotContext } from '../../../types/context';
import { submissionRepository } from '../../../repositories/submission.repository';
import { notionSubmittingService } from '../../../services/notion.submitting.service';

export const declineAction = async (ctx: BotContext) => {
  try {
    const submissionId = parseInt(ctx.match[1]);
    const respondAt = new Date();

    const { prisma } = await import('../../../prisma/client');
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignee: true, user: true, pm: true },
    });
    if (!submission) return ctx.answerCbQuery('❌ Data tidak ditemukan.');

    await submissionRepository.updateStatus(submissionId, 'DECLINED');
    await submissionRepository.updateUserLog(submissionId, {
      respond: 'Decline',
      respondAt,
    });

    await notionSubmittingService.updateRespond(
      submission.notionPageId,
      'Decline',
    );
    await notionSubmittingService.updateApprovalDate(
      submission.notionPageId,
      respondAt,
    );

    await ctx.answerCbQuery('❌ Deliverable ditolak.');

    if (!ctx.session) (ctx as any).session = {};
    ctx.session.submissionId = submissionId;

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
        `❌ Deliverable ditolak. Silakan tuliskan alasan penolakan:`,
    );
  } catch (error) {
    console.error('❌ Error decline action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

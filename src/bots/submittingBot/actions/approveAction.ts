import { BotContext } from '../../../types/context';
import { submissionRepository } from '../../../repositories/submission.repository';
import { notionSubmittingService } from '../../../services/notion.submitting.service';

export const approveAction = async (ctx: BotContext) => {
  try {
    const submissionId = parseInt(ctx.match[1]);
    const respondAt = new Date();

    const submission = await submissionRepository.findByNotionPageId(
      await getNotionPageIdBySubmissionId(submissionId),
    );
    if (!submission) return ctx.answerCbQuery('❌ Data tidak ditemukan.');

    // Update PostgreSQL
    await submissionRepository.updateStatus(submissionId, 'APPROVED');
    await submissionRepository.updateUserLog(submissionId, {
      respond: 'Approve',
      respondAt,
    });

    // Update Notion
    await notionSubmittingService.updateRespond(
      submission.notionPageId,
      'Approve',
    );
    await notionSubmittingService.updateApprovalDate(
      submission.notionPageId,
      respondAt,
    );

    const respondDateFormatted = respondAt.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const userLog = await submissionRepository.findUserLog(submissionId);

    // Edit pesan User
    await ctx.editMessageText(
      `${userLog?.message}\n` +
        `----------------------------------------------------\n` +
        `✅ Deliverable Work Package telah disetujui oleh ${submission.user.name}\n` +
        `pada tanggal ${respondDateFormatted}`,
    );
    await ctx.answerCbQuery('✅ Deliverable disetujui!');

    const notifMessage =
      `✅ Deliverable telah disetujui oleh ${submission.user.name} pada tanggal ${respondDateFormatted}.\n\n` +
      `Deliverable: ${submission.deliverableName ?? '-'}\n` +
      `Work Package: ${submission.wpName}\n` +
      `Project: ${submission.projectName}`;

    // Kirim ke Assignee
    await ctx.telegram.sendMessage(
      submission.assignee.telegramId!,
      notifMessage,
    );

    // Kirim ke PM
    await ctx.telegram.sendMessage(submission.pm.telegramId!, notifMessage);
  } catch (error) {
    console.error('❌ Error approve action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

async function getNotionPageIdBySubmissionId(id: number): Promise<string> {
  const { prisma } = await import('../../../prisma/client');
  const submission = await prisma.submission.findUnique({ where: { id } });
  return submission?.notionPageId ?? '';
}

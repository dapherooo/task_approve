import { BotContext } from '../../../types/context';
import { submissionRepository } from '../../../repositories/submission.repository';
import { notionSubmittingService } from '../../../services/notion.submitting.service';
import { prisma } from '../../../prisma/client';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const approveAction = async (ctx: BotContext) => {
  try {
    const submissionId = parseInt(ctx.match[1]);
    const respondAt = new Date();

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignee: true, user: true, pm: true },
    });
    if (!submission) return ctx.answerCbQuery('❌ Data tidak ditemukan.');

    // Update PostgreSQL
    await submissionRepository.updateStatus(submissionId, 'APPROVED');
    await submissionRepository.updateUserLog(submissionId, {
      respond: 'Approve',
      respondAt,
    });

    // Update Notion
    try {
      await notionSubmittingService.updateRespond(submission.notionPageId, 'Approve');
      await notionSubmittingService.updateApprovalDate(submission.notionPageId, respondAt);
    } catch (notionError: any) {
      console.log('⚠️ Skip update Notion:', notionError?.message);
    }

    const respondDateFormatted = respondAt.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

    const submittedDateFormatted = submission.submittedDate
      ? new Date(submission.submittedDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta',
        })
      : '-';

    // Escape variabel dinamis
    const safeUserName = escapeMd(submission.user.name);
    const safeAssigneeName = escapeMd(submission.assignee.name);
    const safePmName = escapeMd(submission.pm.name);
    const safeDeliverable = escapeMd(submission.deliverableName);
    const safeWpName = escapeMd(submission.wpName);
    const safeProject = escapeMd(submission.projectName);
    const safeRespondDate = escapeMd(respondDateFormatted);
    const safeSubmittedDate = escapeMd(submittedDateFormatted);

    // Edit pesan User
    await ctx.editMessageText(
      `*✅ Deliverable Disetujui*\n\n` +
      `Disetujui oleh ${safeUserName} pada tanggal ${safeRespondDate}\n\n` +
      `*Deliverable:* ${safeDeliverable}\n` +
      `*Work Package:* ${safeWpName}\n` +
      `*Tanggal Submit:* ${safeSubmittedDate}\n\n` +
      `*Project:* ${safeProject}`,
      { parse_mode: 'MarkdownV2' }
    );
    await ctx.answerCbQuery('✅ Deliverable disetujui!');

    // Notifikasi ke Assignee dan PM
    const notifMessage =
      `✅ Deliverable ${safeDeliverable} *DISETUJUI* oleh ${safeUserName} pada tanggal ${safeRespondDate}\n\n` +
      `*Deliverable:* ${safeDeliverable}\n` +
      `*Tanggal Submit:* ${safeSubmittedDate}\n\n` +
      `*Work Package:* ${safeWpName}\n` +
      `*Project:* ${safeProject}\n` +
      `*Assignee:* ${safeAssigneeName}\n` +
      `*User:* ${safeUserName}\n` +
      `*Project Manager:* ${safePmName}`;

    // Kirim ke Assignee
    await ctx.telegram.sendMessage(
      submission.assignee.telegramId!,
      notifMessage,
      { parse_mode: 'MarkdownV2' }
    );

    // Kirim ke PM
    await ctx.telegram.sendMessage(
      submission.pm.telegramId!,
      notifMessage,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ Error approve action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

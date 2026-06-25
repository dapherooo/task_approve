import { BotContext } from '../../../types/context';
import { notionSubmittingService } from '../../../services/notion.submitting.service';
import { prisma } from '../../../prisma/client';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const declineAction = async (ctx: BotContext) => {
  try {
    const submissionId = parseInt(ctx.match[1]);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignee: true, user: true, pm: true },
    });
    if (!submission) return ctx.answerCbQuery('❌ Data tidak ditemukan.');

    await ctx.answerCbQuery('❌ Deliverable akan ditolak.');

    if (!ctx.session) (ctx as any).session = {};
    ctx.session.submissionId = submissionId;

    // Format tanggal
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
    const safeAssigneeName = escapeMd(submission.assignee.name);
    const safeDeliverable = escapeMd(submission.deliverableName);
    const safeWpName = escapeMd(submission.wpName);
    const safeProject = escapeMd(submission.projectName);
    const safeSubmittedDate = escapeMd(submittedDateFormatted);

    await ctx.editMessageText(
      `*⚠️ Permintaan Approval Deliverable*\n\n` +
      `*📋 Deliverable:* ${safeDeliverable}\n` +
      `*📦 Work Package:* ${safeWpName}\n` +
      `*🗓️ Tanggal Submit:* ${safeSubmittedDate}\n\n` +
      `*📁 Project:* ${safeProject}\n` +
      `*👤 Assignee:* ${safeAssigneeName}\n\n` +
      `📝 Tolong ketikkan *alasan penolakan* Anda, lalu kirim:\n` +
      `_\\(Ketik /cancel untuk membatalkan\\)_`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ Error decline action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

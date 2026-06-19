import { BotContext } from '../../../types/context';
import { submissionRepository } from '../../../repositories/submission.repository';
import { notionSubmittingService } from '../../../services/notion.submitting.service';
import { prisma } from '../../../prisma/client';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const declineNotesHandler = async (ctx: BotContext) => {
  const submissionId = ctx.session?.submissionId;
  if (!submissionId) return;

  const notes = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  if (!notes) return;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignee: true, user: true, pm: true },
  });
  if (!submission) return;

  const userLog = await submissionRepository.findUserLog(submissionId);
  const respondAt = userLog?.respondAt ?? new Date();

  const respondDateFormatted = respondAt.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Update PostgreSQL
  await submissionRepository.updateUserLog(submissionId, {
    respond: 'Decline',
    respondAt,
    declineNotes: notes,
  });

  // Update Notion
  await notionSubmittingService.updateDeclineNotes(
    submission.notionPageId,
    notes,
  );

  ctx.session.submissionId = undefined;

  // Edit pesan User
  await ctx.reply(
    `${userLog?.message}\n` +
      `-----------------------------------------------\n` +
      `❌ Deliverable telah *ditolak* oleh ${submission.user.name}\n` +
      `pada tanggal ${respondDateFormatted}\n` +
      `*Decline Notes:*\n${notes}`,
      { parse_mode: 'MarkdownV2' }
  );

  const notifMessage =
    `*Deliverable:* ${submission.deliverableName ?? '-'}\n\n` +
    `*Work Package:* ${submission.wpName}\n` +
    `*Project:* ${submission.projectName}\n\n` +
    `❌ Deliverable ini telah *ditolak* oleh ${submission.user.name} pada tanggal ${respondDateFormatted}.\n` +
    `*Dengan Alasan:*\n${notes}`;

  // Kirim ke Assignee
  await ctx.telegram.sendMessage(submission.assignee.telegramId!, notifMessage, { parse_mode: 'MarkdownV2' });

  // Kirim ke PM
  await ctx.telegram.sendMessage(submission.pm.telegramId!, notifMessage, { parse_mode: 'MarkdownV2' });
};

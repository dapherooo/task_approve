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

  // Update PostgreSQL
  await submissionRepository.updateUserLog(submissionId, {
    respond: 'Decline',
    respondAt,
    declineNotes: notes,
  });

  // Update Notion
  try {
    await notionSubmittingService.updateDeclineNotes(submission.notionPageId, notes);
  } catch (notionError: any) {
    console.log('⚠️ Skip update Notion:', notionError?.message);
  }

  ctx.session.submissionId = undefined;

  // Escape variabel dinamis
  const safeUserName = escapeMd(submission.user.name);
  const safeAssigneeName = escapeMd(submission.assignee.name);
  const safePmName = escapeMd(submission.pm.name);
  const safeDeliverable = escapeMd(submission.deliverableName);
  const safeWpName = escapeMd(submission.wpName);
  const safeProject = escapeMd(submission.projectName);
  const safeRespondDate = escapeMd(respondDateFormatted);
  const safeSubmittedDate = escapeMd(submittedDateFormatted);
  const safeNotes = escapeMd(notes);

  // Kirim konfirmasi ke User
  await ctx.reply(
    `*❌ Deliverable Ditolak*\n` +
    `Ditolak oleh ${safeUserName} pada tanggal ${safeRespondDate}\n` +
    `*Alasan:*\n${safeNotes}\n\n` +
    `*Deliverable:* ${safeDeliverable}\n` +
    `*Tanggal Submit:* ${safeSubmittedDate}\n\n` +
    `*Assignee:* ${safeAssigneeName}\n` +
    `*Work Package:* ${safeWpName}\n` +    
    `*Project:* ${safeProject}`,
    { parse_mode: 'MarkdownV2' }
  );

  // Notifikasi ke Assignee dan PM
  const notifMessage =
    `🔔 Notifikasi Deliverable \n\n` +
    `Deliverable ${safeDeliverable} *DITOLAK* oleh ${safeUserName} pada tanggal ${safeRespondDate}\n` +
    `*Alasan:* ${safeNotes} \n\n` +
    `*Deliverable:* ${safeDeliverable}\n` +
    `*Tanggal Submit:* ${safeSubmittedDate}\n` +
    `*Work Package:* ${safeWpName}\n` +    
    `*Project:* ${safeProject}\n` +
    `*Assignee:* ${safeAssigneeName}\n` +
    `*User:* ${safeUserName}\n` +
    `*Project Manager:* ${safePmName}\n`;

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
};

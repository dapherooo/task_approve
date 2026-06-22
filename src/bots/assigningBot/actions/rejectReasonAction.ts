import { BotContext } from '../../../types/context';
import { prisma } from '../../../prisma/client';
import { assignmentRepository } from '../../../repositories/assignment.repository';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const rejectReasonHandler = async (ctx: BotContext) => {
  const assignmentId = ctx.session?.assignmentId;
  if (!assignmentId) return;

  const reason = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  if (!reason) return;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { pm: true, assignee: true },
  });
  if (!assignment) return;

  const assigneeLog = await assignmentRepository.findAssigneeLog(assignmentId);
  const respondAt = assigneeLog?.respondAt ?? new Date();

  const respondDateFormatted = respondAt.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  const dueFormatted = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      })
    : '-';

  // Simpan alasan ke PostgreSQL
  await assignmentRepository.updateAssigneeLogReason(assignmentId, reason);

  // Hapus assignmentId dari session
  ctx.session.assignmentId = undefined;

  // Escape variabel dinamis
  const safeWpId = escapeMd(assignment.wpId);
  const safeWpName = escapeMd(assignment.wpName);
  const safeProject = escapeMd(assignment.projectName);
  const safeAssigneeName = escapeMd(assignment.assignee.name);
  const safePmName = escapeMd(assignment.pm.name);
  const safeRespondDate = escapeMd(respondDateFormatted);
  const safeDue = escapeMd(dueFormatted);
  const safeReason = escapeMd(reason);

  // Kirim pesan konfirmasi ke Assignee
  await ctx.reply(
    `*📦 Work Package:* ${safeWpId} \\- ${safeWpName}\n` +
    `*🗓️ Due Date:* ${safeDue}\n\n` +
    `*📁 Project:* ${safeProject}\n` +
    `*👤 Project Manager:* ${safePmName}\n\n` +
    `----------------------------------------------------\n` +
    `Anda telah menolak tugas ini pada tanggal: ${safeRespondDate}\n` +
    `Dengan alasan:\n${safeReason}`,
    { parse_mode: 'MarkdownV2' }
  );

  // Kirim notifikasi ke PM
  const pmMessage =
    `❌ *Penugasan Ditolak\\!*\n\n` +
    `*📦 Work Package:* ${safeWpId} \\- ${safeWpName}\n` +
    `*🗓️ Due Date:* ${safeDue}\n\n` +
    `*📁 Project:* ${safeProject}\n\n` +
    `Telah ditolak oleh ${safeAssigneeName} pada tanggal ${safeRespondDate}\\.\n` +
    `Dengan alasan:\n${safeReason}`;

  await ctx.telegram.sendMessage(
    assignment.pm.telegramId!,
    pmMessage,
    { parse_mode: 'MarkdownV2' }
  );
};

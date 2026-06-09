import { BotContext } from '../../../types/context';
import { prisma } from "../../../prisma/client";
import { assignmentRepository } from '../../../repositories/assignment.repository';

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
  });

  // Simpan alasan ke PostgreSQL
  await assignmentRepository.updateAssigneeLogReason(assignmentId, reason);

  // Hapus assignmentId dari session
  ctx.session.assignmentId = undefined;

  // Kirim pesan konfirmasi ke Assignee
  await ctx.reply(
    `${assigneeLog?.message}\n` +
      `----------------------------------------------------\n` +
      `Anda telah menolak tugas ini pada tanggal: ${respondDateFormatted}\n` +
      `Dengan alasan:\n${reason}`,
  );

  const dueFormatted = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  // Kirim notifikasi ke PM
  const pmMessage =
    `📦 Work Package: ${assignment.wpId} - ${assignment.wpName}\n` +
    `🗓️ Due Date: ${dueFormatted}\n\n` +
    `📁 Project: ${assignment.projectName}\n\n` +
    `Telah ditolak oleh ${assignment.assignee.name} pada tanggal ${respondDateFormatted}.\n` +
    `Dengan alasan:\n${reason}`;

  await ctx.telegram.sendMessage(assignment.pm.telegramId!, pmMessage);
};

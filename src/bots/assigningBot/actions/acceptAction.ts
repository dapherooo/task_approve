import { BotContext } from '../../../types/context';
import { assignmentRepository } from '../../../repositories/assignment.repository';
import { notionWpService } from '../../../services/notion.wp.service';
import { activityNotificationService } from '../../../services/activity.notification.service';

export const acceptAction = async (ctx: BotContext) => {
  try {
    const assignmentId = parseInt(ctx.match[1]);
    const respondAt = new Date();

    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ctx.answerCbQuery('❌ Data penugasan tidak ditemukan.');
    }

    // Update AssigneeLog di PostgreSQL
    await assignmentRepository.updateAssigneeLog(assignmentId, {
      respond: 'Accept',
      respondAt,
    });

    // Update status Assignment
    await assignmentRepository.updateStatus(assignment.id, 'ACCEPTED');

    // Update Notion
    if (assignment.notionPageId) {
      await notionWpService.updateAssigningRespond(
        assignment.notionPageId,
        'Accept',
      );
    }

    const respondDateFormatted = respondAt.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Edit pesan Assignee
    const assigneeLog =
      await assignmentRepository.findAssigneeLog(assignmentId);
    const updatedMessage =
      `${assigneeLog?.message}\n` +
      `----------------------------------------------------\n` +
      `Anda telah menerima tugas ini pada tanggal: ${respondDateFormatted}`;

    await ctx.editMessageText(updatedMessage);
    await ctx.answerCbQuery('✅ Tugas diterima!');

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
      `Telah diterima oleh ${assignment.assignee.name} pada tanggal ${respondDateFormatted}.`;

    await ctx.telegram.sendMessage(assignment.pm.telegramId!, pmMessage);

    // Tahap 5 - Kirim notifikasi ke masing-masing Assignee Activity
    await activityNotificationService.sendActivityNotifications({
      wpId: assignment.wpId,
      wpName: assignment.wpName,
      projectName: assignment.projectName,
      assignedAt: respondAt,
      sendMessage: async (telegramId, message) => {
        await ctx.telegram.sendMessage(telegramId, message);
      },
    });
  } catch (error) {
    console.error('❌ Error accept action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

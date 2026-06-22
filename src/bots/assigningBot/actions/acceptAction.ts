import { BotContext } from '../../../types/context';
import { assignmentRepository } from '../../../repositories/assignment.repository';
import { notionWpService } from '../../../services/notion.wp.service';
import { activityNotificationService } from '../../../services/activity.notification.service';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

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
      try {
        await notionWpService.updateAssigningRespond(
          assignment.notionPageId,
          'Accept',
        );
      } catch (notionError: any) {
        console.log('⚠️ Skip update Notion:', notionError?.message);
      }
    }

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
        })
      : '-';

    // Escape variabel dinamis
    const safeWpId = escapeMd(assignment.wpId);
    const safeWpName = escapeMd(assignment.wpName);
    const safeProject = escapeMd(assignment.projectName);
    const safeAssigneeName = escapeMd(assignment.assignee.name);
    const safeRespondDate = escapeMd(respondDateFormatted);
    const safeDue = escapeMd(dueFormatted);
    const formSubmitDeliverableLink = 'https://form.fillout.com/t/rMSmF6wknyus';

    // Edit pesan Assignee
    const assigneeLog = await assignmentRepository.findAssigneeLog(assignmentId);
    const originalMessage = assigneeLog?.message ?? '';
    const messageWithoutGreeting = originalMessage
      .split('\n')
      .slice(1)
      .join('\n')
      .trimStart();

    const updatedMessage =
      `Anda telah menerima tugas ini pada tanggal: ${safeRespondDate}\n\n` +
      `Untuk Submit Deliverable, silahkan klik link di bawah ini:\n` +
      `[Klik disini](${formSubmitDeliverableLink})\n\n` +
      `${messageWithoutGreeting}`;

    await ctx.editMessageText(updatedMessage, { parse_mode: 'MarkdownV2' });
    await ctx.answerCbQuery('✅ Tugas diterima!');

    // Kirim notifikasi ke PM
    const pmMessage =
      `*Penugasan Diterima\\!*\n\n` +
      `*Work Package:* ${safeWpId} \\- ${safeWpName}\n` +
      `*Due Date:* ${safeDue}\n\n` +
      `*Project:* ${safeProject}\n\n` +
      `Telah diterima oleh ${safeAssigneeName} pada tanggal ${safeRespondDate}\\.`;

    await ctx.telegram.sendMessage(
      assignment.pm.telegramId!,
      pmMessage,
      { parse_mode: 'MarkdownV2' }
    );

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

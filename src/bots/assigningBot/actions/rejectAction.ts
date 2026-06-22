import { BotContext } from '../../../types/context';
import { assignmentRepository } from '../../../repositories/assignment.repository';
import { notionWpService } from '../../../services/notion.wp.service';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const rejectAction = async (ctx: BotContext) => {
  try {
    const assignmentId = parseInt(ctx.match[1]);
    const respondAt = new Date();

    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ctx.answerCbQuery('❌ Data penugasan tidak ditemukan.');
    }

    await assignmentRepository.updateAssigneeLog(assignmentId, {
      respond: 'Reject',
      respondAt,
    });

    await assignmentRepository.updateStatus(assignment.id, 'REJECTED');

    if (assignment.notionPageId) {
      try {
        await notionWpService.updateAssigningRespond(
          assignment.notionPageId,
          'Reject',
        );
      } catch (notionError: any) {
        console.log('⚠️ Skip update Notion:', notionError?.message);
      }
    }

    await ctx.answerCbQuery('❌ Tugas ditolak.');

    if (!ctx.session) (ctx as any).session = {};
    ctx.session.assignmentId = assignmentId;

    // Escape variabel dinamis
    const safeWpId = escapeMd(assignment.wpId);
    const safeWpName = escapeMd(assignment.wpName);
    const safeProject = escapeMd(assignment.projectName);
    const safePmName = escapeMd(assignment.pm.name);

    const dueFormatted = assignment.dueDate
      ? new Date(assignment.dueDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Jakarta',
        })
      : '-';
    const safeDue = escapeMd(dueFormatted);
    const formSubmitDeliverableLink = 'https://form.fillout.com/t/rMSmF6wknyus';

    await ctx.editMessageText(
      `*Work Package:* ${safeWpId} \\- ${safeWpName}\n` +
      `*Due Date:* ${safeDue}\n\n` +
      `*Project:* ${safeProject}\n` +
      `*Project Manager:* ${safePmName}\n\n` +
      `Untuk info lebih lengkap, silahkan klik link di bawah ini:\n` +
      `[Klik disini](${formSubmitDeliverableLink})\n\n` +
      `----------------------------------------------------\n` +
      `Anda telah menolak tugas ini\\.\n\n` +
      `Silakan tuliskan alasan penolakan Anda:`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ Error reject action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

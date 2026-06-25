import { BotContext } from '../../../types/context';
import { assignmentRepository } from '../../../repositories/assignment.repository';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const rejectAction = async (ctx: BotContext) => {
  try {
    const assignmentId = parseInt(ctx.match[1]);

    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      return ctx.answerCbQuery('❌ Data penugasan tidak ditemukan.');
    }

    await ctx.answerCbQuery('❌ Penugasan akan ditolak.');

    if (!ctx.session) (ctx as any).session = {};
    ctx.session.assignmentId = assignmentId;

    // Simpan message_id untuk keperluan /cancel
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      ctx.session.assignmentMessageId = ctx.callbackQuery.message?.message_id;
    }

    const dueFormatted = assignment.dueDate
      ? new Date(assignment.dueDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Jakarta',
        })
      : '-';

    const safeWpId = escapeMd(assignment.wpId);
    const safeWpName = escapeMd(assignment.wpName);
    const safeProject = escapeMd(assignment.projectName);
    const safePmName = escapeMd(assignment.pm.name);
    const safeDue = escapeMd(dueFormatted);
    const formSubmitDeliverableLink = 'https://form.fillout.com/t/rMSmF6wknyus';

    await ctx.editMessageText(
      `*📦 Work Package:* ${safeWpId} \\- ${safeWpName}\n` +
      `*🗓️ Due Date:* ${safeDue}\n\n` +
      `*📁 Project:* ${safeProject}\n` +
      `*👤 Project Manager:* ${safePmName}\n\n` +
      `Untuk info lebih lengkap, silahkan klik link di bawah ini:\n` +
      `[Klik disini](${formSubmitDeliverableLink})\n\n` +
      `📝 Tolong ketikkan *alasan penolakan* Anda, lalu kirim:\n` +
      `_\\(Ketik /cancel untuk membatalkan\\)_`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ Error reject action:', error);
    await ctx.answerCbQuery('❌ Terjadi kesalahan.');
  }
};

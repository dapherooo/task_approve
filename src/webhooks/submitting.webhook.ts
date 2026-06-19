import 'dotenv/config';
import express from 'express';
import { notionSubmittingService } from '../services/notion.submitting.service';
import { submissionRepository } from '../repositories/submission.repository';
import { userRepository } from '../repositories/user.repository';

const router = express.Router();

function escapeMd(text: string): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

router.post('/webhook/notion/submitting', async (req, res) => {
  try {
    const body = req.body;
    console.log('📩 Webhook submitting diterima:', body.data?.id);

    const pageId = body.data?.id;
    if (!pageId) {
      return res.status(400).json({ message: 'Page ID tidak ditemukan' });
    }

    const submission = await notionSubmittingService.getSubmissionByPageId(pageId);
    if (!submission) {
      return res.status(404).json({ message: 'Data submission tidak ditemukan' });
    }

    console.log('📋 Submission data:', submission);

    const existing = await submissionRepository.findByNotionPageId(
      submission.notionPageId,
    );
    if (existing) {
      console.log('⏭️ Submission sudah ada di PostgreSQL, skip.');
      return res.status(200).json({ message: 'Sudah ada' });
    }

    const assignee = await userRepository.findByTelegramId(
      submission.assigneeTelegramId ?? '',
    );
    const user = await userRepository.findByTelegramId(
      submission.userTelegramId ?? '',
    );
    const pm = await userRepository.findByTelegramId(
      submission.pmTelegramId ?? '',
    );

    if (!assignee || !user || !pm) {
      console.log('❌ User tidak ditemukan di PostgreSQL');
      console.log('assignee:', assignee);
      console.log('user:', user);
      console.log('pm:', pm);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const saved = await submissionRepository.create({
      notionPageId: submission.notionPageId,
      wpName: submission.wpName,
      projectName: submission.projectName ?? undefined,
      submittedDate: submission.submittedDate
        ? new Date(submission.submittedDate)
        : undefined,
      pageLink: submission.pageLink ?? undefined,
      deliverableName: submission.deliverableName ?? undefined,
      assigneeId: assignee.id,
      userId: user.id,
      pmId: pm.id,
    });

    console.log('🔍 saved.id:', saved?.id);

    try {
      await notionSubmittingService.updateRespond(pageId, 'Submit');
      console.log('✅ Notion Responds updated to Submit');
    } catch (notionError: any) {
      console.error('❌ Gagal update Notion Responds:', notionError?.message);
    }

    const submittedDateFormatted = submission.submittedDate
      ? new Date(submission.submittedDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    const assigneeMessage =
      `Halo ${escapeMd(submission.assigneeName ?? '')}\n\n` +
      `*Tanggal Submit:* ${escapeMd(submittedDateFormatted)}\n` +
      `*Deliverable:* ${escapeMd(submission.deliverableName ?? '-')}\n` +
      `*User:* ${escapeMd(submission.userName ?? '')}\n` +
      `*Work Package:* ${escapeMd(submission.wpName ?? '')}\n` +
      `*Project:* ${escapeMd(submission.projectName ?? '')}\n\n` +
      `Telah berhasil dikirim untuk proses approval\\.\n` +
      `Mohon tunggu notifikasi selanjutnya\\.`;

    const userMessage =
      `*Permintaan Approval Deliverable*\n\n` +
      `*Tanggal Submit:* ${escapeMd(submittedDateFormatted)}\n` +
      `*Deliverable:* ${escapeMd(submission.deliverableName ?? '-')}\n` +
      `*Assignee:* ${escapeMd(submission.assigneeName ?? '')}\n` +
      `*Work Package:* ${escapeMd(submission.wpName ?? '')}\n` +
      `*Project:* ${escapeMd(submission.projectName ?? '')}\n\n` +
      `Untuk info lebih lengkap klik link dibawah ini:\n` +
      `*Link:* ${escapeMd(submission.pageLink ?? '')}`;

    console.log('🔍 assigneeMessage length:', assigneeMessage?.length);
    console.log('🔍 userMessage length:', userMessage?.length);

    try {
      await submissionRepository.createAssigneeLog({
        submissionId: saved.id,
        message: assigneeMessage,
      });
      console.log('✅ AssigneeLog tersimpan');
    } catch (logError: any) {
      console.error('❌ Gagal simpan assigneeLog:', logError?.message);
    }

    try {
      await submissionRepository.createUserLog({
        submissionId: saved.id,
        message: userMessage,
      });
      console.log('✅ UserLog tersimpan');
    } catch (logError: any) {
      console.error('❌ Gagal simpan userLog:', logError?.message);
    }

    const { submittingBot } = await import('../main');

    try {
      await submittingBot.telegram.sendMessage(
        submission.assigneeTelegramId!,
        assigneeMessage,
        { parse_mode: 'MarkdownV2' }
      );
      console.log('✅ Telegram assignee terkirim');
    } catch (tgError: any) {
      console.error('❌ Gagal kirim telegram assignee:', tgError?.message);
    }

    try {
      await submittingBot.telegram.sendMessage(
        submission.userTelegramId!,
        userMessage,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_${saved.id}` },
                { text: '❌ Decline', callback_data: `decline_${saved.id}` },
              ],
            ],
          },
        },
      );
      console.log('✅ Telegram user terkirim');
    } catch (tgError: any) {
      console.error('❌ Gagal kirim telegram user:', tgError?.message);
    }

    return res.status(200).json({ message: 'Submission berhasil diproses' });

  } catch (error) {
    console.error('❌ Error webhook submitting:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as submittingWebhookRouter };

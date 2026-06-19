import 'dotenv/config';
import express from 'express';
import { notionSubmittingService } from '../services/notion.submitting.service';
import { submissionRepository } from '../repositories/submission.repository';
import { userRepository } from '../repositories/user.repository';

const router = express.Router();

router.post('/webhook/notion/submitting', async (req, res) => {
  try {
    const body = req.body;
    console.log('📩 Webhook submitting diterima:', body.data?.id);

    const pageId = body.data?.id;
    if (!pageId) {
      return res.status(400).json({ message: 'Page ID tidak ditemukan' });
    }

    // Ambil data dari Notion
    const submission = await notionSubmittingService.getSubmissionByPageId(pageId);
    if (!submission) {
      return res.status(404).json({ message: 'Data submission tidak ditemukan' });
    }

    console.log('📋 Submission data:', submission);

    // Cek apakah sudah ada di PostgreSQL
    const existing = await submissionRepository.findByNotionPageId(
      submission.notionPageId,
    );
    if (existing) {
      console.log('⏭️ Submission sudah ada di PostgreSQL, skip.');
      return res.status(200).json({ message: 'Sudah ada' });
    }

    // Cari user di PostgreSQL by telegramId
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

    // Simpan ke PostgreSQL
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

    // Update Notion Responds → Submit
    try {
      await notionSubmittingService.updateRespond(pageId, 'Submit');
      console.log('✅ Notion Responds updated to Submit');
    } catch (notionError: any) {
      console.error('❌ Gagal update Notion Responds:', notionError?.message);
    }

    // Format tanggal
    const submittedDateFormatted = submission.submittedDate
      ? new Date(submission.submittedDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    // Pesan ke Assignee
    const assigneeMessage =
      `Halo ${submission.assigneeName}\n\n` +
      `<b>Tanggal Submit:</b> ${submittedDateFormatted}\n` +
      `<b>Deliverable:</b> ${submission.deliverableName ?? '-'}\n` +
      `<b>User:</b> ${submission.userName}\n` +
      `<b>Work Package:</b> ${submission.wpName}\n` +      
      `<b>Project:</b> ${submission.projectName}\n\n` +
      `Telah berhasil dikirim untuk proses approval.\n` +
      `Mohon tunggu notifikasi selanjutnya.`;

    function escapeHtml(text: string): string {
      return text
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;');
    }
    // Pesan ke User (approval request)
    const userMessage =
      `<b>Permintaan Approval Deliverable</b>\n\n` +
      `<b>Tanggal Submit:</b> ${submittedDateFormatted}\n` +
      `<b>Deliverable:</b> ${submission.deliverableName ?? '-'}\n` +
      `<b>Assignee:</b> ${submission.assigneeName}\n` +
      `<b>Work Package:</b> ${submission.wpName}\n` +      
      `<b>Project:</b> ${submission.projectName}\n\n` +
      `Untuk info lebih lengkap klik link dibawah ini:\n` +
      `<b>Link:</b> ${submission.pageLink}`;

    console.log('🔍 assigneeMessage length:', assigneeMessage?.length);
    console.log('🔍 userMessage length:', userMessage?.length);

    // Simpan AssigneeLog
    try {
      await submissionRepository.createAssigneeLog({
        submissionId: saved.id,
        message: assigneeMessage,
        { parse_mode: 'HTML' }
      });
      console.log('✅ AssigneeLog tersimpan');
    } catch (logError: any) {
      console.error('❌ Gagal simpan assigneeLog:', logError?.message);
    }

    // Simpan UserLog
    try {
      await submissionRepository.createUserLog({
        submissionId: saved.id,
        message: userMessage,
      });
      console.log('✅ UserLog tersimpan');
    } catch (logError: any) {
      console.error('❌ Gagal simpan userLog:', logError?.message);
    }

    // Kirim telegram
    const { submittingBot } = await import('../main');

    try {
      await submittingBot.telegram.sendMessage(
        submission.assigneeTelegramId!,
        assigneeMessage,
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
          parse_mode: `HTML`,
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

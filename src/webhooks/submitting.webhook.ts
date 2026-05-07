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
    const submission =
      await notionSubmittingService.getSubmissionByPageId(pageId);
    if (!submission) {
      return res
        .status(404)
        .json({ message: 'Data submission tidak ditemukan' });
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
      deliverableName: submission.deliverableName ?? undefined, // ← tambah
      assigneeId: assignee.id,
      userId: user.id,
      pmId: pm.id,
    });

    // Update Notion Responds → Submit
    await notionSubmittingService.updateRespond(pageId, 'Submit');

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
      `📋 Deliverable: ${submission.deliverableName ?? '-'}\n\n` +
      `📦 Work Package: ${submission.wpName}\n` +
      `🗓️ Tanggal Submit: ${submittedDateFormatted}\n\n` +
      `📁 Project: ${submission.projectName}\n\n` +
      `Telah berhasil dikirim ke ${submission.userName} untuk proses approval.\n` +
      `Mohon tunggu notifikasi selanjutnya.`;

    // Pesan ke User (approval request)
    const userMessage =
      `⚠️ Permintaan Approval Deliverable\n\n` +
      `Halo ${submission.userName}, mohon periksa deliverable berikut:\n\n` +
      `📋 Deliverable: ${submission.deliverableName ?? '-'}\n\n` +
      `📦 Work Package: ${submission.wpName}\n` +
      `🗓️ Tanggal Submit: ${submittedDateFormatted}\n\n` +
      `📁 Project: ${submission.projectName}\n\n` +
      `Untuk info lebih lengkap klik link dibawah ini:\n` +
      `🔗 Link: ${submission.pageLink}\n\n` +
      `Apakah deliverable ini disetujui?`;

    // Simpan log
    await submissionRepository.createAssigneeLog({
      submissionId: saved.id,
      message: assigneeMessage,
    });

    await submissionRepository.createUserLog({
      submissionId: saved.id,
      message: userMessage,
    });

    // Kirim telegram - import bot instance dari main
    const { submittingBot } = await import('../main');

    await submittingBot.telegram.sendMessage(
      submission.assigneeTelegramId!,
      assigneeMessage,
    );

    await submittingBot.telegram.sendMessage(
      submission.userTelegramId!,
      userMessage,
      {
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

    return res.status(200).json({ message: 'Submission berhasil diproses' });
  } catch (error) {
    console.error('❌ Error webhook submitting:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as submittingWebhookRouter };

import { notionWpService } from './notion.wp.service';
import { userRepository } from '../repositories/user.repository';
import { assignmentRepository } from '../repositories/assignment.repository';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const assignmentService = {
  processAssignment: async (wpId: string, pmTelegramId: string) => {
    const failed = (message: string) => ({
      success: false as const,
      message,
      assignment: null,
      pmMessage: null,
      assigneeMessage: null,
      assigneeTelegramId: null,
    });

    // Tahap 1
    const wp = await notionWpService.findWPById(wpId);
    if (!wp) return failed('❌ ID WP tidak ditemukan.');

    if (wp.pmTelegramId !== pmTelegramId)
      return failed(
        '⛔ Akses ditolak. Anda bukan Project Manager dari WP ini.',
      );

    const existing = await notionWpService.findAssigningByWpId(wpId);
    if (existing && existing.respond === 'Accept') {
      const date = existing.assignedAt
        ? new Date(existing.assignedAt).toLocaleString('id-ID')
        : '-';
      return failed(
        `⚠️ Work Package Sudah Ditugaskan\n\n` +
          `Work Package ${wpId} sudah dalam proses penugasan.\n` +
          `Tanggal: ${date}\n\n` +
          `Anda tidak bisa menugaskan ulang Work Package yang sudah berjalan ` +
          `(kecuali status sebelumnya ditolak).`,
      );
    }

    const existingInDB = await assignmentRepository.findByWpId(wpId);
    if (
      existingInDB &&
      (existingInDB.status === 'PENDING' || existingInDB.status === 'ACCEPTED')
    ) {
      return failed(
        `⚠️ Work Package Sudah Ditugaskan\n\n` +
          `Work Package ${wpId} sudah dalam proses penugasan.\n` +
          `Tanggal: ${existingInDB.assignedAt.toLocaleString('id-ID')}\n\n` +
          `Anda tidak bisa menugaskan ulang Work Package yang sudah berjalan ` +
          `(kecuali status sebelumnya ditolak).`,
      );
    }

    /// Tahap 2
    const pm = await userRepository.findByTelegramId(pmTelegramId);
    if (!pm) return failed('❌ Data PM tidak ditemukan di database.');

    const assignee = await userRepository.findByTelegramId(
      wp.assigneeTelegramId ?? '',
    );
    if (!assignee)
      return failed('❌ Data Assignee tidak ditemukan di database.');

    // Simpan ke Notion DULU untuk dapat notionPageId
    const notionPageId = await notionWpService.createAssigning({
      wpNotionPageId: wp.notionPageId,
    });

    // Simpan ke PostgreSQL dengan notionPageId
    const assignment = await assignmentRepository.create({
      notionPageId, // ← tambahkan ini
      wpId: wp.id,
      wpName: wp.wpName,
      projectName: wp.projectName ?? undefined,
      dueDate: wp.dueDate ? new Date(wp.dueDate) : undefined,
      linkPage: wp.linkPage ?? undefined,
      pmId: pm.id,
      assigneeId: assignee.id,
    });

    const dueFormatted = wp.dueDate
      ? new Date(wp.dueDate).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          // hour: '2-digit',
          //minute: '2-digit',
        })
      : '-';

    const safeWpId = escapeMd(wpId);
    const safeWpName = escapeMd(wp.wpName);
    const safeProject = escapeMd(wp.projectName);
    const safeAssigneeName = escapeMd(assignee.name);
    const safePmName = escapeMd(pm.name);
    const safeDue = escapeMd(dueFormatted);
    const safeLinkPage = wp.linkPage ?? '';

    const pmMessage =
      `*Penugasan Berhasil!*\n\n` +
      `*Work Package:* ${wpId} - ${wp.wpName}\n` +
      `*Project:* ${wp.projectName}\n\n` +
      `Menunggu respon dari Assignee: ${assignee.name}.`;

    const assigneeMessage =
      `Halo ${assignee.name}, ada penugasan baru untuk.\n\n` +
      `*Work Package:* ${wpId} - ${wp.wpName}\n` +
      `*Due Date:* ${dueFormatted}\n\n` +
      `*Project:* ${wp.projectName}\n` +
      `*Project Manager:* ${pm.name}\n\n` +
      `Untuk info lebih lengkap, silahkan klik link di bawah ini:\n` +
      `[Klik disini](${safeLinkPage})\n\n` +
      `Apakah anda menerima tugas ini?`;

    await assignmentRepository.createPMLog({
      assignmentId: assignment.id,
      message: pmMessage,
    });

    await assignmentRepository.createAssigneeLog({
      assignmentId: assignment.id,
      message: assigneeMessage,
    });

    return {
      success: true as const,
      message: null,
      assignment,
      pmMessage,
      assigneeMessage,
      assigneeTelegramId: wp.assigneeTelegramId ?? '',
    };
  },
};

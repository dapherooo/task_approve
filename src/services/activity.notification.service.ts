import { notionWpService } from './notion.wp.service';

export const activityNotificationService = {
  sendActivityNotifications: async (data: {
    wpId: string;
    wpName: string;
    projectName: string | null;
    assignedAt: Date;
    sendMessage: (telegramId: string, message: string) => Promise<void>;
  }) => {
    // Cari semua activity di bawah WP ini
    const activities = await notionWpService.findActivitiesByParentId(
      data.wpId,
    );

    if (activities.length === 0) {
      console.log(`ℹ️ Tidak ada activity di bawah WP ${data.wpId}`);
      return;
    }

    const assignedAtFormatted = data.assignedAt.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    console.log(`📨 Mengirim notifikasi ${activities.length} activity...`);

    for (const activity of activities) {
      if (!activity.assigneeTelegramId) {
        console.log(
          `⚠️ Activity ${activity.id} tidak punya Assignee Tele ID, skip.`,
        );
        continue;
      }

      const message =
        `📋 Activity: ${activity.activityName}\n` +
        `📦 Work Package: ${data.wpId} - ${data.wpName}\n` +
        `📁 Project: ${data.projectName}\n\n` +
        `Telah ditugaskan kepada ${activity.assigneeName}\n` +
        `🗓️ Pada tanggal: ${assignedAtFormatted}`;

      try {
        await data.sendMessage(activity.assigneeTelegramId, message);
        console.log(
          `✅ Notifikasi terkirim ke ${activity.assigneeName} (${activity.assigneeTelegramId})`,
        );
      } catch (error) {
        console.error(
          `❌ Gagal kirim ke ${activity.assigneeTelegramId}:`,
          error,
        );
      }
    }
  },
};

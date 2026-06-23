import { notionWpService } from './notion.wp.service';

function escapeMd(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export const activityNotificationService = {
  sendActivityNotifications: async (data: {
    wpId: string;
    wpName: string;
    projectName: string | null;
    assignedAt: Date;
    sendMessage: (telegramId: string, message: string, options?: any) => Promise<void>;
  }) => {
    const activities = await notionWpService.findActivitiesByParentId(data.wpId);

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
      timeZone: 'Asia/Jakarta',
    });

    const safeWpId = escapeMd(data.wpId);
    const safeWpName = escapeMd(data.wpName);
    const safeProject = escapeMd(data.projectName);
    const safeDate = escapeMd(assignedAtFormatted);

    console.log(`📨 Mengirim notifikasi ${activities.length} activity...`);

    for (const activity of activities) {
      if (!activity.assigneeTelegramId) {
        console.log(`⚠️ Activity ${activity.id} tidak punya Assignee Tele ID, skip.`);
        continue;
      }

      const safeActivityName = escapeMd(activity.activityName);
      const safeAssigneeName = escapeMd(activity.assigneeName);

      const message =
        `*Activity:* ${safeActivityName}\n\n` +
        `*Work Package:* ${safeWpId} \\- ${safeWpName}\n` +
        `*Project:* ${safeProject}\n\n` +
        `Telah ditugaskan kepada ${safeAssigneeName}\n` +
        `*Pada tanggal:* ${safeDate}`;

      try {
        await data.sendMessage(
          activity.assigneeTelegramId,
          message,
          { parse_mode: 'MarkdownV2' }
        );
        console.log(`✅ Notifikasi terkirim ke ${activity.assigneeName} (${activity.assigneeTelegramId})`);
      } catch (error) {
        console.error(`❌ Gagal kirim ke ${activity.assigneeTelegramId}:`, error);
      }
    }
  },
};

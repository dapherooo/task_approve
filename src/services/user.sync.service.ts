import { notionUserService } from './notion.user.service';
import { userRepository } from '../repositories/user.repository';

export const userSyncService = {
  syncFromNotion: async () => {
    const notionUsers = await notionUserService.getUsers();

    let synced = 0;
    for (const user of notionUsers) {
      if (!user.notionUserId) continue;
      await userRepository.upsertUser(user);
      synced++;
    }

    console.log(`✅ Sync selesai: ${synced} user berhasil disimpan`);
    return synced;
  },
};

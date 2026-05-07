import 'dotenv/config';
import { userSyncService } from '../services/user.sync.service';
import { userRepository } from '../repositories/user.repository';

async function main() {
  console.log('🔄 Mulai sync dari Notion...');
  await userSyncService.syncFromNotion();

  const users = await userRepository.findAll();
  console.log('📋 Data di PostgreSQL:', JSON.stringify(users, null, 2));
}

main().catch(console.error);

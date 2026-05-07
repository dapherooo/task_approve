import 'dotenv/config';
import { notionUserService } from '../services/notion.user.service';

async function main() {
  const users = await notionUserService.getUsers();
  console.log('📋 Data dari Notion:', JSON.stringify(users, null, 2));
}

main().catch(console.error);

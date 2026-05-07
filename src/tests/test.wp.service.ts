import 'dotenv/config';
import { notionWpService } from '../services/notion.wp.service';

async function main() {
  const wpId = 'AFC-001/1.1.1';

  console.log('🔍 Mencari WP:', wpId);
  const wp = await notionWpService.findWPById(wpId);
  console.log('📦 WP Data:', JSON.stringify(wp, null, 2));

  console.log('\n🔍 Cek di Assigning Database...');
  const assigning = await notionWpService.findAssigningByWpId(wpId);
  console.log('📋 Assigning Data:', JSON.stringify(assigning, null, 2));
}

main().catch(console.error);

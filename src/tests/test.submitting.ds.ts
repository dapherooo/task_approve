// src/tests/test.submitting.ds.ts
import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function main() {
  const db = await notion.databases.retrieve({
    database_id: process.env.SUBMITTING_DATABASE_ID!,
  });
  console.log('Submitting DS ID:', (db as any).data_sources?.[0]?.id);
}

main().catch(console.error);

import 'dotenv/config';
import express from 'express';
import { userRepository } from '../repositories/user.repository';
import { NotionWebhookPayload } from '../types/index';

const app = express();
app.use(express.json());

app.post('/webhook/notion/user', async (req, res) => {
  try {
    const body = req.body as NotionWebhookPayload;
    console.log('📩 Webhook diterima dari page:', body.data?.id);

    const data = body.data;
    if (!data || data.object !== 'page') {
      return res.status(400).json({ message: 'Bukan page object' });
    }

    // Cek checkbox PostgreSQL = true
    const isPostgreSQL = data.properties?.PostgreSQL?.checkbox === true;
    if (!isPostgreSQL) {
      console.log('⏭️ Checkbox PostgreSQL tidak dicentang, skip.');
      return res.status(200).json({ message: 'Skip, checkbox tidak aktif' });
    }

    const props = data.properties;

    const user = {
      notionUserId: data.id.replace(/-/g, ''),
      name: props['name']?.title?.[0]?.plain_text ?? null,
      notionEmail: props['notion email']?.rich_text?.[0]?.plain_text ?? null,
      telegramId: props['telegram id']?.rich_text?.[0]?.plain_text ?? null,
      employeeId: props['employee id']?.rich_text?.[0]?.plain_text ?? null,
    };

    console.log('👤 Data user:', user);

    const existing = await userRepository.findByNotionUserId(user.notionUserId);
    if (existing) {
      console.log(`⏭️ User sudah ada di PostgreSQL: ${user.name}`);
      return res
        .status(200)
        .json({ message: 'User sudah ada', user: existing });
    }

    const saved = await userRepository.upsertUser(user);
    console.log(`✅ User berhasil disimpan: ${saved.name}`);

    return res
      .status(200)
      .json({ message: 'User berhasil disimpan', user: saved });
  } catch (error) {
    console.error('❌ Error webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Webhook server berjalan!');
});

export { app };

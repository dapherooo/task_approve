import 'dotenv/config';
import { app } from './webhooks/user.notion.webhook';
import { submittingWebhookRouter } from './webhooks/submitting.webhook';
import { createAssigningBot } from './bots/assigningBot';
import { createSubmittingBot } from './bots/submittingBot';
import { Telegraf } from 'telegraf';
import { BotContext } from './types/context';

const PORT = process.env.PORT || 3000;

// Export kedua instance bot di global scope
export const assigningBot: Telegraf<BotContext> = createAssigningBot(
  process.env.ASSIGNING_BOT_TOKEN!,
);

export const submittingBot: Telegraf<BotContext> = createSubmittingBot(
  process.env.SUBMITTING_BOT_TOKEN!,
);

// Webhook server
app.use(submittingWebhookRouter);
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

// Jalankan Bot launch hanya jika SKIP_BOT_LAUNCH tidak diaktifkan
if (process.env.SKIP_BOT_LAUNCH === 'true') {
  console.log('⚠️ SKIP_BOT_LAUNCH is true. Skipping Telegram bots launch.');
} else {
  // Launch Assigning Bot
  assigningBot
    .launch()
    .then(() => {
      console.log('✅ Assigning Bot aktif');
    })
    .catch((error) => {
      console.warn('⚠️  Assigning Bot failed to launch:', (error as Error).message);
    });

  // Launch Submitting Bot
  submittingBot
    .launch()
    .then(() => {
      console.log('✅ Submitting Bot aktif');
    })
    .catch((error) => {
      console.warn('⚠️  Submitting Bot failed to launch:', (error as Error).message);
    });

  // Graceful stop
  process.once('SIGINT', () => {
    try { assigningBot?.stop('SIGINT'); } catch {}
    try { submittingBot?.stop('SIGINT'); } catch {}
  });

  process.once('SIGTERM', () => {
    try { assigningBot?.stop('SIGTERM'); } catch {}
    try { submittingBot?.stop('SIGTERM'); } catch {}
  });
}

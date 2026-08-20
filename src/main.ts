import 'dotenv/config';
import { app } from './webhooks/user.notion.webhook';
import { submittingWebhookRouter } from './webhooks/submitting.webhook';
import { createAssigningBot } from './bots/assigningBot';
import { createSubmittingBot } from './bots/submittingBot';

const PORT = process.env.PORT || 3000;

// Submitting Bot
export const submittingBot = createSubmittingBot(
  process.env.SUBMITTING_BOT_TOKEN!,
);

// Webhook server
app.use(submittingWebhookRouter);
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

// Jalankan Bot hanya jika SKIP_BOT_LAUNCH tidak diaktifkan
if (process.env.SKIP_BOT_LAUNCH === 'true') {
  console.log('⚠️ SKIP_BOT_LAUNCH is true. Skipping Telegram bots launch.');
} else {
  // Assigning Bot
  const assigningBot = createAssigningBot(process.env.ASSIGNING_BOT_TOKEN!);
  assigningBot
    .launch()
    .then(() => {
      console.log('✅ Assigning Bot aktif');
    })
    .catch((error) => {
      console.warn('⚠️  Assigning Bot failed to launch:', (error as Error).message);
    });

  // Submitting Bot
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
    try {
      if (assigningBot) assigningBot.stop('SIGINT');
    } catch (error) {
      // Ignore
    }
    try {
      if (submittingBot) submittingBot.stop('SIGINT');
    } catch (error) {
      // Ignore
    }
  });

  process.once('SIGTERM', () => {
    try {
      if (assigningBot) assigningBot.stop('SIGTERM');
    } catch (error) {
      // Ignore
    }
    try {
      if (submittingBot) submittingBot.stop('SIGTERM');
    } catch (error) {
      // Ignore
    }
  });
}

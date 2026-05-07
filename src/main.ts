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

// Assigning Bot
const assigningBot = createAssigningBot(process.env.ASSIGNING_BOT_TOKEN!);
assigningBot.launch();
console.log('✅ Assigning Bot aktif');

// Submitting Bot
submittingBot.launch();
console.log('✅ Submitting Bot aktif');

// Graceful stop
process.once('SIGINT', () => {
  assigningBot.stop('SIGINT');
  submittingBot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  assigningBot.stop('SIGTERM');
  submittingBot.stop('SIGTERM');
});

/**
 * Hue Hunt - Main Server & Bot Runner
 */

require('dotenv').config();
const app = require('./server/server.js');
const { createBot } = require('./server/bot.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🎨 HUE HUNT - TELEGRAM MINI APP SERVER`);
  console.log(`=================================================`);
  console.log(`🌐 Web App running at: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏆 Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
  console.log(`=================================================`);
});

// Start bot if token is configured
if (process.env.BOT_TOKEN) {
  try {
    const bot = createBot();
    if (bot) {
      bot.launch()
        .then(() => {
          console.log(`🤖 Telegram Bot @Colorfulgame_bot connected and polling!`);
        })
        .catch((err) => {
          console.error(`⚠️ Telegram Bot error:`, err.message);
        });

      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }
  } catch (err) {
    console.error(`⚠️ Telegram Bot failed to initialize:`, err.message);
  }
} else {
  console.log(`ℹ️ Bot token not configured yet. Set BOT_TOKEN in .env to connect @Colorfulgame_bot.`);
}

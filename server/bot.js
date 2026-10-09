/**
 * Hue Hunt - Telegram Bot Service (@Colorfulgame_bot)
 * Built with Telegraf. Handles Mini App launch, inline challenges, and bot commands.
 */

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://colorfulgame.example.com';
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');

if (!BOT_TOKEN) {
  console.warn('⚠️ BOT_TOKEN is not set in environment or .env file.');
  console.warn('ℹ️ To run @Colorfulgame_bot:');
  console.warn('   1. Create your bot with @BotFather on Telegram.');
  console.warn('   2. Copy the token into your .env file as BOT_TOKEN=your_token_here');
  console.warn('   3. Set WEBAPP_URL=https://your-domain-or-ngrok-url.com');
  console.warn('   4. Run: npm run bot\n');
}

function getTopScores(mode = 'endless', limit = 5) {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const list = data[mode] || [];
      return list.sort((a, b) => b.score - a.score).slice(0, limit);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

function createBot() {
  if (!BOT_TOKEN) return null;

  const bot = new Telegraf(BOT_TOKEN);

  // Command: /start
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'Player';
    const welcomeText = 
      `🎨 <b>Welcome to Hue Hunt, ${firstName}!</b>\n\n` +
      `<b>One finger. One objective. Beat your best score.</b>\n\n` +
      `⚡ <b>How to play:</b>\n` +
      `• Spot the 1 odd shade tile in the 3×3 grid\n` +
      `• Tap before the timer runs out\n` +
      `• Build 5+ combo streaks for score multipliers\n` +
      `• You have 3 lives—don't waste them!\n\n` +
      `Ready to test your color perception? Tap below to play! 👇`;

    return ctx.replyWithHTML(
      welcomeText,
      Markup.inlineKeyboard([
        [
          Markup.button.webApp('🎮 Play Hue Hunt', WEBAPP_URL)
        ],
        [
          Markup.button.callback('🏆 Leaderboard', 'view_leaderboard'),
          Markup.button.switchToChat('⚔️ Challenge Friend', 'Can you beat my score in Hue Hunt? 🎨🔥')
        ]
      ])
    );
  });

  // Action: view_leaderboard
  bot.action('view_leaderboard', async (ctx) => {
    await ctx.answerCbQuery();
    const scores = getTopScores('endless', 5);
    let msg = `🏆 <b>Hue Hunt — Top Masters</b>\n\n`;

    if (scores.length === 0) {
      msg += `No scores recorded yet. Be the first to set a record!\n`;
    } else {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      scores.forEach((s, i) => {
        const medal = medals[i] || '•';
        const name = s.name || s.username || 'Player';
        msg += `${medal} <b>${name}</b>: ${s.score} pts\n`;
      });
    }

    msg += `\nPlay now to claim your spot on the podium!`;

    return ctx.replyWithHTML(
      msg,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎮 Play Now', WEBAPP_URL)]
      ])
    );
  });

  // Command: /leaderboard
  bot.command('leaderboard', async (ctx) => {
    const scores = getTopScores('endless', 5);
    let msg = `🏆 <b>Hue Hunt — Top Masters</b>\n\n`;

    if (scores.length === 0) {
      msg += `No scores recorded yet. Be the first to set a record!\n`;
    } else {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      scores.forEach((s, i) => {
        const medal = medals[i] || '•';
        const name = s.name || s.username || 'Player';
        msg += `${medal} <b>${name}</b>: ${s.score} pts\n`;
      });
    }

    return ctx.replyWithHTML(
      msg,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎮 Launch Mini App', WEBAPP_URL)]
      ])
    );
  });

  // Command: /help
  bot.command('help', async (ctx) => {
    const helpText =
      `🕹️ <b>Hue Hunt Help & Guide</b>\n\n` +
      `<b>Rules:</b>\n` +
      `1. A 3×3 grid appears. 8 tiles are the same shade, and 1 is slightly different.\n` +
      `2. Tap the odd tile before the timer expires.\n` +
      `3. Each correct tap extends your timer and earns points.\n` +
      `4. Every 5 consecutive correct answers increases your combo multiplier (up to 4x).\n` +
      `5. You start with 3 lives. Mistakes deduct 1 life and 2.5s.\n\n` +
      `📅 <b>Daily Challenge:</b> Every player in the world plays the identical sequence of colors today.\n\n` +
      `Need to report a bug or share feedback? Visit @Colorfulgame_bot!`;

    return ctx.replyWithHTML(
      helpText,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎮 Start Playing', WEBAPP_URL)]
      ])
    );
  });

  // Inline Query Handler for sharing score cards directly inside any chat
  bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query || '';
    const results = [
      {
        type: 'article',
        id: 'challenge_friend',
        title: '🎨 Challenge a Friend in Hue Hunt',
        description: 'Send an interactive score challenge to this chat!',
        input_message_content: {
          message_text: `🔥 <b>Hue Hunt Challenge!</b>\n\nI bet you can't beat my score in @Colorfulgame_bot! Spot the odd color shade and test your reflexes. 👁️🎨`,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⚔️ Accept Challenge', web_app: { url: WEBAPP_URL } }
            ]
          ]
        }
      }
    ];

    return ctx.answerInlineQuery(results, { cache_time: 10 });
  });

  return bot;
}

if (require.main === module) {
  const bot = createBot();
  if (bot) {
    bot.launch()
      .then(() => {
        console.log('🤖 Telegram Bot @Colorfulgame_bot is now active and listening for messages!');
      })
      .catch((err) => {
        console.error('❌ Failed to launch Telegram Bot:', err.message);
      });

    // Graceful stop handlers
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
}

module.exports = { createBot };

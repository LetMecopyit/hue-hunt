# 🎨 Hue Hunt — Telegram Mini App (@Colorfulgame_bot)

> **One finger. One objective. Beat your best score.**  
> A fast, addictive Telegram Mini App built around one pure mechanic: spot the different color shade and tap it before time runs out.

---

## 🌟 Game Highlights & Features

- **⚡ Endless Mode**: Continuous gameplay with escalating difficulty. Delta color difference scales down smoothly from 22% toward a tuned perceptual limit (2.8%) so rounds remain fast and challenging without becoming impossible.
- **⏱️ Adrenaline Time Bank**: Starts at 15s. Correct taps add bonus time (+1.0s to +1.25s). Wrong taps deduct 2.5s and 1 life!
- **❤️ 3 Lives System**: One mistake does not immediately ruin a high-score run.
- **🔥 Combo Multiplier Streaks**: Every 5 consecutive correct answers increases the score multiplier (1.5x at 5, 2.0x at 10, 3.0x at 15, 4.0x at 20).
- **📅 Daily Challenge**: Seeded with `Mulberry32` PRNG using the current date (`YYYY-MM-DD`). Every player on earth gets the exact same color puzzle sequence that day for 100% fair competition.
- **🏆 Global Leaderboard**: Real-time ranks for both Endless and Daily modes, with player tags, medals, and high scores.
- **⚔️ Telegram Social Sharing**: One-tap score sharing directly into any Telegram chat with customized challenge cards.
- **🔊 Zero-Latency Audio Synthesis**: Built with the Web Audio API—custom procedural sound effects for taps, combos, mistakes, and game-over fanfares without needing any external audio file downloads.
- **♿ Accessibility (Pattern Assist)**: Optional toggle in settings that adds a subtle geometric symbol to the odd tile so players with color-blindness or under bright daylight can enjoy the game effortlessly.
- **📱 Telegram WebApp Native**: Responsive dark neon design, viewport auto-expansion, haptic feedback (`impactOccurred`, `notificationOccurred`), and safe area support.

---

## 📁 Project Architecture

```
tg color bot/
├── index.js                     # Root runner (starts Express API & Telegraf bot)
├── package.json                 # Dependencies and npm scripts
├── .env.example                 # Environment variable template
├── .env                         # Active configuration
├── server/
│   ├── server.js                # Express REST API (/api/leaderboard, /api/score, /api/health)
│   ├── bot.js                   # Telegraf bot handler for @Colorfulgame_bot (/start, /help, inline queries)
│   └── data/
│       └── leaderboard.json     # Persistent storage for high scores
└── public/
    ├── index.html               # Main Telegram Mini App UI
    ├── css/
    │   └── style.css            # Dark arcade glassmorphic styling & micro-animations
    └── js/
        ├── app.js               # Application coordinator & DOM controller
        ├── game.js              # Core game loop (lives, timer, combos, scoring)
        ├── colors.js            # HSL color engine & Mulberry32 daily PRNG
        ├── audio.js             # Web Audio API sound generator
        ├── telegram.js          # Telegram WebApp SDK & haptic feedback wrapper
        ├── leaderboard.js       # Score synchronization & local caching
        └── confetti.js          # Lightweight canvas celebratory particles
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
BOT_TOKEN=your_botfather_token_here
WEBAPP_URL=https://letmecopyit.github.io/hue-hunt/
PORT=3000
```

### 3. Live Deployment
The game is deployed and live on **GitHub Pages**:  
👉 **[https://letmecopyit.github.io/hue-hunt/](https://letmecopyit.github.io/hue-hunt/)**

### 4. Local Development Server
```bash
npm start
```
The game will be available locally at `http://localhost:3000`.

---

## 🤖 Connecting to Telegram (@Colorfulgame_bot)

To attach this Mini App to your bot `@Colorfulgame_bot`:

### Step 1: Get Bot Token from BotFather
1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/mybots` and select `@Colorfulgame_bot` (or `/newbot` if not yet registered).
3. Select **API Token** and copy the token into your `.env` file as `BOT_TOKEN=...`.

### Step 2: Set the Mini App URL in BotFather
Because Telegram Mini Apps require an HTTPS URL:
1. If testing locally, expose port 3000 using **ngrok** or **Cloudflare Tunnel**:
   ```bash
   npx ngrok http 3000
   ```
   Copy the `https://xxxx.ngrok-free.app` URL.
2. In [@BotFather](https://t.me/BotFather), send `/mybots` -> select `@Colorfulgame_bot`.
3. Choose **Bot Settings** -> **Menu Button** -> **Configure Menu Button**.
4. Enter the URL of your Web App (e.g. `https://xxxx.ngrok-free.app`).
5. Set the button title to: `🎮 Play Hue Hunt`.

### Step 3: Run the Bot
```bash
npm start
```
When players send `/start` to `@Colorfulgame_bot`, they will see an interactive launch card with the WebApp button `🎮 Play Hue Hunt`!

---

## 🎮 How to Play

1. **Spot the odd tile**: In the 3×3 grid, 8 tiles are the identical shade, and 1 is slightly different.
2. **Tap before time expires**: Keep your eye on the time progress bar!
3. **Chain streaks**: Every 5 correct taps triggers a combo multiplier (`1.5x`, `2x`, `3x`, `4x`).
4. **Guard your 3 lives**: Each wrong tap deducts 1 heart and 2.5 seconds.
5. **Beat your personal best**: Submit your record to the leaderboard and challenge friends to beat you!

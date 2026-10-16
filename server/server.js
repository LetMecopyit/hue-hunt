/**
 * Hue Hunt - Express API & Static Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Filter out known fake seed user IDs
const FAKE_USER_IDS = new Set(['101', '102', '103', '104', '105', '106', '107', '108', '109', '110']);

function loadScores() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(content);
      if (!Array.isArray(data.endless)) data.endless = [];
      if (!data.daily || typeof data.daily !== 'object') data.daily = {};
      return data;
    }
  } catch (err) {
    console.error('Error reading leaderboard file:', err);
  }
  return { endless: [], daily: {} };
}

function saveScores(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving leaderboard file:', err);
  }
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET /api/leaderboard?mode=endless|daily&date=YYYY-MM-DD
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode === 'daily' ? 'daily' : 'endless';
  const scores = loadScores();

  if (mode === 'daily') {
    const today = req.query.date || new Date().toISOString().slice(0, 10);
    let dailyList = [];
    if (scores.daily) {
      if (Array.isArray(scores.daily)) {
        dailyList = scores.daily.filter(item => !item.date || item.date === today);
      } else if (scores.daily[today]) {
        dailyList = scores.daily[today];
      }
    }
    // Filter out fake test entries
    dailyList = dailyList.filter(item => !FAKE_USER_IDS.has(String(item.userId)));
    dailyList.sort((a, b) => b.score - a.score);
    return res.json({
      mode: 'daily',
      date: today,
      leaderboard: dailyList.slice(0, 100),
      todayLeader: dailyList[0] || null
    });
  }

  let endlessList = (scores.endless || []).filter(item => !FAKE_USER_IDS.has(String(item.userId)));
  endlessList.sort((a, b) => b.score - a.score);
  res.json({
    mode: 'endless',
    leaderboard: endlessList.slice(0, 100),
    topLeader: endlessList[0] || null
  });
});

// GET /api/user-stats?userId=...
app.get('/api/user-stats', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const scores = loadScores();
  const today = new Date().toISOString().slice(0, 10);

  const endlessList = (scores.endless || [])
    .filter(item => !FAKE_USER_IDS.has(String(item.userId)))
    .sort((a, b) => b.score - a.score);

  const endlessIdx = endlessList.findIndex(item => String(item.userId) === String(userId));
  const endlessStat = endlessIdx >= 0 ? {
    score: endlessList[endlessIdx].score,
    rank: endlessIdx + 1,
    maxCombo: endlessList[endlessIdx].maxCombo || 0
  } : null;

  let dailyList = [];
  if (scores.daily && typeof scores.daily === 'object') {
    if (scores.daily[today]) {
      dailyList = scores.daily[today];
    } else if (Array.isArray(scores.daily)) {
      dailyList = scores.daily.filter(i => i.date === today);
    }
  }
  dailyList = dailyList.filter(item => !FAKE_USER_IDS.has(String(item.userId))).sort((a, b) => b.score - a.score);
  const dailyIdx = dailyList.findIndex(item => String(item.userId) === String(userId));
  const dailyStat = dailyIdx >= 0 ? {
    score: dailyList[dailyIdx].score,
    rank: dailyIdx + 1,
    maxCombo: dailyList[dailyIdx].maxCombo || 0,
    date: today
  } : null;

  res.json({
    userId: String(userId),
    endless: endlessStat,
    daily: dailyStat,
    today,
    todayLeader: dailyList[0] || null
  });
});

// POST /api/score
app.post('/api/score', (req, res) => {
  const { userId, name, username, score, mode, maxCombo, date } = req.body;

  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score payload' });
  }

  const scores = loadScores();
  const targetMode = mode === 'daily' ? 'daily' : 'endless';
  const today = date || new Date().toISOString().slice(0, 10);

  let list;
  if (targetMode === 'daily') {
    if (Array.isArray(scores.daily) || !scores.daily || typeof scores.daily !== 'object') {
      scores.daily = {};
    }
    if (!scores.daily[today]) {
      scores.daily[today] = [];
    }
    list = scores.daily[today];
  } else {
    if (!Array.isArray(scores.endless)) {
      scores.endless = [];
    }
    list = scores.endless;
  }

  // Purge any fake users
  list = list.filter(item => !FAKE_USER_IDS.has(String(item.userId)));

  // Update or insert player's high score
  const existingIdx = list.findIndex(item => String(item.userId) === String(userId));
  if (existingIdx >= 0) {
    if (score > list[existingIdx].score) {
      list[existingIdx].score = score;
      list[existingIdx].maxCombo = Math.max(list[existingIdx].maxCombo || 0, maxCombo || 0);
      list[existingIdx].timestamp = Date.now();
    }
    // Update player profile fields whenever received
    if (name) list[existingIdx].name = name;
    if (username !== undefined) list[existingIdx].username = username;
  } else {
    list.push({
      userId: String(userId),
      name: name || 'Player',
      username: username || '',
      score,
      maxCombo: maxCombo || 0,
      timestamp: Date.now(),
      date: targetMode === 'daily' ? today : undefined
    });
  }

  list.sort((a, b) => b.score - a.score);

  if (targetMode === 'daily') {
    scores.daily[today] = list;
  } else {
    scores.endless = list;
  }

  saveScores(scores);

  const rank = list.findIndex(item => String(item.userId) === String(userId)) + 1;
  const bestScore = list[rank - 1]?.score || score;

  res.json({
    success: true,
    rank,
    bestScore,
    mode: targetMode,
    date: targetMode === 'daily' ? today : undefined
  });
});

// GET /api/daily-seed
app.get('/api/daily-seed', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.json({ date: today });
});

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎮 Hue Hunt WebApp Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

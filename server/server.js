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

// Default seed scores
const defaultScores = {
  endless: [
    { userId: '101', name: 'Pavel Durov', username: 'durov', score: 48, timestamp: 1728460000000 },
    { userId: '102', name: 'Elena R.', username: 'elena_chroma', score: 42, timestamp: 1728461000000 },
    { userId: '103', name: 'CyberAlex', username: 'alex99', score: 38, timestamp: 1728462000000 },
    { userId: '104', name: 'ColorWiz', username: 'wiz_color', score: 35, timestamp: 1728463000000 },
    { userId: '105', name: 'Mia Sun', username: 'mia_art', score: 31, timestamp: 1728464000000 },
    { userId: '106', name: 'NeonSam', username: 'neon_sam', score: 28, timestamp: 1728465000000 },
    { userId: '107', name: 'Luna_V', username: 'luna_v', score: 26, timestamp: 1728466000000 },
    { userId: '108', name: 'PixelDan', username: 'pixeldan', score: 22, timestamp: 1728467000000 },
    { userId: '109', name: 'Tanya K.', username: 'tanya_k', score: 19, timestamp: 1728468000000 },
    { userId: '110', name: 'ZeroCool', username: 'zerocool', score: 17, timestamp: 1728469000000 }
  ],
  daily: [
    { userId: '102', name: 'Elena R.', username: 'elena_chroma', score: 34, timestamp: 1728461000000 },
    { userId: '101', name: 'Pavel Durov', username: 'durov', score: 32, timestamp: 1728460000000 },
    { userId: '104', name: 'ColorWiz', username: 'wiz_color', score: 29, timestamp: 1728463000000 },
    { userId: '103', name: 'CyberAlex', username: 'alex99', score: 27, timestamp: 1728462000000 },
    { userId: '105', name: 'Mia Sun', username: 'mia_art', score: 25, timestamp: 1728464000000 }
  ]
};

function loadScores() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading leaderboard file:', err);
  }
  return JSON.parse(JSON.stringify(defaultScores));
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

// GET /api/leaderboard?mode=endless
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode === 'daily' ? 'daily' : 'endless';
  const scores = loadScores();
  const list = (scores[mode] || []).sort((a, b) => b.score - a.score);
  res.json({ mode, leaderboard: list.slice(0, 100) });
});

// POST /api/score
app.post('/api/score', (req, res) => {
  const { userId, name, username, score, mode, maxCombo } = req.body;

  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score payload' });
  }

  const scores = loadScores();
  const targetMode = mode === 'daily' ? 'daily' : 'endless';
  const list = scores[targetMode] || [];

  // Update or insert player's high score
  const existingIdx = list.findIndex(item => String(item.userId) === String(userId));
  if (existingIdx >= 0) {
    if (score > list[existingIdx].score) {
      list[existingIdx].score = score;
      list[existingIdx].name = name || list[existingIdx].name;
      list[existingIdx].username = username || list[existingIdx].username;
      list[existingIdx].maxCombo = Math.max(list[existingIdx].maxCombo || 0, maxCombo || 0);
      list[existingIdx].timestamp = Date.now();
    }
  } else {
    list.push({
      userId: String(userId),
      name: name || 'Player',
      username: username || '',
      score,
      maxCombo: maxCombo || 0,
      timestamp: Date.now()
    });
  }

  list.sort((a, b) => b.score - a.score);
  scores[targetMode] = list;
  saveScores(scores);

  const rank = list.findIndex(item => String(item.userId) === String(userId)) + 1;
  res.json({ success: true, rank, bestScore: list[rank - 1]?.score });
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

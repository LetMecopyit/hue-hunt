/**
 * Hue Hunt - Leaderboard Manager
 * Synchronizes scores with backend REST API and handles local caching.
 */

export class LeaderboardManager {
  constructor(telegramBridge) {
    this.tgBridge = telegramBridge;
    this.apiBase = '/api';
    this.mockLeaderboard = this.generateMockLeaderboard();
  }

  // Pre-seed realistic Telegram player scores for immediate excitement
  generateMockLeaderboard() {
    return {
      endless: [
        { rank: 1, name: 'Pavel Durov', username: 'durov', score: 48, isCurrentUser: false },
        { rank: 2, name: 'Elena R.', username: 'elena_chroma', score: 42, isCurrentUser: false },
        { rank: 3, name: 'CyberAlex', username: 'alex99', score: 38, isCurrentUser: false },
        { rank: 4, name: 'ColorWiz', username: 'wiz_color', score: 35, isCurrentUser: false },
        { rank: 5, name: 'Mia Sun', username: 'mia_art', score: 31, isCurrentUser: false },
        { rank: 6, name: 'NeonSam', username: 'neon_sam', score: 28, isCurrentUser: false },
        { rank: 7, name: 'Luna_V', username: 'luna_v', score: 26, isCurrentUser: false },
        { rank: 8, name: 'PixelDan', username: 'pixeldan', score: 22, isCurrentUser: false },
        { rank: 9, name: 'Tanya K.', username: 'tanya_k', score: 19, isCurrentUser: false },
        { rank: 10, name: 'ZeroCool', username: 'zerocool', score: 17, isCurrentUser: false }
      ],
      daily: [
        { rank: 1, name: 'Elena R.', username: 'elena_chroma', score: 34, isCurrentUser: false },
        { rank: 2, name: 'Pavel Durov', username: 'durov', score: 32, isCurrentUser: false },
        { rank: 3, name: 'ColorWiz', username: 'wiz_color', score: 29, isCurrentUser: false },
        { rank: 4, name: 'CyberAlex', username: 'alex99', score: 27, isCurrentUser: false },
        { rank: 5, name: 'Mia Sun', username: 'mia_art', score: 25, isCurrentUser: false }
      ]
    };
  }

  async getLeaderboard(mode = 'endless') {
    try {
      const res = await fetch(`${this.apiBase}/leaderboard?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        return this.formatScores(data.leaderboard || [], mode);
      }
    } catch (e) {
      // API offline - use local storage and mock data
    }
    return this.getLocalLeaderboard(mode);
  }

  getLocalLeaderboard(mode = 'endless') {
    const list = [...(this.mockLeaderboard[mode] || [])];
    const userBest = parseInt(localStorage.getItem(`huehunt_best_${mode}`) || '0', 10);
    const user = this.tgBridge.user;

    if (userBest > 0) {
      // Remove existing entry for current user if present
      const filtered = list.filter(item => !item.isCurrentUser);
      filtered.push({
        rank: 0,
        name: user.displayName || 'You',
        username: user.username || '',
        score: userBest,
        isCurrentUser: true
      });
      // Sort descending by score
      filtered.sort((a, b) => b.score - a.score);
      // Re-assign ranks
      filtered.forEach((item, idx) => {
        item.rank = idx + 1;
      });
      return filtered;
    }

    return list;
  }

  formatScores(scores, mode) {
    const currentUserId = String(this.tgBridge.user.id);
    return scores.map((item, idx) => ({
      rank: idx + 1,
      name: item.name || item.firstName || 'Player',
      username: item.username || '',
      score: item.score,
      isCurrentUser: String(item.userId) === currentUserId
    }));
  }

  async submitScore(score, mode = 'endless', maxCombo = 0) {
    // 1. Update localStorage best score
    const bestKey = `huehunt_best_${mode}`;
    const previousBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
    const isNewBest = score > previousBest;

    if (isNewBest) {
      localStorage.setItem(bestKey, score);
    }

    // 2. Post to backend API
    const user = this.tgBridge.user;
    const payload = {
      userId: user.id,
      name: user.displayName,
      username: user.username,
      score,
      mode,
      maxCombo,
      timestamp: Date.now()
    };

    try {
      await fetch(`${this.apiBase}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Backend not reached, persisted locally
    }

    return {
      score,
      previousBest,
      currentBest: Math.max(score, previousBest),
      isNewBest
    };
  }

  getBestScore(mode = 'endless') {
    return parseInt(localStorage.getItem(`huehunt_best_${mode}`) || '0', 10);
  }
}

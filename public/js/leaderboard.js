/**
 * Hue Hunt - Leaderboard Manager
 * Synchronizes real scores with backend REST API and handles local caching.
 * No fake users or mock data.
 */

export class LeaderboardManager {
  constructor(telegramBridge) {
    this.tgBridge = telegramBridge;
    this.apiBase = '/api';
    this.todayDate = new Date().toISOString().slice(0, 10);
    this.cachedDailyLeader = 0;
  }

  getTodayDate() {
    return this.todayDate;
  }

  /**
   * Sync user's stored high scores from backend on startup
   */
  async syncUserStats() {
    const user = this.tgBridge.user;
    if (!user || !user.id) return;

    try {
      const res = await fetch(`${this.apiBase}/user-stats?userId=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.today) {
          this.todayDate = data.today;
        }
        if (data.endless && typeof data.endless.score === 'number') {
          const localEndless = parseInt(localStorage.getItem('huehunt_best_endless') || '0', 10);
          if (data.endless.score > localEndless) {
            localStorage.setItem('huehunt_best_endless', data.endless.score);
          }
        }
        if (data.daily && typeof data.daily.score === 'number') {
          const dailyKey = `huehunt_daily_best_${this.todayDate}`;
          const localDaily = parseInt(localStorage.getItem(dailyKey) || '0', 10);
          if (data.daily.score > localDaily) {
            localStorage.setItem(dailyKey, data.daily.score);
          }
        }
        if (data.todayLeader && typeof data.todayLeader.score === 'number') {
          this.cachedDailyLeader = data.todayLeader.score;
        }
      }
    } catch (e) {
      // Offline fallback: rely on local storage
    }
  }

  async getLeaderboard(mode = 'endless') {
    const targetMode = mode === 'daily' ? 'daily' : 'endless';
    try {
      const url = targetMode === 'daily' 
        ? `${this.apiBase}/leaderboard?mode=daily&date=${encodeURIComponent(this.todayDate)}`
        : `${this.apiBase}/leaderboard?mode=endless`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.date) {
          this.todayDate = data.date;
        }
        if (data.todayLeader) {
          this.cachedDailyLeader = data.todayLeader.score || 0;
        }
        return this.formatScores(data.leaderboard || []);
      }
    } catch (e) {
      console.warn('Backend leaderboard unreachable:', e);
    }

    return this.getLocalLeaderboard(targetMode);
  }

  getLocalLeaderboard(mode = 'endless') {
    const userBest = this.getBestScore(mode);
    const user = this.tgBridge.user;

    if (userBest > 0) {
      return [{
        rank: 1,
        name: user.displayName || 'You',
        username: user.username || '',
        score: userBest,
        isCurrentUser: true
      }];
    }

    return [];
  }

  formatScores(scores) {
    const currentUserId = String(this.tgBridge.user.id);
    return scores.map((item, idx) => ({
      rank: idx + 1,
      userId: item.userId,
      name: item.name || item.firstName || 'Player',
      username: item.username || '',
      score: item.score,
      maxCombo: item.maxCombo || 0,
      isCurrentUser: String(item.userId) === currentUserId
    }));
  }

  async submitScore(score, mode = 'endless', maxCombo = 0) {
    const targetMode = mode === 'daily' ? 'daily' : 'endless';
    
    // 1. Update localStorage best score
    const bestKey = targetMode === 'daily' 
      ? `huehunt_daily_best_${this.todayDate}` 
      : 'huehunt_best_endless';

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
      mode: targetMode,
      maxCombo,
      date: targetMode === 'daily' ? this.todayDate : undefined,
      timestamp: Date.now()
    };

    let serverRank = null;
    let serverBest = Math.max(score, previousBest);

    try {
      const res = await fetch(`${this.apiBase}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        serverRank = data.rank;
        serverBest = data.bestScore || serverBest;
        localStorage.setItem(bestKey, serverBest);
      }
    } catch (e) {
      // Backend not reached, persisted locally
    }

    return {
      score,
      previousBest,
      currentBest: serverBest,
      isNewBest,
      rank: serverRank
    };
  }

  getBestScore(mode = 'endless') {
    if (mode === 'daily') {
      return parseInt(localStorage.getItem(`huehunt_daily_best_${this.todayDate}`) || '0', 10);
    }
    return parseInt(localStorage.getItem('huehunt_best_endless') || '0', 10);
  }

  getCachedDailyLeader() {
    return this.cachedDailyLeader;
  }
}

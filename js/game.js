/**
 * Hue Hunt - Core Gameplay Controller
 */

export class HueHuntGame {
  constructor({ colorEngine, soundEngine, telegramBridge, leaderboardManager, onStateChange, onGameOver }) {
    this.colorEngine = colorEngine;
    this.sound = soundEngine;
    this.tg = telegramBridge;
    this.leaderboard = leaderboardManager;
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;

    // Game state
    this.mode = 'endless'; // 'endless' or 'daily'
    this.isPlaying = false;
    this.isPaused = false;
    this.score = 0;
    this.bestScore = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1.0;
    
    // Timer
    this.initialTime = 15.0;
    this.maxTimeBank = 20.0;
    this.timeLeft = 15.0;
    this.timerInterval = null;
    this.lastTickTimestamp = 0;

    // Round data
    this.currentRound = 1;
    this.currentPuzzle = null;
    this.gridSize = 9; // 3x3 grid

    // Accessibility
    this.patternAssist = localStorage.getItem('huehunt_assist') === 'true';
  }

  setPatternAssist(enabled) {
    this.patternAssist = enabled;
    localStorage.setItem('huehunt_assist', enabled);
  }

  isPatternAssist() {
    return this.patternAssist;
  }

  getMultiplier() {
    if (this.combo >= 20) return 4.0;
    if (this.combo >= 15) return 3.0;
    if (this.combo >= 10) return 2.0;
    if (this.combo >= 5) return 1.5;
    return 1.0;
  }

  start(mode = 'endless') {
    this.stopTimer();
    this.mode = mode;
    this.isPlaying = true;
    this.isPaused = false;
    this.score = 0;
    this.lives = this.maxLives;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1.0;
    this.currentRound = 1;
    this.timeLeft = this.initialTime;

    if (this.mode === 'daily') {
      const today = new Date().toISOString().slice(0, 10);
      this.colorEngine.setDailySeed(today);
    }

    this.bestScore = this.leaderboard.getBestScore(this.mode);
    this.generateNextPuzzle();
    this.startTimer();
    this.emitState();
  }

  generateNextPuzzle() {
    const isDaily = this.mode === 'daily';
    this.currentPuzzle = this.colorEngine.generateRound(this.currentRound, isDaily, this.gridSize);
  }

  startTimer() {
    this.stopTimer();
    this.lastTickTimestamp = performance.now();

    this.timerInterval = setInterval(() => {
      if (!this.isPlaying || this.isPaused) return;

      const now = performance.now();
      const deltaSeconds = (now - this.lastTickTimestamp) / 1000;
      this.lastTickTimestamp = now;

      this.timeLeft = Math.max(0, this.timeLeft - deltaSeconds);

      // Warning tick when time is critically low (< 3.5s)
      if (this.timeLeft > 0 && this.timeLeft <= 3.5 && Math.floor(this.timeLeft * 2) % 2 === 0) {
        this.sound.playTick();
      }

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.handleGameOver('timeout');
      }

      this.emitState();
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Player taps a tile index (0 to 8)
   */
  handleTileTap(tileIndex, tileElement) {
    if (!this.isPlaying || this.isPaused) return;

    const isCorrect = tileIndex === this.currentPuzzle.oddIndex;

    if (isCorrect) {
      this.handleCorrectTap(tileElement);
    } else {
      this.handleMistakeTap(tileElement);
    }

    this.emitState();
  }

  handleCorrectTap(tileElement) {
    // 1. Combo progression
    this.combo += 1;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.multiplier = this.getMultiplier();

    // 2. Score calculation with combo multiplier
    const pointsEarned = Math.round(1 * this.multiplier);
    this.score += pointsEarned;

    // Check if player beat personal best during game
    const isNewBestDuringGame = this.score > this.bestScore;

    // 3. Time bonus (tighter bonus on high rounds)
    const timeBonus = Math.max(0.75, 1.25 - (this.currentRound * 0.015));
    this.timeLeft = Math.min(this.maxTimeBank, this.timeLeft + timeBonus);

    // 4. Feedback (Sound + Haptics)
    this.sound.playTap(this.combo);
    this.tg.hapticImpact('light');

    // Milestone celebration every 5 combos
    if (this.combo % 5 === 0) {
      this.sound.playComboFanfare();
      this.tg.hapticNotification('success');
    }

    // 5. Next round
    this.currentRound += 1;
    this.generateNextPuzzle();

    return {
      pointsEarned,
      combo: this.combo,
      multiplier: this.multiplier,
      isNewBestDuringGame
    };
  }

  handleMistakeTap(tileElement) {
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 0;
    this.multiplier = 1.0;

    // Penalty of 2.5 seconds
    this.timeLeft = Math.max(0, this.timeLeft - 2.5);

    // Feedback
    this.sound.playError();
    this.tg.hapticNotification('error');

    if (this.lives <= 0 || this.timeLeft <= 0) {
      this.handleGameOver(this.lives <= 0 ? 'lives' : 'timeout');
    }
  }

  async handleGameOver(reason) {
    this.isPlaying = false;
    this.stopTimer();
    this.sound.playGameOver();
    this.tg.hapticNotification('warning');

    const result = await this.leaderboard.submitScore(this.score, this.mode, this.maxCombo);

    if (this.onGameOver) {
      this.onGameOver({
        reason,
        score: this.score,
        previousBest: result.previousBest,
        currentBest: result.currentBest,
        isNewBest: result.isNewBest,
        maxCombo: this.maxCombo,
        mode: this.mode,
        roundsPlayed: this.currentRound
      });
    }

    this.emitState();
  }

  emitState() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        mode: this.mode,
        score: this.score,
        bestScore: Math.max(this.score, this.bestScore),
        lives: this.lives,
        maxLives: this.maxLives,
        combo: this.combo,
        multiplier: this.multiplier,
        timeLeft: this.timeLeft,
        round: this.currentRound,
        puzzle: this.currentPuzzle,
        patternAssist: this.patternAssist
      });
    }
  }
}

/**
 * Hue Hunt - Main Application Entrypoint
 */

import { ColorEngine } from './colors.js';
import { SoundEngine } from './audio.js';
import { TelegramBridge } from './telegram.js';
import { LeaderboardManager } from './leaderboard.js';
import { HueHuntGame } from './game.js';
import { ConfettiCannon } from './confetti.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Subsystems
  const colorEngine = new ColorEngine();
  const soundEngine = new SoundEngine();
  const telegramBridge = new TelegramBridge();
  const leaderboardManager = new LeaderboardManager(telegramBridge);

  const confettiCanvas = document.getElementById('confetti-canvas');
  const confetti = new ConfettiCannon(confettiCanvas);

  // 2. DOM Elements Cache
  const ambientBackdrop = document.getElementById('ambient-backdrop');
  const hudBestScore = document.getElementById('hud-best-score');
  const hudCurrentScore = document.getElementById('hud-current-score');
  const hudTimeLeft = document.getElementById('hud-time-left');
  const timeProgressBar = document.getElementById('time-progress-bar');
  const livesContainer = document.getElementById('lives-container');
  const comboPill = document.getElementById('combo-pill');
  const comboText = document.getElementById('combo-text');
  const modeBadge = document.getElementById('mode-badge');
  const gridWrapper = document.querySelector('.grid-wrapper');
  const tileGrid = document.getElementById('tile-grid');
  const floatingScores = document.getElementById('floating-scores');
  const readyPromptOverlay = document.getElementById('ready-prompt-overlay');
  const btnResumeReady = document.getElementById('btn-resume-ready');

  // Buttons & Controls
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const btnChallengeFriend = document.getElementById('btn-challenge-friend');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const btnCloseSettings = document.getElementById('btn-close-settings');

  // Modals
  const settingsModal = document.getElementById('settings-modal');
  const gameoverModal = document.getElementById('gameover-modal');
  const finalScoreVal = document.getElementById('final-score-val');
  const newRecordBanner = document.getElementById('new-record-banner');
  const gameoverBestVal = document.getElementById('gameover-best-val');
  const gameoverComboVal = document.getElementById('gameover-combo-val');
  const gameoverRoundsVal = document.getElementById('gameover-rounds-val');
  const btnWatchAdRevive = document.getElementById('btn-watch-ad-revive');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnShareScore = document.getElementById('btn-share-score');
  const btnViewRanks = document.getElementById('btn-view-ranks');

  // Monetag Ad SDK Helper (Zone 11989416)
  function triggerMonetagAd(onCompleted) {
    if (typeof window.show_11989416 === 'function') {
      try {
        window.show_11989416()
          .then(() => {
            if (onCompleted) onCompleted(true);
          })
          .catch((err) => {
            console.warn('Monetag ad notice/closed:', err);
            if (onCompleted) onCompleted(true);
          });
        return;
      } catch (e) {
        console.warn('Monetag call error:', e);
      }
    } else {
      console.log('Monetag show_11989416 not loaded yet or blocked.');
    }
    if (onCompleted) onCompleted(false);
  }

  // Navigation & Views
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const btnStartDaily = document.getElementById('btn-start-daily');
  const dailyDateLabel = document.getElementById('daily-date-label');
  const dailyBestStat = document.getElementById('daily-best-stat');
  const dailyLeaderStat = document.getElementById('daily-leader-stat');

  // Leaderboard Elements
  const tabEndless = document.getElementById('tab-endless');
  const tabDaily = document.getElementById('tab-daily');
  const leaderboardList = document.getElementById('leaderboard-list');
  const myRankCard = document.getElementById('my-rank-card');
  const btnShareLeaderboard = document.getElementById('btn-share-leaderboard');

  // Settings inputs
  const inputPlayerName = document.getElementById('input-player-name');
  const toggleSound = document.getElementById('toggle-sound');
  const toggleHaptics = document.getElementById('toggle-haptics');
  const toggleAssist = document.getElementById('toggle-assist');

  let currentActiveTab = 'endless';
  let lastPlayedMode = 'endless';

  // Quick Toast Helper
  function showToast(message) {
    let toast = document.getElementById('game-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'game-toast';
      toast.style.position = 'fixed';
      toast.style.top = '16px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      toast.style.color = '#ffffff';
      toast.style.padding = '10px 18px';
      toast.style.borderRadius = '999px';
      toast.style.fontSize = '0.85rem';
      toast.style.fontWeight = '700';
      toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
      toast.style.zIndex = '9999';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.pointerEvents = 'none';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 2400);
  }

  // 3. Instantiate Game Controller
  const game = new HueHuntGame({
    colorEngine,
    soundEngine,
    telegramBridge,
    leaderboardManager,
    onStateChange: (state) => renderGameState(state),
    onGameOver: (summary) => renderGameOver(summary)
  });

  // 4. Render State Updates
  function renderGameState(state) {
    hudCurrentScore.textContent = state.score;
    hudBestScore.textContent = state.bestScore;

    // Time display & bar (25s baseline, 28s on second chance)
    const roundedTime = Math.ceil(state.timeLeft);
    hudTimeLeft.textContent = `${roundedTime}s`;
    const fullDuration = state.maxLives === 4 ? 28.0 : 25.0;
    const percentTime = Math.min(100, (state.timeLeft / fullDuration) * 100);
    timeProgressBar.style.width = `${percentTime}%`;

    // Mode label
    if (state.mode === 'daily') {
      modeBadge.textContent = '📅 DAILY CHALLENGE';
      modeBadge.style.color = '#c084fc';
      modeBadge.style.borderColor = 'rgba(192, 132, 252, 0.4)';
    } else {
      modeBadge.textContent = '⚡ ENDLESS MODE';
      modeBadge.style.color = '#38bdf8';
      modeBadge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    }

    // Render Hearts / Lives dynamically based on current maxLives (supports 3 or 4)
    livesContainer.innerHTML = '';
    const maxHearts = state.maxLives || 3;
    for (let i = 0; i < maxHearts; i++) {
      const heart = document.createElement('span');
      heart.className = `heart ${i < state.lives ? 'active' : 'lost'}`;
      heart.textContent = '❤️';
      livesContainer.appendChild(heart);
    }

    // Combo indicator
    if (state.combo >= 5) {
      comboPill.classList.remove('hidden');
      comboText.textContent = `COMBO x${state.multiplier} (${state.combo})`;
    } else {
      comboPill.classList.add('hidden');
    }

    // Ambient glow
    if (state.puzzle?.ambientGlow) {
      ambientBackdrop.style.background = `radial-gradient(circle, ${state.puzzle.ambientGlow} 0%, rgba(10, 14, 23, 0) 70%)`;
    }

    // Render 3x3 Tiles
    if (state.puzzle) {
      const tiles = tileGrid.querySelectorAll('.color-tile');
      tiles.forEach((tile, idx) => {
        const isOdd = idx === state.puzzle.oddIndex;
        tile.style.backgroundColor = isOdd ? state.puzzle.oddColor : state.puzzle.baseColor;
        
        // Accessibility Pattern Assist
        if (isOdd && state.patternAssist) {
          tile.classList.add('odd-assist');
        } else {
          tile.classList.remove('odd-assist');
        }
      });
    }
  }

  // 5. Handle Tile Clicks
  tileGrid.addEventListener('click', (e) => {
    const tile = e.target.closest('.color-tile');
    if (!tile || !game.isPlaying) return;

    const index = parseInt(tile.dataset.index, 10);
    const rect = tile.getBoundingClientRect();
    const wrapperRect = gridWrapper.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2 - wrapperRect.left;
    const clickY = rect.top + rect.height / 2 - wrapperRect.top;

    const isOdd = index === game.currentPuzzle?.oddIndex;

    if (isOdd) {
      // Floating score badge
      spawnFloatingScore(clickX, clickY, `+${Math.round(1 * game.getMultiplier())}`);
      
      // Streak milestone particles
      if ((game.combo + 1) % 5 === 0) {
        confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
      }
    } else {
      // Screen shake on wrong tap
      gridWrapper.classList.remove('shake');
      void gridWrapper.offsetWidth; // force reflow
      gridWrapper.classList.add('shake');
    }

    game.handleTileTap(index, tile);
  });

  // Floating score tag
  function spawnFloatingScore(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    floatingScores.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 700);
  }

  // 6. Game Over Handling
  function renderGameOver(summary) {
    lastPlayedMode = summary.mode;
    finalScoreVal.textContent = summary.score;
    gameoverBestVal.textContent = summary.currentBest;
    gameoverComboVal.textContent = `${summary.maxCombo}x`;
    gameoverRoundsVal.textContent = summary.roundsPlayed;

    if (summary.isNewBest && summary.score > 0) {
      newRecordBanner.classList.remove('hidden');
      confetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 70);
    } else {
      newRecordBanner.classList.add('hidden');
    }

    if (btnWatchAdRevive) {
      btnWatchAdRevive.classList.remove('hidden');
      btnWatchAdRevive.disabled = false;
      btnWatchAdRevive.innerHTML = '<span>📺</span> Second Chance (+4 Lives &amp; +3s Extra)';
    }

    gameoverModal.classList.remove('hidden');
  }

  // 7. Navigation Tabs
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      switchView(targetView);
    });
  });

  function switchView(viewId) {
    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === viewId);
    });
    navItems.forEach(nav => {
      nav.classList.toggle('active', nav.dataset.view === viewId);
    });

    if (viewId === 'leaderboard-view') {
      renderLeaderboardUI(currentActiveTab);
    } else if (viewId === 'daily-view') {
      updateDailyViewData();
    }
  }

  async function updateDailyViewData() {
    const today = new Date();
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    dailyDateLabel.textContent = today.toLocaleDateString('en-US', options);
    const myDailyBest = leaderboardManager.getBestScore('daily');
    dailyBestStat.textContent = myDailyBest;

    // Fetch real daily leaderboard to show today's genuine leader score
    const scores = await leaderboardManager.getLeaderboard('daily');
    const leaderScore = scores && scores.length > 0 ? scores[0].score : myDailyBest;
    if (dailyLeaderStat) {
      dailyLeaderStat.textContent = leaderScore;
    }
  }

  // 8. Leaderboard View Rendering
  async function renderLeaderboardUI(mode = 'endless') {
    currentActiveTab = mode;
    tabEndless.classList.toggle('active', mode === 'endless');
    tabDaily.classList.toggle('active', mode === 'daily');

    leaderboardList.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted)">Loading real scores...</div>`;

    const scores = await leaderboardManager.getLeaderboard(mode);
    leaderboardList.innerHTML = '';

    if (!scores || scores.length === 0) {
      if (mode === 'daily') {
        leaderboardList.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:var(--text-muted)">
            <div style="font-size:2.2rem; margin-bottom:8px;">📅</div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">No records for today's daily puzzle yet</div>
            <div style="font-size:0.85rem;">Be the very first player today to claim #1!</div>
          </div>`;
      } else {
        leaderboardList.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:var(--text-muted)">
            <div style="font-size:2.2rem; margin-bottom:8px;">🏆</div>
            <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">No endless records recorded yet</div>
            <div style="font-size:0.85rem;">Play a game to claim your spot on the podium!</div>
          </div>`;
      }
      myRankCard.innerHTML = '';
      return;
    }

    scores.slice(0, 50).forEach(item => {
      const row = document.createElement('div');
      row.className = `leaderboard-item ${item.isCurrentUser ? 'current-user' : ''}`;
      
      let rankClass = '';
      if (item.rank === 1) rankClass = 'top-1';
      else if (item.rank === 2) rankClass = 'top-2';
      else if (item.rank === 3) rankClass = 'top-3';

      row.innerHTML = `
        <div class="rank-col">
          <span class="rank-badge ${rankClass}">#${item.rank}</span>
          <div class="player-info">
            <span class="player-name">${escapeHTML(item.name)} ${item.isCurrentUser ? '(You)' : ''}</span>
            ${item.username ? `<span class="player-username">@${escapeHTML(item.username)}</span>` : ''}
          </div>
        </div>
        <div class="score-col">${item.score}</div>
      `;
      leaderboardList.appendChild(row);
    });

    // Pinned user rank card
    const myItem = scores.find(s => s.isCurrentUser);
    if (myItem) {
      myRankCard.innerHTML = `
        <div class="leaderboard-item current-user" style="border-width: 2px;">
          <div class="rank-col">
            <span class="rank-badge">#${myItem.rank}</span>
            <div class="player-info">
              <span class="player-name">${escapeHTML(myItem.name)} (Your Best)</span>
              <span class="player-username">Mode: ${mode === 'daily' ? 'Daily' : 'Endless'}</span>
            </div>
          </div>
          <div class="score-col">${myItem.score}</div>
        </div>
      `;
    } else {
      const myLocalBest = leaderboardManager.getBestScore(mode);
      if (myLocalBest > 0) {
        myRankCard.innerHTML = `
          <div class="leaderboard-item current-user" style="border-width: 2px;">
            <div class="rank-col">
              <span class="rank-badge">•</span>
              <div class="player-info">
                <span class="player-name">${escapeHTML(telegramBridge.user.displayName)} (Your Best)</span>
                <span class="player-username">Mode: ${mode === 'daily' ? 'Daily' : 'Endless'}</span>
              </div>
            </div>
            <div class="score-col">${myLocalBest}</div>
          </div>
        `;
      } else {
        myRankCard.innerHTML = '';
      }
    }
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  tabEndless.addEventListener('click', () => renderLeaderboardUI('endless'));
  tabDaily.addEventListener('click', () => renderLeaderboardUI('daily'));

  // 9. Quick Actions & Buttons
  btnResetDemo.addEventListener('click', () => {
    if (readyPromptOverlay) readyPromptOverlay.classList.add('hidden');
    telegramBridge.hapticImpact('medium');
    game.start(game.mode || 'endless');
  });

  btnChallengeFriend.addEventListener('click', () => {
    telegramBridge.hapticImpact('light');
    const best = leaderboardManager.getBestScore(game.mode);
    telegramBridge.shareScore(game.score, best, game.mode === 'daily' ? 'Daily' : 'Endless');
  });

  btnShareLeaderboard.addEventListener('click', () => {
    telegramBridge.hapticImpact('light');
    telegramBridge.inviteFriend();
  });

  btnStartDaily.addEventListener('click', () => {
    if (readyPromptOverlay) readyPromptOverlay.classList.add('hidden');
    switchView('game-view');
    game.start('daily');
  });

  // Game Over Modal buttons & Monetag Ads
  let gamesPlayedSession = 0;

  if (btnWatchAdRevive) {
    btnWatchAdRevive.addEventListener('click', () => {
      telegramBridge.hapticImpact('medium');
      btnWatchAdRevive.disabled = true;
      btnWatchAdRevive.innerHTML = '<span>⏳</span> Loading Ad...';

      triggerMonetagAd(() => {
        btnWatchAdRevive.classList.add('hidden');
        gameoverModal.classList.add('hidden');
        // Ensure game view is active and visible
        switchView('game-view');
        // Setup 4 lives, 28 seconds (25s start + 3s extra), fresh puzzle, with timer paused!
        game.prepareReviveState();
        // Show Tap-to-Start Ready Overlay so timer waits until player explicitly taps start!
        if (readyPromptOverlay) {
          readyPromptOverlay.classList.remove('hidden');
        }
      });
    });
  }

  // Player explicitly presses "Start Turn" to start playing after the ad
  if (btnResumeReady) {
    btnResumeReady.addEventListener('click', () => {
      if (readyPromptOverlay) {
        readyPromptOverlay.classList.add('hidden');
      }
      // Start ticking the timer now that the player has physically returned
      game.resumeAfterAd();
      soundEngine.playRevivePowerup();
      telegramBridge.hapticNotification('success');
      confetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 45);
      showToast('⚡ SECOND CHANCE: 4 Lives & 28s — GO!');
    });
  }

  btnPlayAgain.addEventListener('click', () => {
    if (readyPromptOverlay) readyPromptOverlay.classList.add('hidden');
    gameoverModal.classList.add('hidden');
    gamesPlayedSession += 1;
    // Show interstitial Monetag ad every 3 games
    if (gamesPlayedSession % 3 === 0) {
      triggerMonetagAd(() => {
        game.start(lastPlayedMode);
      });
    } else {
      game.start(lastPlayedMode);
    }
  });

  btnShareScore.addEventListener('click', () => {
    const best = leaderboardManager.getBestScore(lastPlayedMode);
    telegramBridge.shareScore(game.score, best, lastPlayedMode === 'daily' ? 'Daily' : 'Endless');
  });

  btnViewRanks.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    switchView('leaderboard-view');
  });

  // 10. Sound & Settings Controls
  btnSoundToggle.addEventListener('click', () => {
    const muted = soundEngine.toggleMute();
    soundIcon.textContent = muted ? '🔇' : '🔊';
    toggleSound.checked = !muted;
  });

  btnSettingsToggle.addEventListener('click', () => {
    inputPlayerName.value = telegramBridge.user.displayName;
    toggleSound.checked = !soundEngine.isMuted();
    toggleAssist.checked = game.isPatternAssist();
    settingsModal.classList.remove('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  inputPlayerName.addEventListener('change', () => {
    telegramBridge.setDisplayName(inputPlayerName.value);
    showToast(`Name set to ${inputPlayerName.value}`);
    // Update existing score records on server with new name
    const endlessBest = leaderboardManager.getBestScore('endless');
    if (endlessBest > 0) {
      leaderboardManager.submitScore(endlessBest, 'endless');
    }
    const dailyBest = leaderboardManager.getBestScore('daily');
    if (dailyBest > 0) {
      leaderboardManager.submitScore(dailyBest, 'daily');
    }
  });

  toggleSound.addEventListener('change', () => {
    if (toggleSound.checked === soundEngine.isMuted()) {
      soundEngine.toggleMute();
      soundIcon.textContent = soundEngine.isMuted() ? '🔇' : '🔊';
    }
  });

  toggleAssist.addEventListener('change', () => {
    game.setPatternAssist(toggleAssist.checked);
    game.emitState();
  });

  // 11. Initial Start & Real User Record Sync
  soundIcon.textContent = soundEngine.isMuted() ? '🔇' : '🔊';
  leaderboardManager.syncUserStats().then(() => {
    const best = leaderboardManager.getBestScore('endless');
    hudBestScore.textContent = best;
    game.bestScore = best;
  });
  game.start('endless');
});

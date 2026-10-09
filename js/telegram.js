/**
 * Hue Hunt - Telegram WebApp Integration Wrapper
 * Handles Telegram SDK, Haptic feedback, User Context, and Sharing.
 */

export class TelegramBridge {
  constructor() {
    this.tg = window.Telegram?.WebApp || null;
    this.isInsideTelegram = !!(this.tg && this.tg.initData);
    this.botUsername = 'Colorfulgame_bot';
    this.appUrl = `https://t.me/${this.botUsername}/game`;
    this.user = this.resolveUser();

    this.init();
  }

  init() {
    if (!this.tg) {
      console.log('Running outside Telegram environment (standalone browser mode).');
      return;
    }

    try {
      this.tg.ready();
      this.tg.expand();
      
      // Keep colors sleek and consistent with game UI
      if (this.tg.setHeaderColor) {
        this.tg.setHeaderColor('#0d1117');
      }
      if (this.tg.setBackgroundColor) {
        this.tg.setBackgroundColor('#0d1117');
      }

      // Prevent accidental swipe-to-close during active gameplay
      if (this.tg.enableClosingConfirmation) {
        this.tg.enableClosingConfirmation();
      }
    } catch (e) {
      console.warn('Telegram WebApp setup error:', e);
    }
  }

  resolveUser() {
    if (this.tg?.initDataUnsafe?.user) {
      const u = this.tg.initDataUnsafe.user;
      return {
        id: u.id,
        firstName: u.first_name || 'Player',
        lastName: u.last_name || '',
        username: u.username || '',
        photoUrl: u.photo_url || null,
        displayName: u.first_name + (u.last_name ? ' ' + u.last_name : '')
      };
    }

    // Standalone fallback: retrieve or generate local profile
    let localId = localStorage.getItem('huehunt_local_id');
    if (!localId) {
      localId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('huehunt_local_id', localId);
    }

    let localName = localStorage.getItem('huehunt_player_name') || 'Player #' + localId.slice(-4);

    return {
      id: localId,
      firstName: localName,
      lastName: '',
      username: '',
      photoUrl: null,
      displayName: localName
    };
  }

  setDisplayName(name) {
    if (!name || !name.trim()) return;
    this.user.displayName = name.trim();
    this.user.firstName = name.trim();
    localStorage.setItem('huehunt_player_name', name.trim());
  }

  // Telegram Haptic Feedback wrappers
  hapticImpact(style = 'light') {
    if (this.tg?.HapticFeedback) {
      try {
        this.tg.HapticFeedback.impactOccurred(style);
      } catch (e) {
        // Ignore fallback
      }
    } else if (navigator.vibrate) {
      navigator.vibrate(style === 'heavy' ? 40 : 15);
    }
  }

  hapticNotification(type = 'success') {
    if (this.tg?.HapticFeedback) {
      try {
        this.tg.HapticFeedback.notificationOccurred(type);
      } catch (e) {
        // Ignore fallback
      }
    } else if (navigator.vibrate) {
      if (type === 'error') {
        navigator.vibrate([30, 40, 30]);
      } else {
        navigator.vibrate(25);
      }
    }
  }

  hapticSelection() {
    if (this.tg?.HapticFeedback) {
      try {
        this.tg.HapticFeedback.selectionChanged();
      } catch (e) {
        // Ignore fallback
      }
    }
  }

  /**
   * Share score card and challenge a friend on Telegram
   */
  shareScore(score, bestScore, mode = 'Endless') {
    const modeText = mode === 'Daily' ? '📅 Daily Challenge' : '⚡ Endless Mode';
    const text = `🎯 I scored ${score} pts in Hue Hunt (${modeText})!\n🏆 Best Score: ${bestScore}\n\nThink you have sharper eyes? Beat me in @${this.botUsername}! 👁️🎨`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(this.appUrl)}&text=${encodeURIComponent(text)}`;

    if (this.tg?.openTelegramLink) {
      this.tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  }

  /**
   * Invite friends directly
   */
  inviteFriend() {
    const text = `🎮 Spot the odd color in Hue Hunt on Telegram! Fast, addictive, and brain-sharpening.\n\nPlay now:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(this.appUrl)}&text=${encodeURIComponent(text)}`;

    if (this.tg?.openTelegramLink) {
      this.tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  }
}

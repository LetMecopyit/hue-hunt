/**
 * Hue Hunt - High-Fidelity ASMR Web Audio Sound Engine
 * Zero external audio dependencies, zero latency, highly gratifying procedural sound design.
 * Designed for tactile ASMR pops, crystalline resonance, and rewarding combos.
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('huehunt_muted') === 'true';

    // Pentatonic scale (C5 through A6) for harmonious, dopamine-inducing streaks
    this.scale = [
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
      1760.00  // A6
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('huehunt_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Ultra-Satisfying ASMR Pop on every correct click:
   * Layer 1: Tactile bubble-wrap / water-droplet transient "snap"
   * Layer 2: Warm musical marimba/crystal core tone (progresses along pentatonic scale)
   * Layer 3: Glassy metallic overtone shimmer
   */
  playTap(combo = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noteIdx = combo % this.scale.length;
    const baseFreq = this.scale[noteIdx];

    // Master bus for this tap
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.32, t);
    masterGain.connect(this.ctx.destination);

    // --- Layer 1: Tactile ASMR Bubble Pop (Fast pitch-sweep transient) ---
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(baseFreq * 2.2, t);
    popOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, t + 0.022);

    popGain.gain.setValueAtTime(0.5, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    popOsc.connect(popGain);
    popGain.connect(masterGain);
    popOsc.start(t);
    popOsc.stop(t + 0.03);

    // --- Layer 2: Warm Resonant Marimba / Crystal Core ---
    const coreOsc = this.ctx.createOscillator();
    const coreGain = this.ctx.createGain();
    coreOsc.type = 'sine';
    coreOsc.frequency.setValueAtTime(baseFreq, t);

    // Subtle natural pitch settle (ASMR droplet effect)
    coreOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.02, t + 0.015);
    coreOsc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.08);

    coreGain.gain.setValueAtTime(0.01, t);
    coreGain.gain.linearRampToValueAtTime(0.42, t + 0.004); // Instant 4ms soft attack
    coreGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14); // Lush natural ring-out

    coreOsc.connect(coreGain);
    coreGain.connect(masterGain);
    coreOsc.start(t);
    coreOsc.stop(t + 0.15);

    // --- Layer 3: Crystalline Kalimba Overtone (Gentle harmonic sparkle) ---
    const overtoneOsc = this.ctx.createOscillator();
    const overtoneGain = this.ctx.createGain();
    overtoneOsc.type = 'triangle';
    overtoneOsc.frequency.setValueAtTime(baseFreq * 2.76, t); // Metallic bell harmonic

    overtoneGain.gain.setValueAtTime(0.01, t);
    overtoneGain.gain.linearRampToValueAtTime(0.09, t + 0.003);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(masterGain);
    overtoneOsc.start(t);
    overtoneOsc.stop(t + 0.08);
  }

  /**
   * Rewarding Streak Chime (Kalimba Fanfare) on combos (5, 10, 15, 20...)
   */
  playComboFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Ascending major arpeggio with shimmer
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.048;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.33);
    });
  }

  /**
   * Inspiring Second Chance / Revive Power-Up Sensation
   */
  playRevivePowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const riserNotes = [440, 554.37, 659.25, 880, 1108.73];
    riserNotes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.29);
    });
  }

  /**
   * Gentle, Organic Wooden Tap on Mistake (Soft & Tactile instead of harsh buzz)
   */
  playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Muted low-frequency thud
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Gentle Low-Time Warning (Subtle Woodblock Click)
   */
  playTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.025);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  /**
   * Elegant, Soft Game-Over Descending Resolution
   */
  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 261.63];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.29);
    });
  }
}

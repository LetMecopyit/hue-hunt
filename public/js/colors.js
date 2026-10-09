/**
 * Hue Hunt - Color Engine & Difficulty Progression
 */

// Seeded PRNG (Mulberry32) for deterministic daily challenge sequences
function createPRNG(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string seed (e.g. "2026-10-09") into a 32-bit integer
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export class ColorEngine {
  constructor() {
    this.dailyRNG = null;
  }

  setDailySeed(dateStr) {
    const seed = hashString(dateStr || new Date().toISOString().slice(0, 10));
    this.dailyRNG = createPRNG(seed);
  }

  getRandom(isDaily = false) {
    if (isDaily && this.dailyRNG) {
      return this.dailyRNG();
    }
    return Math.random();
  }

  /**
   * Calculate color difference (delta) based on current score/round.
   * Starts around 22% (easy) and smoothly scales down toward a floor of 2.6%.
   * This guarantees tiles are challenging but never impossible to spot.
   */
  calculateDelta(round) {
    const initialDelta = 22.0;
    const minDelta = 2.8; // Perceptual floor for mobile screens
    const decayRate = 0.93;
    const delta = Math.max(minDelta, initialDelta * Math.pow(decayRate, round - 1));
    return parseFloat(delta.toFixed(2));
  }

  /**
   * Generate a round puzzle:
   * 8 tiles share the base color, 1 tile has a slightly altered shade.
   */
  generateRound(round = 1, isDaily = false, gridSize = 9) {
    const delta = this.calculateDelta(round);

    // Pick vibrant, balanced HSL base color
    // Hue: 0 - 360
    // Saturation: 50% - 85%
    // Lightness: 35% - 65% (safe range so +/- delta won't clip into pure white/black)
    const h = Math.floor(this.getRandom(isDaily) * 360);
    const s = Math.floor(52 + this.getRandom(isDaily) * 33);
    const l = Math.floor(36 + this.getRandom(isDaily) * 28);

    // Pick odd tile index (0 to gridSize - 1)
    const oddIndex = Math.floor(this.getRandom(isDaily) * gridSize);

    // Apply delta to Lightness (or subtle Hue variation for high rounds)
    // Alternate direction (+ or -) pseudo-randomly
    const direction = this.getRandom(isDaily) > 0.5 ? 1 : -1;
    let oddL = l + direction * delta;

    // Boundary check so lightness never clips
    if (oddL > 88) {
      oddL = l - delta;
    } else if (oddL < 15) {
      oddL = l + delta;
    }

    const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
    const oddColor = `hsl(${h}, ${s}%, ${oddL.toFixed(1)}%)`;

    // Ambient glow color with lower opacity
    const ambientGlow = `hsla(${h}, ${s}%, ${l}%, 0.28)`;

    return {
      round,
      delta,
      baseColor,
      oddColor,
      oddIndex,
      ambientGlow,
      hsl: { h, s, l, oddL }
    };
  }
}

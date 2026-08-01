/**
 * Seven Web Audio oscillator tones for the lantern-district gameplay - no
 * audio files, generated on the fly (same technique as utils/soundManager.js,
 * kept as separate code since that file is shared with /classic and must
 * stay untouched). Every tone is under 0.4s and quieter than spoken Chinese
 * (speech.js plays around gain 1; these stay under 0.05).
 */
import { isMuted } from "./audio.js";

let audioContext = null;
const scheduled = new Set();

const getContext = () => {
  if (typeof window === "undefined") return null;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  if (!audioContext) audioContext = new Context();
  if (audioContext.state === "suspended") audioContext.resume?.();
  return audioContext;
};

const tone = (frequency, duration, { type = "sine", gain = 0.045, delay = 0 } = {}) => {
  const context = getContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(gain, start);
  oscillator.connect(volume);
  volume.connect(context.destination);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

const later = (callback, delayMs) => {
  if (typeof window === "undefined") return;
  const timeoutId = window.setTimeout(() => {
    scheduled.delete(timeoutId);
    callback();
  }, delayMs);
  scheduled.add(timeoutId);
};

export const cancelPendingSfx = () => {
  if (typeof window !== "undefined") scheduled.forEach((id) => window.clearTimeout(id));
  scheduled.clear();
};

const sfx = {
  /** Short, light click - every chip/card/option tap. */
  tap: () => tone(520, 0.05, { type: "sine", gain: 0.03 }),

  /** Two notes climbing - bright, satisfying. */
  correct: () => {
    tone(660, 0.11, { type: "triangle", gain: 0.05 });
    tone(880, 0.15, { type: "triangle", gain: 0.045, delay: 0.09 });
  },

  /** Low, short, deliberately not startling - a nudge, not a buzzer. */
  wrong: () => tone(196, 0.16, { type: "sine", gain: 0.04 }),

  /** Heavy, low thud - like a physical stamp striking paper. */
  stamp: () => {
    tone(110, 0.14, { type: "square", gain: 0.05 });
    tone(80, 0.22, { type: "sine", gain: 0.06, delay: 0.02 });
  },

  /** Three notes climbing - bigger than "correct", a real unlock moment. */
  unlock: () => {
    tone(523, 0.1, { type: "triangle", gain: 0.045 });
    tone(659, 0.1, { type: "triangle", gain: 0.045, delay: 0.09 });
    tone(784, 0.2, { type: "triangle", gain: 0.05, delay: 0.18 });
  },

  /** Very short, bright chime - safe to repeat rapidly (coin pickups). */
  coin: () => tone(1046, 0.08, { type: "square", gain: 0.03 }),

  /** Climbs faster and higher as the combo count grows. */
  combo: (count = 1) => {
    const base = 587 + Math.min(count, 20) * 22;
    tone(base, 0.09, { type: "triangle", gain: 0.045 });
    tone(base * 1.25, 0.11, { type: "triangle", gain: 0.04, delay: 0.06 });
  },
};

/** Dispatches by name so callers (audio.js's playSfx) don't need to import
    every individual tone function. */
export const playSfxByName = (name, ...args) => {
  if (isMuted()) return;
  sfx[name]?.(...args);
};

export default sfx;

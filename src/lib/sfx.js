import { isMuted } from "./audio.js";

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq, endFreq, start = 0, duration = 0.1, type = "sine", gain = 0.12 }) {
  const context = getCtx();
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = type;

  const t0 = context.currentTime + start;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);

  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(g);
  g.connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function play(fn) {
  if (isMuted()) return;
  try {
    fn();
  } catch {
    // Web Audio unavailable/blocked - fail silently, sfx is decoration only.
  }
}

export function playTap() {
  play(() => tone({ freq: 900, duration: 0.03, gain: 0.05, type: "sine" }));
}

export function playCorrect() {
  play(() => {
    tone({ freq: 660, duration: 0.09, gain: 0.14, type: "sine" });
    tone({ freq: 880, start: 0.09, duration: 0.13, gain: 0.16, type: "sine" });
  });
}

export function playWrong() {
  play(() => tone({ freq: 220, endFreq: 170, duration: 0.16, gain: 0.11, type: "sine" }));
}

export function playStamp() {
  play(() => {
    tone({ freq: 110, endFreq: 45, duration: 0.2, gain: 0.22, type: "sine" });
    tone({ freq: 800, duration: 0.02, gain: 0.06, type: "triangle" });
  });
}

export function playUnlock() {
  play(() => {
    tone({ freq: 440, duration: 0.08, gain: 0.13, type: "sine" });
    tone({ freq: 554, start: 0.08, duration: 0.08, gain: 0.14, type: "sine" });
    tone({ freq: 659, start: 0.16, duration: 0.14, gain: 0.16, type: "sine" });
  });
}

export function playCoin() {
  play(() => {
    tone({ freq: 1200, duration: 0.05, gain: 0.09, type: "sine" });
    tone({ freq: 1600, start: 0.04, duration: 0.08, gain: 0.11, type: "sine" });
  });
}

export function playCombo(comboCount = 1) {
  play(() => {
    const base = Math.min(500 + comboCount * 40, 1400);
    tone({ freq: base, endFreq: base * 1.5, duration: 0.12, gain: 0.13, type: "sine" });
  });
}

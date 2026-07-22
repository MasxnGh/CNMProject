let audioContext = null;
let enabled = true;
const scheduled = new Set();

const getContext = () => {
  if (!enabled || typeof window === "undefined") return null;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  if (!audioContext) audioContext = new Context();
  if (audioContext.state === "suspended") audioContext.resume?.();
  return audioContext;
};

const tone = (frequency, duration, type = "sine", gain = 0.04) => {
  const context = getContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  volume.gain.value = gain;
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start();
  volume.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.stop(context.currentTime + duration);
};

const later = (callback, delay) => {
  if (typeof window === "undefined") return;
  const timeoutId = window.setTimeout(() => {
    scheduled.delete(timeoutId);
    callback();
  }, delay);
  scheduled.add(timeoutId);
};

const stopScheduled = () => {
  if (typeof window !== "undefined") {
    scheduled.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }
  scheduled.clear();
};

export const soundManager = {
  play(name = "click") {
    if (!enabled) return;
    switch (name) {
      case "correct":
        tone(660, 0.12, "triangle", 0.05);
        later(() => tone(880, 0.16, "triangle", 0.045), 90);
        break;
      case "wrong":
        tone(180, 0.18, "sawtooth", 0.035);
        break;
      case "win":
        tone(523, 0.12, "sine", 0.05);
        later(() => tone(659, 0.12, "sine", 0.045), 120);
        later(() => tone(784, 0.24, "triangle", 0.05), 240);
        break;
      case "star":
        tone(784, 0.12, "triangle", 0.045);
        later(() => tone(1046, 0.18, "triangle", 0.04), 90);
        break;
      case "bossHit":
        tone(220, 0.08, "square", 0.035);
        later(() => tone(110, 0.14, "sawtooth", 0.025), 60);
        break;
      default:
        tone(420, 0.06, "sine", 0.025);
    }
  },
  setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stopScheduled();
  },
  isEnabled() {
    return enabled;
  },
  cancelPending() {
    stopScheduled();
  },
  dispose() {
    stopScheduled();
    audioContext?.close?.();
    audioContext = null;
  },
};

export default soundManager;

import { vocabAudioSrc, clockAudioSrc } from "./audioKey.js";

const MUTE_KEY = "zhiyuan_muted";
let current = null;

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // localStorage unavailable (private mode, etc) - muted state just won't persist.
  }
  if (muted) stop();
}

export function stop() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}

function playSrc(src) {
  if (!src || isMuted()) return;
  stop();
  const audio = new Audio(src);
  current = audio;
  audio.play().catch(() => {});
}

export function playWord(vocabId) {
  if (!vocabId) return;
  playSrc(vocabAudioSrc(vocabId));
}

export function playClock(clock) {
  if (!clock) return;
  playSrc(clockAudioSrc(clock));
}

import sentences from "../content/sentences.json";
import vocab from "../content/vocab.json";
import { speakChinese } from "../utils/speech.js";

const MUTE_KEY = "dujeen-quest-audio-muted";
const SLOW_RATE = 0.65;

const entriesById = new Map([...vocab, ...sentences].map((entry) => [entry.id, entry]));

let current = null;
let muted = false;
try {
  muted = typeof window !== "undefined" && window.localStorage?.getItem(MUTE_KEY) === "1";
} catch {
  muted = false;
}

export const isMuted = () => muted;

export const setMuted = (value) => {
  muted = Boolean(value);
  try {
    window.localStorage?.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // localStorage unavailable (private mode, etc.) - mute state just won't persist
  }
  if (muted) stop();
};

export const stop = () => {
  if (!current) return;
  current.pause();
  current.currentTime = 0;
  current = null;
};

/**
 * Plays a vocab or sentence id's pre-generated mp3. There is only ever one
 * file per phrase - the slow variant is the same file at a lower
 * playbackRate, not a second generated asset. Falls back to the existing
 * Web Speech API (speech.js) if the file is missing or blocked, so a word
 * that hasn't been voiced yet still speaks instead of staying silent.
 */
export const play = (id, { slow = false } = {}) => {
  if (muted) return;
  const entry = entriesById.get(id);
  stop();
  if (!entry) return;

  const audio = new Audio(entry.audio);
  audio.playbackRate = slow ? SLOW_RATE : 1;
  current = audio;
  const result = audio.play();
  if (result?.catch) result.catch(() => speakChinese(entry.hanzi));
};

/** Warms the browser's media cache for every word/sentence in a lesson. */
export const preloadLesson = (lessonId) => {
  entriesById.forEach((entry) => {
    if (entry.lessonId !== lessonId) return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = entry.audio;
  });
};

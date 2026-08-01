import sentences from "../content/sentences.json";
import vocab from "../content/vocab.json";
import { speakChinese } from "../utils/speech.js";
import { playSfxByName } from "./sfx.js";

const MUTE_KEY = "dujeen-quest-audio-muted";
const SLOW_RATE = 0.65;

const vocabById = new Map(vocab.map((entry) => [entry.id, entry]));
const sentenceById = new Map(sentences.map((entry) => [entry.id, entry]));
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
 * Plays one entry's pre-generated mp3. There is only ever one file per
 * phrase - the slow variant is the same file at a lower playbackRate, not a
 * second generated asset. Falls back to the existing Web Speech API
 * (speech.js) if the file is missing or blocked, so a word that hasn't been
 * voiced yet still speaks instead of staying silent, and warns which id was
 * missing so gaps in the audio set are easy to spot during content work.
 */
const playEntry = (entry, id, slow) => {
  stop();
  if (!entry) {
    console.warn(`[audio] no entry for id "${id}"`);
    return;
  }
  const audio = new Audio(entry.audio);
  audio.playbackRate = slow ? SLOW_RATE : 1;
  current = audio;
  const result = audio.play();
  if (result?.catch) {
    result.catch(() => {
      console.warn(`[audio] file missing/blocked for "${id}" (${entry.audio}) - falling back to speech synthesis`);
      speakChinese(entry.hanzi);
    });
  }
};

/** Plays a single vocab word by id. */
export const playWord = (vocabId, { slow = false } = {}) => {
  if (muted) return;
  playEntry(vocabById.get(vocabId), vocabId, slow);
};

/** Plays a full sentence by id. */
export const playSentence = (id, { slow = false } = {}) => {
  if (muted) return;
  playEntry(sentenceById.get(id), id, slow);
};

/** One of the 7 short Web Audio sound effects (tap/correct/wrong/stamp/unlock/coin/combo). */
export const playSfx = (name, ...args) => playSfxByName(name, ...args);

/** Reads a Thai string aloud (TranslateSentence's prompt) - there is no
    pre-generated audio for Thai UI copy, so this always uses the Web
    Speech API rather than an mp3 lookup like playWord/playSentence. */
export const speakThai = (text) => {
  if (muted) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
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

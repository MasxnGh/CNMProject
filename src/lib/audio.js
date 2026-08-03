import vocab from "../content/vocab.json";
import sentences from "../content/sentences.json";

const MUTE_KEY = "dujeen_audio_muted";

const vocabById = new Map(vocab.map((entry) => [entry.id, entry]));
const sentenceById = new Map(sentences.map((entry) => [entry.id, entry]));

const cache = new Map();
let currentAudio = null;

// Tracks how many times target audio has actually been played since the
// last reset, so callers (Lesson/Review) can tell a hesitant "hard" answer
// from a confident "good" one.
let replayCount = 0;

export function getReplayCount() {
  return replayCount;
}

export function resetReplayCount() {
  replayCount = 0;
}

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted() {
  return readMuted();
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // localStorage unavailable (private mode, etc) - muted state just won't persist.
  }
  if (muted) stopAll();
}

function getOrCreate(path) {
  let audio = cache.get(path);
  if (!audio) {
    audio = new Audio(path);
    audio.preload = "auto";
    cache.set(path, audio);
  }
  return audio;
}

export function preloadLesson(lessonId) {
  vocab
    .filter((entry) => entry.lessonId === lessonId)
    .forEach((entry) => {
      getOrCreate(entry.audio);
      getOrCreate(entry.audioSlow);
    });
  sentences
    .filter((entry) => entry.lessonId === lessonId)
    .forEach((entry) => {
      getOrCreate(entry.audio);
      getOrCreate(entry.audioSlow);
    });
}

export function stopAll() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function speakFallback(text, id) {
  console.warn(`[audio] missing/failed file for "${id}", falling back to Web Speech API`);
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  window.speechSynthesis.speak(utterance);
}

function play(entry, { slow = false } = {}) {
  if (!entry || readMuted()) return;
  replayCount += 1;
  stopAll();

  const path = slow ? entry.audioSlow : entry.audio;
  const audio = getOrCreate(path);
  audio.currentTime = 0;
  audio.onerror = () => speakFallback(entry.hanzi, entry.id);
  currentAudio = audio;
  audio.play().catch(() => speakFallback(entry.hanzi, entry.id));
}

export function playWord(vocabId, opts) {
  const entry = vocabById.get(vocabId);
  if (!entry) {
    console.warn(`[audio] unknown vocab id "${vocabId}"`);
    return;
  }
  play(entry, opts);
}

export function playSentence(sentenceId, opts) {
  const entry = sentenceById.get(sentenceId);
  if (!entry) {
    console.warn(`[audio] unknown sentence id "${sentenceId}"`);
    return;
  }
  play(entry, opts);
}

// No pre-generated audio exists for Thai prompt text (translate_sentence
// reads the Thai side aloud) - this always goes through Web Speech API.
export function speakText(text, lang = "th-TH") {
  if (readMuted() || !text) return;
  stopAll();
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

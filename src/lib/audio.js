import vocab from "../content/vocab.json";
import sentences from "../content/sentences.json";

const MUTE_KEY = "dujeen_audio_muted";
const THAI_CHAR_RE = /[฀-๿]/;

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

// When any sound last actually started playing (manual or automatic) - lets
// audioPolicy.js space out its automatic check-time sounds so they don't cut
// across something that just played.
let lastPlayedAt = 0;

export function getLastPlayedAt() {
  return lastPlayedAt;
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

// This app only ever reads Chinese aloud. If Thai text ever reaches speech
// synthesis, that's a caller/data bug, not a language choice - fail loudly
// in dev so it gets caught, but never crash a real player's session over it.
function assertChineseText(text, source) {
  if (!THAI_CHAR_RE.test(text)) return true;
  const message = `[audio] refused to speak Thai text from ${source}: "${text}". This app only ever reads Chinese aloud.`;
  if (import.meta.env.DEV) {
    throw new Error(message);
  }
  console.error(message);
  return false;
}

function hasVoiceFor(langPrefix) {
  if (!("speechSynthesis" in window)) return false;
  return window.speechSynthesis.getVoices().some((voice) => voice.lang?.toLowerCase().startsWith(langPrefix));
}

function speakFallback(text, id) {
  console.warn(`[audio] missing/failed file for "${id}", falling back to Web Speech API`);
  if (!assertChineseText(text, `speakFallback("${id}")`)) return;
  if (!("speechSynthesis" in window)) return;
  if (!hasVoiceFor("zh")) {
    console.warn(`[audio] no zh-CN voice available on this device, skipping speech fallback for "${id}"`);
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  window.speechSynthesis.speak(utterance);
}

function play(entry, { slow = false, manual = false } = {}) {
  if (!entry || readMuted()) return;
  // Only genuine speaker-button clicks count toward the SRS ">2 replays =
  // hard" signal - automatic policy-driven sounds (onEnter/onSelect/onCheck)
  // must not look like player hesitation.
  if (manual) replayCount += 1;
  lastPlayedAt = Date.now();
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

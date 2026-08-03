import vocabData from "../../content/vocab.json";
import sentenceData from "../../content/sentences.json";
import { playWord, playSentence } from "../../lib/audio.js";

export const vocabById = new Map(vocabData.map((entry) => [entry.id, entry]));
export const sentenceById = new Map(sentenceData.map((entry) => [entry.id, entry]));

export function resolveEntry(id) {
  return vocabById.get(id) || sentenceById.get(id);
}

export function isSentenceId(id) {
  return sentenceById.has(id);
}

export function playEntry(id, opts) {
  if (sentenceById.has(id)) return playSentence(id, opts);
  return playWord(id, opts);
}

// Different exercise types key their prompt content under different fields
// (pick_* use targetId, the sentence-arranging types use targetSentenceId).
// This is the one place that knows the fallback order.
export function getEntryId(exercise) {
  return exercise.targetId || exercise.targetSentenceId || exercise.promptSentenceId || exercise.promptId;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Decoy chips for arrange-style exercises: words the learner hasn't just
// heard, so they can't just place "everything in the tray". Prefers other
// words from the same chapter (plausible distractors); falls back to the
// whole vocab list if the chapter is too small.
export function pickDecoyWords(excludeIds, count, chapterId) {
  const excluded = new Set(excludeIds);
  const inChapter = vocabData.filter((word) => word.chapterId === chapterId && !excluded.has(word.id));
  const pool = inChapter.length >= count ? inChapter : vocabData.filter((word) => !excluded.has(word.id));
  return shuffle(pool).slice(0, count).map((word) => word.id);
}

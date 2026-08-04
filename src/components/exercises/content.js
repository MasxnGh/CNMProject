import vocabData from "../../content/vocab.json";
import sentenceData from "../../content/sentences.json";

export const vocabById = new Map(vocabData.map((entry) => [entry.id, entry]));
export const sentenceById = new Map(sentenceData.map((entry) => [entry.id, entry]));

export function resolveEntry(id) {
  return vocabById.get(id) || sentenceById.get(id);
}

export function isSentenceId(id) {
  return sentenceById.has(id);
}

// Different exercise types key their prompt content under different fields
// (pick_* use targetId, the sentence-arranging types use targetSentenceId,
// write_character uses contextWord - the SRS/audio "entry" is always the
// whole word, never the single character it's asking you to write - and
// match_pairs uses wordIds, falling back to its first word since there's no
// single "the" entry, just so FeedbackBar has something to show/replay).
// This is the one place that knows the fallback order.
export function getEntryId(exercise) {
  return (
    exercise.targetId || exercise.targetSentenceId || exercise.promptSentenceId || exercise.promptId ||
    exercise.contextWord || exercise.wordIds?.[0]
  );
}


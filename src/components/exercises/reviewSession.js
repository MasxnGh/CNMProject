import exercisesData from "../../content/exercises.json";
import { getDueCards, getUpcomingCards } from "../../lib/srs.js";
import { getEntryId } from "./content.js";
import { EXERCISE_COMPONENTS } from "./QuestionRenderer.jsx";
import { isSentenceId, sentenceById } from "./content.js";

const ALLOWED_TYPES = new Set(Object.keys(EXERCISE_COMPONENTS));

function exerciseTouchesWord(exercise, wordId) {
  if (exercise.wordIds) return exercise.wordIds.includes(wordId);
  const entryId = getEntryId(exercise);
  if (entryId === wordId) return true;
  if (isSentenceId(entryId)) return !!sentenceById.get(entryId)?.tokens?.includes(wordId);
  return false;
}

export function findExercisesForWord(wordId) {
  return exercisesData.filter((exercise) => ALLOWED_TYPES.has(exercise.type) && exerciseTouchesWord(exercise, wordId));
}

// Picks a random exercise for this word, preferring one that isn't the same
// type the player just saw for it (falls back to allowing a repeat if that
// leaves nothing - a word backed by a single exercise must still be reviewable).
export function pickExerciseForWord(wordId, lastType) {
  const candidates = findExercisesForWord(wordId);
  if (candidates.length === 0) return null;
  const fresh = lastType ? candidates.filter((exercise) => exercise.type !== lastType) : candidates;
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildQueue(cards, lastTypes) {
  const queue = [];
  cards.forEach((card) => {
    const exercise = pickExerciseForWord(card.id, lastTypes[card.id]);
    if (exercise) queue.push({ wordId: card.id, exercise });
  });
  return queue;
}

export function buildDueQueue(progress, limit = 20) {
  return buildQueue(getDueCards(progress, limit), progress.reviewLastType || {});
}

export function buildAdvanceQueue(progress, limit = 10) {
  return buildQueue(getUpcomingCards(progress, limit), progress.reviewLastType || {});
}

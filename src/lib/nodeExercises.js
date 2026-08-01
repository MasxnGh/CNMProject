import vocab from "../content/vocab.json";
import { shuffleOptions } from "../utils/shuffle.js";
import { getLessonForNode } from "./checkpointProgression.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt 4 follow-up - the mechanical first
 * pass wiring real nodes to the new exercise engine (Lesson.jsx +
 * components/exercises/*). Every non-draft lesson already has real,
 * audio-backed entries in vocab.json (matched by lessonId, same field
 * ChapterPath's vocab panel already reads) - this alternates them into
 * pickImage/pickAudio exercises, same shape LessonPreview.jsx's demo
 * buildLessonQuiz() uses. Only 2 of the 8 allowed types; the other 6 need
 * real Thai sentence content authored per node before they can appear here,
 * which is separate follow-up work.
 *
 * A lesson with no vocab of its own (ch4's practice/review lessons - meant
 * to rehash earlier material anyway) falls back to the rest of its chapter.
 */
export const buildNodeExercises = (nodeId) => {
  const info = getLessonForNode(nodeId);
  if (!info) return [];
  const { unit, lesson } = info;

  let pool = vocab.filter((entry) => entry.lessonId === lesson.id);
  if (pool.length < 2) {
    const chapterLessonIds = new Set(unit.lessons.map((l) => l.id));
    pool = vocab.filter((entry) => chapterLessonIds.has(entry.lessonId));
  }
  if (pool.length < 2) return [];

  return shuffleOptions(pool).map((word, index) => {
    const distractors = shuffleOptions(pool.filter((entry) => entry.id !== word.id)).slice(0, 3);
    const options = shuffleOptions([word, ...distractors]);
    const base = { id: `${nodeId}_gen${index}`, options, correctId: word.id };
    return index % 2 === 0 ? { ...base, type: "pickImage", prompt: word } : { ...base, type: "pickAudio", vocabId: word.id };
  });
};

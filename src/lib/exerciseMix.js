/**
 * dujeen-quest-gameplay-prompts.md Prompt E #2 - draws `count` exercises
 * evenly across `lessonIds` (round-robin, so no single lesson dominates the
 * pool), then breaks up same-type runs of 3+. Both a regular Lesson and the
 * unlock-test call this, so "even spread + type variety" only lives once.
 *
 * Named exerciseMix.js, not exercisePool.js - that name is already taken by
 * the old engine's node/question pool builder (lib/exercisePool.js, used by
 * checkpointProgression.js's buildCheckpointLevel). Same idea, unrelated
 * data shape (vocab/sentence-based exercise objects here, not levels.js
 * questions) - kept as a separate file rather than touching shared code.
 */
const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Nudges runs of 3+ same-type exercises apart by swapping the offending
    item forward with the next exercise of a different type. Best-effort,
    not a perfect constraint solve - good enough to keep a 15-question pool
    from feeling like "5 pickImage in a row". */
const avoidTypeStreaks = (list, maxStreak = 2) => {
  const result = [...list];
  for (let i = maxStreak; i < result.length; i += 1) {
    const streak = result.slice(i - maxStreak, i).every((item) => item.type === result[i].type);
    if (!streak) continue;
    const swapIndex = result.findIndex((item, index) => index > i && item.type !== result[i].type);
    if (swapIndex !== -1) {
      [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
    }
  }
  return result;
};

/**
 * exercisesByLessonId: { [lessonId]: exercise[] }
 * lessonIds: which lessons to draw from
 * count: how many to return (fewer if the lessons don't have enough between them)
 */
export const buildPool = (exercisesByLessonId, lessonIds, count) => {
  const perLesson = lessonIds.map((lessonId) => shuffle(exercisesByLessonId[lessonId] ?? []));
  const drawn = [];
  let cursor = 0;
  while (drawn.length < count) {
    const hasAny = perLesson.some((list) => list.length > 0);
    if (!hasAny) break;
    const list = perLesson[cursor % perLesson.length];
    if (list.length > 0) drawn.push(list.shift());
    cursor += 1;
  }
  return avoidTypeStreaks(drawn);
};

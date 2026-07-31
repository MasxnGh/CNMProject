import { levels } from "../data/levels.js";
import { calculatePlayerLevel } from "../utils/storage.js";
import { calculateStars, getEarnedBadgeIds, getStarReward, getTotalStars } from "../utils/gameLogic.js";
import units from "../content/units.json";

/*
 * This is the "engine cutover" (Phase 1.5) - but it turns out the engine
 * (GamePage/QuestionRenderer/evaluateMission/diagnoseMission) never needed to
 * change at all: it only ever needed a `level` object with a `questions`
 * array, which still only exists in levels.js (vocab.json/sentences.json are
 * supporting dictionaries, not a replacement question store - see the
 * migrate-content.mjs header). Node ids were deliberately kept as the same
 * numeric level ids back in Phase 0, so `getLevelById(nodeId)` already works
 * unchanged for the new route tree.
 *
 * What actually needed rebuilding was the *unlock/reward* layer:
 * gameLogic.js's isLevelUnlocked/isSetUnlocked hardcode star-threshold
 * gates tied to the old 3-chapter structure, which doesn't fit the new
 * Unit/Lesson model and contradicts "no stars on the map" anyway. This file
 * is the replacement for that layer only - sequential unlock within a
 * lesson, next-lesson unlock on completion. It still reuses gameLogic.js's
 * calculateStars/getStarReward/getEarnedBadgeIds read-only, since those are
 * pure reward/badge math that only reads progress.levelStars/totalStars,
 * which the new progress schema still carries for exactly this reason.
 */

const flatNodeIds = units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.nodeIds));

/** The node immediately after this one on the route, or null past the last node. */
export const getNextNodeId = (nodeId) => {
  const index = flatNodeIds.indexOf(nodeId);
  if (index === -1 || index === flatNodeIds.length - 1) return null;
  return flatNodeIds[index + 1];
};

export const isNodeUnlocked = (progress, nodeId) => (progress.unlocked ?? []).includes(nodeId);

export const isNodeCompleted = (progress, nodeId) => (progress.completed ?? []).includes(nodeId);

/**
 * A couple of reused legacy display components (PlayerStatus, reached
 * through GamePage) still read the old `completedLevels` field name. Rather
 * than rename it back on the new schema (the spec calls it `completed`) or
 * touch the shared component, this adapts at the boundary where the new
 * progress object is handed to old UI.
 */
export const toLegacyProgressView = (progress) => ({ ...progress, completedLevels: progress.completed ?? [] });

const getImprovementReward = (oldStars, bestStars) => {
  const previous = getStarReward(oldStars);
  const current = getStarReward(bestStars);
  return {
    xp: Math.max(0, current.xp - previous.xp),
    coins: Math.max(0, current.coins - previous.coins),
  };
};

/**
 * Same shape as the legacy completeLevel() in utils/gameLogic.js (so
 * ResultPage/VictoryPage need no changes to consume it) but the unlock
 * write is sequential-within-lesson instead of star-threshold. Also updates
 * progress.mistakes from gameSessionReducer's wrongMissionIds - added if
 * wrong, removed if answered correctly this time - regardless of whether
 * the node as a whole passed.
 */
export const completeNode = (progress, level, performanceOrCorrect, hintsUsed = 0, score = 0) => {
  const performance = typeof performanceOrCorrect === "number"
    ? { correct: performanceOrCorrect, hintsUsed, score }
    : (performanceOrCorrect ?? {});
  const correctCount = Number(performance.correct ?? 0);
  const usedHints = Number(performance.hintsUsed ?? 0);
  const currentScore = Number(performance.score ?? 0);
  const stars = calculateStars(correctCount, level.questions.length, usedHints);
  const passed = stars > 0;
  const oldStars = Number(progress.levelStars?.[String(level.id)] ?? 0);
  const bestStars = Math.max(oldStars, stars);
  const newRecord = bestStars > oldStars;
  const earnedReward = passed && newRecord ? getImprovementReward(oldStars, bestStars) : { xp: 0, coins: 0 };

  // Only the questions actually reached this run can be cleared from
  // mistakes on a correct answer - a session that ends early (hearts
  // depleted) never gave the player a chance at the rest, so those must be
  // left alone rather than assumed correct.
  const wrongThisRun = new Set(performance.wrongMissionIds ?? []);
  const attemptedCount = Number(performance.attemptedCount ?? level.questions.length);
  const mistakes = new Set(progress.mistakes ?? []);
  level.questions.slice(0, attemptedCount).forEach((question) => {
    if (wrongThisRun.has(question.id)) mistakes.add(question.id);
    else mistakes.delete(question.id);
  });

  let nextProgress = { ...progress, levelStars: { ...(progress.levelStars ?? {}) }, mistakes: [...mistakes] };

  const earned = {
    xp: earnedReward.xp,
    coins: earnedReward.coins,
    stars: Math.max(0, bestStars - oldStars),
    badges: [],
    knowledge: [],
    repeated: oldStars > 0,
    newRecord,
  };

  if (passed) {
    nextProgress.levelStars[String(level.id)] = bestStars;

    const completedSet = new Set([...(progress.completed ?? []), level.id]);
    const unlockedSet = new Set(progress.unlocked ?? []);
    const nextNodeId = getNextNodeId(level.id);
    if (nextNodeId != null) unlockedSet.add(nextNodeId);

    const firstClear = oldStars === 0;
    if (firstClear) earned.knowledge = level.knowledge.map((item) => item.id);
    const unlockedKnowledge = new Set(progress.unlockedKnowledge ?? []);
    if (firstClear) level.knowledge.forEach((item) => unlockedKnowledge.add(item.id));

    nextProgress = {
      ...nextProgress,
      completed: [...completedSet].sort((a, b) => a - b),
      unlocked: [...unlockedSet].sort((a, b) => a - b),
      unlockedKnowledge: [...unlockedKnowledge],
      xp: (nextProgress.xp ?? 0) + earnedReward.xp,
      coins: (nextProgress.coins ?? 0) + earnedReward.coins,
    };

    nextProgress.totalStars = getTotalStars(nextProgress);

    const previousBadges = nextProgress.badges ?? [];
    const badgeIds = new Set([...previousBadges, ...getEarnedBadgeIds(nextProgress), ...(level.badgeUnlock ?? [])]);
    const newBadges = [...badgeIds].filter((id) => !previousBadges.includes(id));
    nextProgress.badges = [...badgeIds];
    earned.badges = newBadges;
  } else {
    nextProgress.totalStars = getTotalStars(nextProgress);
  }

  nextProgress.level = calculatePlayerLevel(nextProgress.xp ?? 0);

  return {
    progress: nextProgress,
    passed,
    stars,
    previousStars: oldStars,
    bestStars,
    score: currentScore,
    hintsUsed: usedHints,
    missionMetrics: performance.missionMetrics ?? {},
    earned,
    level,
    correct: correctCount,
    total: level.questions.length,
    // Not `level.id === levels.length` - the Phase 3 pilot chapter appends
    // levels past the final boss, so the count alone no longer identifies
    // it. The final boss is the one level with a finalBoss-type mission.
    isVictory: passed && level.questions.some((question) => question.type === "finalBoss"),
  };
};

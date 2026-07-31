import { getLevelById } from "../data/levels.js";
import { calculatePlayerLevel } from "../utils/storage.js";
import { getEarnedBadgeIds, getTotalStars } from "../utils/gameLogic.js";
import units from "../content/units.json";
import { buildQuestionPool } from "./exercisePool.js";
import { todayKey } from "./progress.js";

const PAY_TO_UNLOCK_COST = 50;
/* Wrong answers already end the run early (GamePage's hearts start at 3, so
   a 3rd wrong stops the session) - reaching the end of the pool at all means
   at most 2 were wrong, matching "ผิดเกิน 2 ข้อ -> จบทันที" exactly without
   needing a separate ratio/threshold check. */
const MAX_QUESTIONS = 15;
const PER_NODE = 5;

const lessonLookup = (() => {
  const map = new Map();
  units.forEach((unit) => unit.lessons.forEach((lesson) => map.set(lesson.id, { unit, lesson })));
  return map;
})();

const nodeLessonLookup = (() => {
  const map = new Map();
  units.forEach((unit) => unit.lessons.forEach((lesson) => lesson.nodeIds.forEach((nodeId) => {
    map.set(nodeId, { unit, lesson });
  })));
  return map;
})();

export const getLessonForNode = (nodeId) => nodeLessonLookup.get(nodeId) ?? null;

/** Which chapter a node belongs to - lets "back to map" from a lesson/result/
    checkpoint screen return into that chapter's own path instead of jumping
    all the way out to the top-level chapter grid. */
export const getChapterIdForNode = (nodeId) => nodeLessonLookup.get(nodeId)?.unit.id ?? null;

export const getCheckpointId = (lessonId) => `checkpoint-${lessonId}`;

/** The first lesson (in route order) with any node not yet in progress.unlocked. */
export const getNextLockedLesson = (progress) => {
  const unlocked = new Set(progress.unlocked ?? []);
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      if (lesson.nodeIds.some((nodeId) => !unlocked.has(nodeId))) return { unit, lesson };
    }
  }
  return null;
};

/** A locked node offers the checkpoint only if it belongs to the next locked
    lesson - lessons further out stay inert, matching normal sequential play. */
export const isCheckpointEligible = (progress, nodeId) => {
  const info = getLessonForNode(nodeId);
  const next = getNextLockedLesson(progress);
  return Boolean(info && next && info.lesson.id === next.lesson.id);
};

export const isCheckpointAvailableToday = (progress, lessonId, today = todayKey()) =>
  progress.unlockTestUsed?.[lessonId] !== today;

export const canPayToUnlock = (progress) => (progress.coins ?? 0) >= PAY_TO_UNLOCK_COST;

export { PAY_TO_UNLOCK_COST };

/** Synthesizes a playable pseudo-level covering every node in the lesson. */
export const buildCheckpointLevel = (lessonId) => {
  const entry = lessonLookup.get(lessonId);
  if (!entry) return null;
  const { unit, lesson } = entry;
  const coveredNodeIds = lesson.nodeIds;
  const questions = buildQuestionPool(coveredNodeIds, { perNode: PER_NODE, max: MAX_QUESTIONS });
  if (!questions.length) return null;

  const knowledge = coveredNodeIds.flatMap((nodeId) => getLevelById(nodeId)?.knowledge ?? []);

  return {
    id: getCheckpointId(lessonId),
    isCheckpoint: true,
    lessonId,
    coveredNodeIds,
    title: `บททดสอบข้ามด่าน: ${unit.title}`,
    location: "ประตูทดสอบ",
    topic: `รวมความรู้ ${coveredNodeIds.length} ด่าน`,
    description: `ตอบให้ถูกจนจบ ผิดได้ไม่เกิน 2 ข้อ เพื่อปลดล็อค ${coveredNodeIds.length} ด่านพร้อมกัน`,
    backgroundTheme: unit.theme ?? "palace",
    questions,
    knowledge,
    badgeUnlock: [],
  };
};

/** Which covered node the player struggled with most, to point a failed attempt at. */
const worstNodeId = (checkpointLevel, wrongMissionIds) => {
  const wrongSet = new Set(wrongMissionIds);
  const counts = new Map();
  checkpointLevel.questions.forEach((question) => {
    if (!wrongSet.has(question.id)) return;
    counts.set(question.levelId, (counts.get(question.levelId) ?? 0) + 1);
  });
  let worst = null;
  let worstCount = 0;
  counts.forEach((count, nodeId) => {
    if (count > worstCount) {
      worst = nodeId;
      worstCount = count;
    }
  });
  return worst;
};

/**
 * Same result shape as nodeProgression's completeNode (so ResultPage can
 * mostly be reused): passed/earned/level/correct/total/isVictory. Passing
 * unlocks every node the checkpoint covered at once, credits each at least
 * one star (so the reused badge-condition math in gameLogic.js - which only
 * understands levelStars - stays consistent with the new "completed" list),
 * and records today's date so the free daily attempt is used up regardless
 * of outcome.
 */
export const completeCheckpoint = (progress, checkpointLevel, performance = {}) => {
  const total = checkpointLevel.questions.length;
  const attempted = Number(performance.attemptedCount ?? 0);
  const wrongMissionIds = performance.wrongMissionIds ?? [];
  const passed = attempted >= total;
  const today = todayKey();

  const earned = { xp: 0, coins: 0, stars: 0, badges: [], knowledge: [], repeated: false, newRecord: passed };

  const usedToday = { ...(progress.unlockTestUsed ?? {}), [checkpointLevel.lessonId]: today };

  if (!passed) {
    return {
      progress: { ...progress, unlockTestUsed: usedToday },
      passed: false,
      stars: 0,
      score: Number(performance.score ?? 0),
      hintsUsed: Number(performance.hintsUsed ?? 0),
      correct: Number(performance.correct ?? 0),
      total,
      level: checkpointLevel,
      isVictory: false,
      earned,
      worstNodeId: worstNodeId(checkpointLevel, wrongMissionIds),
    };
  }

  const levelStars = { ...(progress.levelStars ?? {}) };
  const unlockedKnowledge = new Set(progress.unlockedKnowledge ?? []);
  const newKnowledge = [];
  const completedSet = new Set(progress.completed ?? []);
  const unlockedSet = new Set(progress.unlocked ?? []);

  checkpointLevel.coveredNodeIds.forEach((nodeId) => {
    if (!levelStars[String(nodeId)]) levelStars[String(nodeId)] = 1;
    completedSet.add(nodeId);
    unlockedSet.add(nodeId);
    const source = getLevelById(nodeId);
    source?.knowledge.forEach((item) => {
      if (!unlockedKnowledge.has(item.id)) newKnowledge.push(item.id);
      unlockedKnowledge.add(item.id);
    });
  });

  const xp = 40 * checkpointLevel.coveredNodeIds.length;
  const coins = 20 * checkpointLevel.coveredNodeIds.length;

  let nextProgress = {
    ...progress,
    levelStars,
    unlockedKnowledge: [...unlockedKnowledge],
    completed: [...completedSet].sort((a, b) => a - b),
    unlocked: [...unlockedSet].sort((a, b) => a - b),
    unlockTestUsed: usedToday,
    clearedCheckpoints: [...new Set([...(progress.clearedCheckpoints ?? []), checkpointLevel.lessonId])],
    xp: (progress.xp ?? 0) + xp,
    coins: (progress.coins ?? 0) + coins,
  };

  nextProgress.totalStars = getTotalStars(nextProgress);
  nextProgress.level = calculatePlayerLevel(nextProgress.xp);

  const previousBadges = nextProgress.badges ?? [];
  const badgeIds = new Set([...previousBadges, ...getEarnedBadgeIds(nextProgress)]);
  nextProgress.badges = [...badgeIds];

  return {
    progress: nextProgress,
    passed: true,
    stars: checkpointLevel.coveredNodeIds.length,
    score: Number(performance.score ?? 0),
    hintsUsed: Number(performance.hintsUsed ?? 0),
    correct: Number(performance.correct ?? 0),
    total,
    level: checkpointLevel,
    isVictory: false,
    earned: {
      ...earned,
      xp,
      coins,
      stars: checkpointLevel.coveredNodeIds.length,
      knowledge: newKnowledge,
      badges: [...badgeIds].filter((id) => !previousBadges.includes(id)),
    },
  };
};

/** Pays a flat coin cost to unlock every node in a lesson directly, no quiz. */
export const payToUnlockLesson = (progress, lessonId) => {
  if (!canPayToUnlock(progress)) return null;
  const entry = lessonLookup.get(lessonId);
  if (!entry) return null;

  const unlockedSet = new Set(progress.unlocked ?? []);
  entry.lesson.nodeIds.forEach((nodeId) => unlockedSet.add(nodeId));

  return {
    ...progress,
    coins: progress.coins - PAY_TO_UNLOCK_COST,
    unlocked: [...unlockedSet].sort((a, b) => a - b),
  };
};

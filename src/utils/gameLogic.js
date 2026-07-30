import { badges } from "../data/badges.js";
import { levels, stageSets } from "../data/levels.js";
import { calculatePlayerLevel } from "./storage.js";

export const getLevelStars = (progress, levelId) => Number(progress.levelStars?.[String(levelId)] ?? 0);

export const getTotalStars = (progress) =>
  Object.values(progress.levelStars ?? {}).reduce((total, stars) => total + (Number(stars) || 0), 0);

export const getSetStars = (progress, setId) => {
  const set = stageSets.find((item) => item.id === Number(setId));
  return (set?.levels ?? []).reduce((total, levelId) => total + getLevelStars(progress, levelId), 0);
};

export const isLevelCompleted = (progress, levelId) => getLevelStars(progress, levelId) > 0;

/* Clearing a chapter's checkpoint opens that chapter outright. Without this the
   shortcut would be useless: skipping a chapter credits one star per level,
   which never reaches the star gate guarding the next one. */
const checkpointClears = (progress, setId) =>
  (progress.clearedCheckpoints ?? []).includes(`checkpoint-${setId}`);

export const isLevelUnlocked = (progress, levelId) => {
  const id = Number(levelId);
  if (id === 1) return true;

  const level = levels.find((item) => item.id === id);
  if (level && checkpointClears(progress, level.setId)) return true;

  if (id === 15) return isLevelCompleted(progress, 14) && getTotalStars(progress) >= 30;
  if (id >= 6 && id <= 10) return getSetStars(progress, 1) >= 8 && isLevelCompleted(progress, id - 1);
  if (id >= 11 && id <= 14) return getTotalStars(progress) >= 18 && isLevelCompleted(progress, id - 1);
  return isLevelCompleted(progress, id - 1);
};

/* The chapter card and its status text used to answer this question with two
   different rules, so a card could offer a map whose levels were all locked. */
export const isSetUnlocked = (progress, setId) => {
  const set = stageSets.find((item) => item.id === Number(setId));
  if (!set) return false;
  if (checkpointClears(progress, set.id)) return true;
  return levels.filter((level) => level.setId === set.id).some((level) => isLevelUnlocked(progress, level.id));
};

export const getUnlockedLevels = (progress) =>
  levels.filter((level) => isLevelUnlocked(progress, level.id)).map((level) => level.id);

export const getCurrentLevelId = (progress) => {
  const nextPlayable = levels.find((level) => isLevelUnlocked(progress, level.id) && !isLevelCompleted(progress, level.id));
  return nextPlayable?.id ?? levels[levels.length - 1].id;
};

export const getSetProgress = (progress, setId) => {
  const setLevels = levels.filter((level) => level.setId === Number(setId));
  const completed = setLevels.filter((level) => isLevelCompleted(progress, level.id)).length;
  const stars = getSetStars(progress, setId);
  return { completed, total: setLevels.length, stars, maxStars: setLevels.length * 3 };
};

export const getSetStatus = (progress, setId) => {
  const set = stageSets.find((item) => item.id === Number(setId));
  const setLevels = levels.filter((level) => level.setId === Number(setId));
  const unlocked = isSetUnlocked(progress, setId);
  const completed = setLevels.every((level) => isLevelCompleted(progress, level.id));
  if (completed) return "ผ่านแล้ว";
  if (!unlocked && set?.requiredStars) return `ต้องมีดาวอย่างน้อย ${set.requiredStars} ดวง`;
  if (unlocked && setLevels.some((level) => isLevelCompleted(progress, level.id))) return "กำลังเล่น";
  return unlocked ? "เริ่มเล่น" : "ยังไม่ปลดล็อก";
};

export const calculateStars = (correctCount, totalQuestions = 5, hintsUsed = 0) => {
  if (correctCount >= totalQuestions && hintsUsed <= 1) return 3;
  if (correctCount >= 4) return 2;
  if (correctCount >= 3) return 1;
  return 0;
};

export const getStarReward = (stars) => {
  if (stars >= 3) return { xp: 100, coins: 50 };
  if (stars === 2) return { xp: 60, coins: 25 };
  if (stars === 1) return { xp: 30, coins: 10 };
  return { xp: 0, coins: 0 };
};

const getImprovementReward = (oldStars, bestStars) => {
  const previous = getStarReward(oldStars);
  const current = getStarReward(bestStars);
  return {
    xp: Math.max(0, current.xp - previous.xp),
    coins: Math.max(0, current.coins - previous.coins),
  };
};

const perfectLevelCount = (progress) => Object.values(progress.levelStars ?? {}).filter((stars) => Number(stars) === 3).length;

const conditionMet = (condition, progress) => {
  switch (condition.type) {
    case "level-complete":
      return isLevelCompleted(progress, condition.levelId);
    case "complete-set": {
      const setLevels = levels.filter((level) => level.setId === condition.setId);
      return setLevels.every((level) => isLevelCompleted(progress, level.id));
    }
    case "stars":
      return getTotalStars(progress) >= condition.count;
    case "perfect-count":
      return perfectLevelCount(progress) >= condition.count;
    case "all-perfect":
      return levels.every((level) => getLevelStars(progress, level.id) === 3);
    case "all-levels":
      return levels.every((level) => isLevelCompleted(progress, level.id));
    case "checkpoint-count":
      return (progress.clearedCheckpoints ?? []).length >= condition.count;
    default:
      return false;
  }
};

export const getEarnedBadgeIds = (progress) =>
  badges.filter((badge) => conditionMet(badge.condition, progress)).map((badge) => badge.id);

export const completeLevel = (progress, level, performanceOrCorrect, hintsUsed = 0, score = 0) => {
  const performance = typeof performanceOrCorrect === "number"
    ? { correct: performanceOrCorrect, hintsUsed, score }
    : (performanceOrCorrect ?? {});
  const correctCount = Number(performance.correct ?? 0);
  const usedHints = Number(performance.hintsUsed ?? 0);
  const currentScore = Number(performance.score ?? 0);
  const stars = calculateStars(correctCount, level.questions.length, usedHints);
  const passed = stars > 0;
  const oldStars = getLevelStars(progress, level.id);
  const bestStars = Math.max(oldStars, stars);
  const newRecord = bestStars > oldStars;
  const earnedReward = passed && newRecord ? getImprovementReward(oldStars, bestStars) : { xp: 0, coins: 0 };

  let nextProgress = {
    ...progress,
    lastPlayedLevel: level.id,
    levelStars: { ...(progress.levelStars ?? {}) },
  };

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

    const completedLevels = new Set([...(progress.completedLevels ?? []), level.id]);
    const unlockedKnowledge = new Set(progress.unlockedKnowledge ?? []);
    const firstClear = oldStars === 0;
    if (firstClear) {
      level.knowledge.forEach((item) => unlockedKnowledge.add(item.id));
      earned.knowledge = level.knowledge.map((item) => item.id);
    }

    nextProgress = {
      ...nextProgress,
      completedLevels: [...completedLevels].sort((a, b) => a - b),
      unlockedKnowledge: [...unlockedKnowledge],
      xp: (nextProgress.xp ?? 0) + earnedReward.xp,
      coins: (nextProgress.coins ?? 0) + earnedReward.coins,
    };

    nextProgress.totalStars = getTotalStars(nextProgress);
    nextProgress.unlockedLevels = getUnlockedLevels(nextProgress);

    const previousBadges = nextProgress.badges ?? [];
    const badgeIds = new Set([...previousBadges, ...getEarnedBadgeIds(nextProgress), ...(level.badgeUnlock ?? [])]);
    const newBadges = [...badgeIds].filter((id) => !previousBadges.includes(id));
    nextProgress.badges = [...badgeIds];
    earned.badges = newBadges;
  } else {
    nextProgress.xp = nextProgress.xp ?? 0;
    nextProgress.totalStars = getTotalStars(nextProgress);
    nextProgress.unlockedLevels = getUnlockedLevels(nextProgress);
  }

  nextProgress.level = calculatePlayerLevel(nextProgress.xp);

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
    isVictory: passed && level.id === levels.length,
  };
};

import { levels, stageSets } from "../data/levels.js";
import { getUnlockedLevels, getTotalStars, isLevelCompleted } from "./gameLogic.js";
import { calculatePlayerLevel } from "./storage.js";

/** Passing is meant to prove the chapter is already known, so it is a high bar. */
export const CHECKPOINT_PASS_RATIO = 0.8;
const MISSIONS_PER_LEVEL = 2;
const MAX_QUESTIONS = 10;

export const getCheckpointId = (setId) => `checkpoint-${setId}`;

export const isCheckpointCleared = (progress, setId) =>
  (progress.clearedCheckpoints ?? []).includes(getCheckpointId(setId));

/** The levels a checkpoint would credit: everything in the chapter not already cleared. */
export const getCheckpointLevels = (progress, setId) =>
  levels.filter((level) => level.setId === Number(setId) && !isLevelCompleted(progress, level.id));

/**
 * A checkpoint draws from every level it would skip, so passing it means
 * recognising the whole chapter rather than one lesson of it. Sampling is
 * spread across mission types instead of taking each level's first two, which
 * would make the test mostly matching boards.
 */
const sampleMissions = (coveredLevels) => {
  const perLevel = coveredLevels.map((level) => {
    const byType = new Map();
    level.questions.forEach((question) => {
      if (!byType.has(question.type)) byType.set(question.type, []);
      byType.get(question.type).push(question);
    });
    // one of each type first, so a level contributes variety before repeats
    const spread = [...byType.values()].flatMap((group) => group.slice(0, 1));
    const rest = level.questions.filter((question) => !spread.includes(question));
    return [...spread, ...rest].slice(0, MISSIONS_PER_LEVEL);
  });

  // interleave, so the test moves between levels rather than marching through one
  const questions = [];
  for (let round = 0; round < MISSIONS_PER_LEVEL; round += 1) {
    perLevel.forEach((group) => {
      if (group[round]) questions.push(group[round]);
    });
  }
  return questions.slice(0, MAX_QUESTIONS);
};

export const buildCheckpointLevel = (progress, setId) => {
  const set = stageSets.find((item) => item.id === Number(setId));
  const covered = getCheckpointLevels(progress, setId);
  if (!set || covered.length === 0) return null;

  const questions = sampleMissions(covered);
  if (questions.length === 0) return null;

  return {
    id: getCheckpointId(setId),
    setId: Number(setId),
    isCheckpoint: true,
    coveredLevelIds: covered.map((level) => level.id),
    title: `บททดสอบข้ามด่าน: ${set.title.replace(`ชุดที่ ${set.id}: `, "")}`,
    location: "ประตูทดสอบ",
    topic: `รวมความรู้ ${covered.length} ด่าน`,
    description: `ตอบให้ถูกอย่างน้อย ${Math.ceil(questions.length * CHECKPOINT_PASS_RATIO)} จาก ${questions.length} ข้อ เพื่อข้ามไปทั้ง ${covered.length} ด่านพร้อมกัน`,
    backgroundTheme: set.theme ?? "palace",
    questions,
    knowledge: covered.flatMap((level) => level.knowledge),
    badgeUnlock: [],
  };
};

export const checkpointPassMark = (questionCount) => Math.ceil(questionCount * CHECKPOINT_PASS_RATIO);

/**
 * Credits every level the checkpoint covered at one star — the same minimum a
 * lesson gives — and opens their vocabulary, since a player who skips the
 * lessons never meets those words otherwise.
 */
export const completeCheckpoint = (progress, checkpointLevel, performance = {}) => {
  const total = checkpointLevel.questions.length;
  const correct = Number(performance.correct ?? 0);
  const passed = correct >= checkpointPassMark(total);

  const earned = { xp: 0, coins: 0, stars: 0, badges: [], knowledge: [], repeated: false, newRecord: passed };

  if (!passed) {
    return {
      progress, passed, stars: 0, previousStars: 0, bestStars: 0,
      score: Number(performance.score ?? 0), hintsUsed: Number(performance.hintsUsed ?? 0),
      correct, total, earned, level: checkpointLevel, isVictory: false,
    };
  }

  const levelStars = { ...(progress.levelStars ?? {}) };
  const unlockedKnowledge = new Set(progress.unlockedKnowledge ?? []);
  const newKnowledge = [];

  checkpointLevel.coveredLevelIds.forEach((levelId) => {
    if (!levelStars[String(levelId)]) levelStars[String(levelId)] = 1;
    const source = levels.find((level) => level.id === levelId);
    source?.knowledge.forEach((item) => {
      if (!unlockedKnowledge.has(item.id)) newKnowledge.push(item.id);
      unlockedKnowledge.add(item.id);
    });
  });

  const xp = 40 * checkpointLevel.coveredLevelIds.length;
  const coins = 20 * checkpointLevel.coveredLevelIds.length;

  let nextProgress = {
    ...progress,
    levelStars,
    unlockedKnowledge: [...unlockedKnowledge],
    completedLevels: [...new Set([...(progress.completedLevels ?? []), ...checkpointLevel.coveredLevelIds])].sort((a, b) => a - b),
    clearedCheckpoints: [...new Set([...(progress.clearedCheckpoints ?? []), checkpointLevel.id])],
    xp: (progress.xp ?? 0) + xp,
    coins: (progress.coins ?? 0) + coins,
  };

  nextProgress.totalStars = getTotalStars(nextProgress);
  nextProgress.unlockedLevels = getUnlockedLevels(nextProgress);
  nextProgress.level = calculatePlayerLevel(nextProgress.xp);

  return {
    progress: nextProgress,
    passed: true,
    stars: 1,
    previousStars: 0,
    bestStars: 1,
    score: Number(performance.score ?? 0),
    hintsUsed: Number(performance.hintsUsed ?? 0),
    correct,
    total,
    level: checkpointLevel,
    isVictory: false,
    earned: {
      ...earned,
      xp,
      coins,
      stars: checkpointLevel.coveredLevelIds.length,
      knowledge: newKnowledge,
    },
  };
};

import { describe, expect, it } from "vitest";
import { levels } from "../data/levels";
import {
  buildCheckpointLevel,
  checkpointPassMark,
  completeCheckpoint,
  getCheckpointLevels,
  isCheckpointCleared,
} from "./checkpoint";
import { isLevelUnlocked, isSetUnlocked } from "./gameLogic";

const fresh = () => ({
  levelStars: {}, completedLevels: [], unlockedKnowledge: [], clearedCheckpoints: [],
  badges: [], xp: 0, coins: 0, totalStars: 0, level: 1,
});

describe("checkpoint", () => {
  it("covers only the levels of the chapter that are still unfinished", () => {
    const progress = { ...fresh(), levelStars: { 1: 3, 2: 2 } };

    expect(getCheckpointLevels(progress, 1).map((level) => level.id)).toEqual([3, 4, 5]);
    expect(getCheckpointLevels(progress, 2)).toHaveLength(5);
  });

  it("draws its questions from every level it would skip", () => {
    const built = buildCheckpointLevel(fresh(), 1);
    const sources = new Set(built.questions.map((question) => question.levelId));

    expect(built.coveredLevelIds).toEqual([1, 2, 3, 4, 5]);
    expect([...sources].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(built.questions.length).toBeLessThanOrEqual(10);
    // and mixes mission types rather than being all of one kind
    expect(new Set(built.questions.map((question) => question.type)).size).toBeGreaterThan(2);
  });

  it("has nothing to offer once the chapter is finished", () => {
    const done = { ...fresh(), levelStars: Object.fromEntries([1, 2, 3, 4, 5].map((id) => [id, 3])) };
    expect(buildCheckpointLevel(done, 1)).toBeNull();
  });

  it("credits one star and the vocabulary of every skipped level on a pass", () => {
    const progress = fresh();
    const built = buildCheckpointLevel(progress, 1);
    const outcome = completeCheckpoint(progress, built, { correct: built.questions.length });

    expect(outcome.passed).toBe(true);
    built.coveredLevelIds.forEach((id) => {
      expect(outcome.progress.levelStars[String(id)]).toBe(1);
    });
    const expectedKnowledge = levels
      .filter((level) => built.coveredLevelIds.includes(level.id))
      .flatMap((level) => level.knowledge.map((item) => item.id));
    expect(outcome.progress.unlockedKnowledge).toEqual(expect.arrayContaining(expectedKnowledge));
  });

  it("changes nothing when the pass mark is missed", () => {
    const progress = fresh();
    const built = buildCheckpointLevel(progress, 1);
    const outcome = completeCheckpoint(progress, built, { correct: checkpointPassMark(built.questions.length) - 1 });

    expect(outcome.passed).toBe(false);
    expect(outcome.progress).toBe(progress);
    expect(isCheckpointCleared(outcome.progress, 1)).toBe(false);
  });

  it("opens the chapter it guards, which the star gate alone would not", () => {
    const progress = fresh();
    const built = buildCheckpointLevel(progress, 2);
    const outcome = completeCheckpoint(progress, built, { correct: built.questions.length });

    // five skipped levels give five stars, short of the eight the gate wants
    expect(outcome.progress.totalStars).toBeLessThan(8);
    expect(isSetUnlocked(outcome.progress, 2)).toBe(true);
    expect(isLevelUnlocked(outcome.progress, 6)).toBe(true);
    expect(isLevelUnlocked(outcome.progress, 10)).toBe(true);
  });

  it("leaves a level already earned above one star untouched", () => {
    const progress = { ...fresh(), levelStars: { 1: 3 } };
    const built = buildCheckpointLevel(progress, 1);
    const outcome = completeCheckpoint(progress, built, { correct: built.questions.length });

    expect(outcome.progress.levelStars["1"]).toBe(3);
    expect(outcome.progress.levelStars["2"]).toBe(1);
  });
});

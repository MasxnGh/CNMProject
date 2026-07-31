import { describe, expect, it } from "vitest";
import { levels } from "../data/levels";
import {
  calculateStars,
  completeLevel,
  getLevelStars,
  getStarReward,
} from "./gameLogic";
import { defaultProgress } from "./storage";

const level = (id = 1) => ({
  id,
  questions: [{}, {}, {}, {}, {}],
  knowledge: [{ id: `${id}-knowledge` }],
  badgeUnlock: [],
});

describe("star rewards", () => {
  it("calculates stars from performance and hint usage", () => {
    expect(calculateStars(5, 5, 0)).toBe(3);
    expect(calculateStars(5, 5, 1)).toBe(3);
    expect(calculateStars(5, 5, 2)).toBe(2);
    expect(calculateStars(4, 5, 0)).toBe(2);
    expect(calculateStars(3, 5, 0)).toBe(1);
    expect(calculateStars(2, 5, 0)).toBe(0);
  });

  it("awards the configured economy reward on a first clear", () => {
    const result = completeLevel(defaultProgress, level(), { correct: 5, hintsUsed: 0, score: 100 });

    expect(result.passed).toBe(true);
    expect(result.stars).toBe(3);
    expect(result.earned).toMatchObject({ xp: 100, coins: 50, stars: 3, newRecord: true });
    expect(result.progress.xp).toBe(100);
    expect(result.progress.coins).toBe(50);
    expect(getLevelStars(result.progress, 1)).toBe(3);
  });

  it("only pays the difference when a replay improves the best stars", () => {
    const previous = {
      ...defaultProgress,
      levelStars: { "1": 1 },
      completedLevels: [1],
      unlockedKnowledge: ["1-knowledge"],
      xp: 30,
      coins: 10,
    };
    const result = completeLevel(previous, level(), { correct: 5, hintsUsed: 0, score: 100 });

    expect(result.earned).toMatchObject({ xp: 70, coins: 40, stars: 2, newRecord: true });
    expect(result.progress.xp).toBe(100);
    expect(result.progress.coins).toBe(50);
    expect(result.progress.levelStars["1"]).toBe(3);
  });

  it("does not reduce stars or inflate rewards on equal or lower replays", () => {
    const previous = {
      ...defaultProgress,
      levelStars: { "1": 3 },
      completedLevels: [1],
      xp: 100,
      coins: 50,
    };
    const lower = completeLevel(previous, level(), { correct: 3, hintsUsed: 0, score: 60 });
    const equal = completeLevel(previous, level(), { correct: 5, hintsUsed: 0, score: 100 });

    expect(lower.progress.levelStars["1"]).toBe(3);
    expect(lower.earned).toMatchObject({ xp: 0, coins: 0, stars: 0, newRecord: false });
    expect(equal.earned).toMatchObject({ xp: 0, coins: 0, stars: 0, newRecord: false });
  });

  it("does not award economy rewards for an unpassed attempt", () => {
    const result = completeLevel(defaultProgress, level(), { correct: 2, hintsUsed: 0, score: 40 });

    expect(result.passed).toBe(false);
    expect(result.stars).toBe(0);
    expect(result.progress.xp).toBe(0);
    expect(result.progress.coins).toBe(0);
    expect(result.progress.completedLevels).toEqual([]);
  });

  it("marks level 15 completion as victory only after a pass", () => {
    // isVictory looks for a finalBoss-type mission (not level.id === levels
    // .length - the Phase 3 pilot chapter appends levels past 15 on a
    // separate track), so the mock level needs one to exercise that path.
    const bossLevel = { ...level(15), questions: [{ type: "finalBoss" }, {}, {}, {}, {}] };
    const finalResult = completeLevel(defaultProgress, bossLevel, { correct: 5, hintsUsed: 0, score: 100 });
    const failedResult = completeLevel(defaultProgress, bossLevel, { correct: 2, hintsUsed: 0, score: 40 });

    expect(finalResult.isVictory).toBe(true);
    expect(failedResult.isVictory).toBe(false);
    expect(levels).toHaveLength(20);
  });

  it("keeps reward tiers explicit for UI and tests", () => {
    expect(getStarReward(1)).toEqual({ xp: 30, coins: 10 });
    expect(getStarReward(2)).toEqual({ xp: 60, coins: 25 });
    expect(getStarReward(3)).toEqual({ xp: 100, coins: 50 });
  });
});

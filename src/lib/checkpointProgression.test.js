import { describe, expect, it } from "vitest";
import { defaultProgress } from "./progress.js";
import {
  buildCheckpointLevel,
  canPayToUnlock,
  completeCheckpoint,
  getLessonForNode,
  getNextLockedLesson,
  isCheckpointAvailableToday,
  isCheckpointEligible,
  payToUnlockLesson,
} from "./checkpointProgression.js";

describe("getLessonForNode / getNextLockedLesson", () => {
  it("finds the lesson a node belongs to", () => {
    expect(getLessonForNode(2)?.lesson.id).toBe("u1_l1");
    expect(getLessonForNode(4)?.lesson.id).toBe("u1_l2");
  });

  it("returns null for an id not on the route", () => {
    expect(getLessonForNode(9999)).toBeNull();
  });

  it("finds the first lesson with anything still locked", () => {
    expect(getNextLockedLesson(defaultProgress).lesson.id).toBe("u1_l1");
    expect(getNextLockedLesson({ ...defaultProgress, unlocked: [1, 2, 3] }).lesson.id).toBe("u1_l2");
  });
});

describe("isCheckpointEligible", () => {
  it("offers the shortcut only for the next locked lesson, not lessons further out", () => {
    expect(isCheckpointEligible(defaultProgress, 2)).toBe(true);
    expect(isCheckpointEligible(defaultProgress, 6)).toBe(false);
  });
});

describe("isCheckpointAvailableToday", () => {
  it("is available by default and blocked after use, per lesson per day", () => {
    expect(isCheckpointAvailableToday(defaultProgress, "u1_l1", "2026-07-30")).toBe(true);

    const used = { ...defaultProgress, unlockTestUsed: { u1_l1: "2026-07-30" } };
    expect(isCheckpointAvailableToday(used, "u1_l1", "2026-07-30")).toBe(false);
    expect(isCheckpointAvailableToday(used, "u1_l1", "2026-07-31")).toBe(true);
    expect(isCheckpointAvailableToday(used, "u1_l2", "2026-07-30")).toBe(true);
  });
});

describe("buildCheckpointLevel", () => {
  it("covers every node in the lesson with at least one question each", () => {
    const level = buildCheckpointLevel("u1_l2");
    expect(level.coveredNodeIds).toEqual([4, 5]);
    const levelIdsInPool = new Set(level.questions.map((question) => question.levelId));
    expect(levelIdsInPool).toEqual(new Set([4, 5]));
  });

  it("returns null for an unknown lesson id", () => {
    expect(buildCheckpointLevel("nope")).toBeNull();
  });
});

describe("completeCheckpoint", () => {
  it("unlocks every covered node and awards rewards on a full clear", () => {
    const level = buildCheckpointLevel("u1_l2");
    const outcome = completeCheckpoint(defaultProgress, level, { attemptedCount: level.questions.length, correct: level.questions.length - 1, wrongMissionIds: [] });

    expect(outcome.passed).toBe(true);
    expect(outcome.progress.unlocked).toEqual(expect.arrayContaining([4, 5]));
    expect(outcome.progress.completed).toEqual(expect.arrayContaining([4, 5]));
    expect(outcome.earned.xp).toBeGreaterThan(0);
    expect(outcome.earned.coins).toBeGreaterThan(0);
    expect(outcome.progress.clearedCheckpoints).toContain("u1_l2");
    expect(outcome.progress.unlockTestUsed.u1_l2).toBeTruthy();
  });

  it("does not unlock anything on a run that ended early, and points at the worst node", () => {
    const level = buildCheckpointLevel("u1_l2");
    const wrongId = level.questions.find((question) => question.levelId === 5)?.id;
    const outcome = completeCheckpoint(defaultProgress, level, {
      attemptedCount: 2,
      wrongMissionIds: [wrongId],
    });

    expect(outcome.passed).toBe(false);
    expect(outcome.progress.unlocked).toEqual(defaultProgress.unlocked);
    expect(outcome.worstNodeId).toBe(5);
    // the daily attempt is used up either way
    expect(outcome.progress.unlockTestUsed.u1_l2).toBeTruthy();
  });

  it("awards the shortcut badge the first time a checkpoint is cleared", () => {
    const level = buildCheckpointLevel("u1_l2");
    const outcome = completeCheckpoint(defaultProgress, level, { attemptedCount: level.questions.length });
    expect(outcome.progress.badges).toContain("shortcut-scholar");
    expect(outcome.earned.badges).toContain("shortcut-scholar");
  });
});

describe("payToUnlockLesson", () => {
  it("unlocks the lesson and deducts coins when affordable", () => {
    const rich = { ...defaultProgress, coins: 100 };
    expect(canPayToUnlock(rich)).toBe(true);

    const next = payToUnlockLesson(rich, "u1_l2");
    expect(next.coins).toBe(50);
    expect(next.unlocked).toEqual(expect.arrayContaining([4, 5]));
  });

  it("refuses when the player can't afford it", () => {
    expect(canPayToUnlock(defaultProgress)).toBe(false);
    expect(payToUnlockLesson(defaultProgress, "u1_l2")).toBeNull();
  });
});

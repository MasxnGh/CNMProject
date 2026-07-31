import { describe, expect, it } from "vitest";
import { getLevelById } from "../data/levels.js";
import { defaultProgress } from "./progress.js";
import { completeNode, getNextNodeId, isNodeCompleted, isNodeUnlocked } from "./nodeProgression.js";

describe("getNextNodeId", () => {
  it("returns the next node on the route", () => {
    // Chapter 1 (แนะนำตัวเอง) leads with nodes [2, 3] - node 2 is the actual
    // start of the route since the Phase 2 chapter restructure.
    expect(getNextNodeId(2)).toBe(3);
  });

  it("returns null past the last node", () => {
    expect(getNextNodeId(15)).toBeNull();
  });

  it("returns null for an id not on the route", () => {
    expect(getNextNodeId(999)).toBeNull();
  });
});

describe("completeNode", () => {
  const level1 = getLevelById(2);

  it("unlocks the next node and marks this one completed on a pass", () => {
    const outcome = completeNode(defaultProgress, level1, { correct: level1.questions.length, hintsUsed: 0, score: 100 });

    expect(outcome.passed).toBe(true);
    expect(isNodeCompleted(outcome.progress, 2)).toBe(true);
    expect(isNodeUnlocked(outcome.progress, 3)).toBe(true);
  });

  it("does not unlock or complete anything on a fail", () => {
    const outcome = completeNode(defaultProgress, level1, { correct: 0, hintsUsed: 0, score: 0 });

    expect(outcome.passed).toBe(false);
    expect(isNodeCompleted(outcome.progress, 2)).toBe(false);
    expect(isNodeUnlocked(outcome.progress, 3)).toBe(false);
  });

  it("awards xp/coins and produces a ResultPage-compatible shape", () => {
    const outcome = completeNode(defaultProgress, level1, { correct: level1.questions.length, hintsUsed: 0, score: 100 });

    expect(outcome.earned.xp).toBeGreaterThan(0);
    expect(outcome.earned.coins).toBeGreaterThan(0);
    expect(outcome.level).toBe(level1);
    expect(outcome.total).toBe(level1.questions.length);
    expect(outcome).toMatchObject({ correct: level1.questions.length, isVictory: false });
  });

  it("does not re-award xp/coins for repeating an already 3-starred level", () => {
    const maxed = { ...defaultProgress, levelStars: { 2: 3 } };
    const outcome = completeNode(maxed, level1, { correct: level1.questions.length, hintsUsed: 0, score: 100 });

    expect(outcome.passed).toBe(true);
    expect(outcome.earned.newRecord).toBe(false);
    expect(outcome.earned.xp).toBe(0);
    expect(outcome.earned.coins).toBe(0);
    expect(outcome.earned.repeated).toBe(true);
  });

  it("unlocks the next node on a bare minimum pass (1 star), the same as a perfect run - no star threshold gates progression", () => {
    // level1 has 5 questions: 3 correct is the lowest passing score
    // (calculateStars returns 1 star, not 0) - see utils/gameLogic.js.
    const outcome = completeNode(defaultProgress, level1, { correct: 3, hintsUsed: 0, score: 60 });

    expect(outcome.stars).toBe(1);
    expect(outcome.passed).toBe(true);
    expect(isNodeUnlocked(outcome.progress, 3)).toBe(true);
  });

  it("flags victory on the final node", () => {
    const level15 = getLevelById(15);
    const outcome = completeNode(defaultProgress, level15, { correct: level15.questions.length, hintsUsed: 0, score: 100 });
    expect(outcome.isVictory).toBe(true);
    expect(getNextNodeId(15)).toBeNull();
  });

  it("adds wrongly-answered questions to progress.mistakes", () => {
    const wrongId = level1.questions[1].id;
    const outcome = completeNode(defaultProgress, level1, {
      correct: level1.questions.length - 1,
      wrongMissionIds: [wrongId],
      attemptedCount: level1.questions.length,
    });

    expect(outcome.progress.mistakes).toEqual([wrongId]);
  });

  it("clears a mistake once it's answered correctly on a later attempt", () => {
    const wrongId = level1.questions[1].id;
    const withMistake = { ...defaultProgress, mistakes: [wrongId] };
    const outcome = completeNode(withMistake, level1, {
      correct: level1.questions.length,
      wrongMissionIds: [],
      attemptedCount: level1.questions.length,
    });

    expect(outcome.progress.mistakes).toEqual([]);
  });

  it("does not clear mistakes for questions never reached in a session cut short", () => {
    const laterId = level1.questions[level1.questions.length - 1].id;
    const withMistake = { ...defaultProgress, mistakes: [laterId] };
    // Session ended after the first question (e.g. hearts depleted) - the
    // last question, already in mistakes, was never attempted this run.
    const outcome = completeNode(withMistake, level1, {
      correct: 0,
      wrongMissionIds: [],
      attemptedCount: 1,
    });

    expect(outcome.progress.mistakes).toEqual([laterId]);
  });
});

import { describe, expect, it } from "vitest";
import { getLevelById } from "../data/levels.js";
import { buildQuestionPool } from "./exercisePool.js";

describe("buildQuestionPool", () => {
  it("includes at least one question from every requested node", () => {
    const pool = buildQuestionPool([1, 2, 3]);
    const levelIdsInPool = new Set(pool.map((question) => question.levelId));
    expect(levelIdsInPool).toEqual(new Set([1, 2, 3]));
  });

  it("interleaves rather than marching through one node at a time", () => {
    const pool = buildQuestionPool([1, 2]);
    const firstTwo = pool.slice(0, 2).map((question) => question.levelId);
    expect(new Set(firstTwo).size).toBe(2);
  });

  it("caps the total at max", () => {
    const pool = buildQuestionPool([1, 2, 3], { max: 4 });
    expect(pool.length).toBeLessThanOrEqual(4);
  });

  it("skips a node id that doesn't resolve to a level", () => {
    const pool = buildQuestionPool([1, 9999]);
    expect(pool.every((question) => question.levelId === 1)).toBe(true);
    expect(pool.length).toBe(getLevelById(1).questions.length);
  });
});

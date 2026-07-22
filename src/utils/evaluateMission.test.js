import { describe, expect, it } from "vitest";
import { evaluateMission } from "./evaluateMission";

const mission = (type, correctAnswer, mechanics) => ({
  type,
  answer: { correctAnswer },
  mechanics,
});

describe("evaluateMission", () => {
  it.each([
    "multipleChoice",
    "pinyinDrag",
    "toneChoice",
    "fillBlank",
    "audioChoice",
    "cultureQuiz",
    "finalBoss",
  ])("compares %s candidates as scalar values", (type) => {
    const current = mission(type, "expected");

    expect(evaluateMission(current, "expected")).toBe(true);
    expect(evaluateMission(current, "other")).toBe(false);
    expect(evaluateMission(current, ["expected"])).toBe(false);
  });

  it("requires the exact word order for sentence missions", () => {
    const current = {
      type: "sentenceOrder",
      answer: { correctSequence: ["I", "like", "tea"], correctAnswer: ["I", "like", "tea"] },
    };

    expect(evaluateMission(current, ["I", "like", "tea"])).toBe(true);
    expect(evaluateMission(current, ["tea", "like", "I"])).toBe(false);
    expect(evaluateMission(current, ["I", "like"])).toBe(false);
  });

  it("compares shopping item ids without depending on selection order", () => {
    const current = mission("shopping", ["tea", "water"]);

    expect(evaluateMission(current, ["water", "tea"])).toBe(true);
    expect(evaluateMission(current, ["tea"])).toBe(false);
    expect(evaluateMission(current, ["tea", "water", "rice"])).toBe(false);
  });

  it("requires a complete matching mapping regardless of key insertion order", () => {
    const current = mission("matching", { cat: "meow", dog: "woof" });

    expect(evaluateMission(current, { dog: "woof", cat: "meow" })).toBe(true);
    expect(evaluateMission(current, { cat: "meow" })).toBe(false);
    expect(evaluateMission(current, { cat: "meow", dog: "wrong" })).toBe(false);
    expect(evaluateMission(current, { cat: "meow", dog: "woof", bird: "chirp" })).toBe(false);
  });

  it("accepts a basic practice trace without applying challenge coverage penalties", () => {
    const current = mission("hanziTrace", "person", { mode: "practice", minStrokePoints: 28 });

    expect(evaluateMission(current, {
      type: "hanziTrace",
      strokeCount: 1,
      pointCount: 4,
      boundsCoverage: 0.01,
      quadrantCoverage: 0.25,
      passed: false,
      attempted: true,
    })).toBe(true);
  });

  it("requires answer-free coverage metrics for a challenge trace", () => {
    const current = mission("hanziTrace", "person", { mode: "challenge", minStrokePoints: 12 });
    const broadAttempt = {
      type: "hanziTrace",
      strokeCount: 3,
      pointCount: 12,
      boundsCoverage: 0.32,
      quadrantCoverage: 1,
      passed: true,
      attempted: true,
    };

    expect(evaluateMission(current, broadAttempt)).toBe(true);
    expect(evaluateMission(current, { ...broadAttempt, pointCount: 11 })).toBe(false);
    expect(evaluateMission(current, { ...broadAttempt, boundsCoverage: 0.01, passed: false })).toBe(false);
    expect(evaluateMission(current, { ...broadAttempt, attempted: false })).toBe(false);
    expect(evaluateMission(current, "person")).toBe(false);
  });

  it("returns false for malformed or unsupported candidates", () => {
    expect(evaluateMission(null, "answer")).toBe(false);
    expect(evaluateMission({ type: "matching", answer: null }, {})).toBe(false);
    expect(evaluateMission({ type: "unknown", answer: { correctAnswer: "answer" } }, "answer")).toBe(false);
  });
});

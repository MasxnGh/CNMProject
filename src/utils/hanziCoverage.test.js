import { describe, expect, it } from "vitest";
import { scoreStrokeSet } from "./hanziCoverage";

const canvas = { width: 300, height: 300 };

describe("scoreStrokeSet", () => {
  it("rejects a dense scribble confined to a tiny corner", () => {
    const cornerScribble = [Array.from({ length: 40 }, (_, index) => ({
      x: 8 + (index % 5),
      y: 10 + (index % 7),
    }))];

    expect(scoreStrokeSet(cornerScribble, canvas)).toEqual(expect.objectContaining({
      strokeCount: 1,
      pointCount: 40,
      passed: false,
    }));
  });

  it("accepts a plausible multi-stroke attempt covering the writing area", () => {
    const broadAttempt = [
      [{ x: 70, y: 55 }, { x: 95, y: 100 }, { x: 120, y: 150 }, { x: 145, y: 220 }],
      [{ x: 230, y: 60 }, { x: 205, y: 105 }, { x: 180, y: 155 }, { x: 155, y: 225 }],
      [{ x: 65, y: 150 }, { x: 110, y: 150 }, { x: 165, y: 150 }, { x: 225, y: 150 }],
    ];

    expect(scoreStrokeSet(broadAttempt, canvas)).toEqual(expect.objectContaining({
      strokeCount: 3,
      pointCount: 12,
      passed: true,
    }));
    expect(scoreStrokeSet(broadAttempt, canvas).boundsCoverage).toBeGreaterThan(0.2);
    expect(scoreStrokeSet(broadAttempt, canvas).quadrantCoverage).toBe(1);
  });

  it("ignores malformed and out-of-bounds points", () => {
    const result = scoreStrokeSet([
      [{ x: Number.NaN, y: 20 }, { x: -10, y: 5 }, { x: 20, y: 20 }],
      null,
    ], canvas);

    expect(result).toEqual({
      strokeCount: 1,
      pointCount: 1,
      boundsCoverage: 0,
      quadrantCoverage: 0.25,
      passed: false,
    });
  });
});

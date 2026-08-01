import { describe, expect, it } from "vitest";
import { buildPool } from "./exerciseMix.js";

const makeExercises = (lessonId, types) => types.map((type, index) => ({ type, id: `${lessonId}-${index}`, lessonId }));

describe("lib/exerciseMix", () => {
  it("draws from every lesson instead of clustering on one", () => {
    const byLesson = {
      l1: makeExercises("l1", ["pickImage", "pickImage", "pickImage"]),
      l2: makeExercises("l2", ["pickAudio", "pickAudio", "pickAudio"]),
    };
    const pool = buildPool(byLesson, ["l1", "l2"], 6);

    expect(pool).toHaveLength(6);
    const fromL1 = pool.filter((item) => item.lessonId === "l1").length;
    const fromL2 = pool.filter((item) => item.lessonId === "l2").length;
    expect(fromL1).toBe(3);
    expect(fromL2).toBe(3);
  });

  it("caps at count even when more exercises are available", () => {
    const byLesson = { l1: makeExercises("l1", Array.from({ length: 10 }, () => "pickImage")) };
    const pool = buildPool(byLesson, ["l1"], 4);
    expect(pool).toHaveLength(4);
  });

  it("returns fewer than count when the lessons don't have enough between them", () => {
    const byLesson = { l1: makeExercises("l1", ["pickImage", "pickAudio"]) };
    const pool = buildPool(byLesson, ["l1"], 15);
    expect(pool).toHaveLength(2);
  });

  it("never runs the same exercise type 3 times in a row", () => {
    const byLesson = {
      l1: makeExercises("l1", ["pickImage", "pickImage", "pickImage", "pickImage", "pickAudio", "pickTranslation"]),
    };
    const pool = buildPool(byLesson, ["l1"], 6);

    let streak = 1;
    for (let i = 1; i < pool.length; i += 1) {
      streak = pool[i].type === pool[i - 1].type ? streak + 1 : 1;
      expect(streak).toBeLessThanOrEqual(2);
    }
  });

  it("ignores lessonIds with no matching entry in the map", () => {
    const byLesson = { l1: makeExercises("l1", ["pickImage"]) };
    const pool = buildPool(byLesson, ["l1", "does-not-exist"], 5);
    expect(pool).toHaveLength(1);
  });
});

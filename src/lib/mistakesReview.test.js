import { describe, expect, it } from "vitest";
import { getLevelById } from "../data/levels.js";
import { defaultProgress } from "./progress.js";
import { buildMistakesReviewLevel, completeMistakesReview } from "./mistakesReview.js";

describe("buildMistakesReviewLevel", () => {
  it("returns null when there is nothing to review", () => {
    expect(buildMistakesReviewLevel(defaultProgress)).toBeNull();
  });

  it("collects the actual question objects for every mistake id", () => {
    const level1 = getLevelById(1);
    const withMistakes = { ...defaultProgress, mistakes: [level1.questions[0].id, level1.questions[1].id] };
    const review = buildMistakesReviewLevel(withMistakes);

    expect(review.questions).toHaveLength(2);
    expect(review.questions.map((question) => question.id)).toEqual(withMistakes.mistakes);
  });

  it("skips a mistake id that no longer resolves to a question", () => {
    const withMistakes = { ...defaultProgress, mistakes: ["not-a-real-id"] };
    expect(buildMistakesReviewLevel(withMistakes)).toBeNull();
  });
});

describe("completeMistakesReview", () => {
  it("removes questions answered correctly this run", () => {
    const level1 = getLevelById(1);
    const [q1, q2] = level1.questions;
    const withMistakes = { ...defaultProgress, mistakes: [q1.id, q2.id] };
    const level = buildMistakesReviewLevel(withMistakes);

    const next = completeMistakesReview(withMistakes, level, { wrongMissionIds: [], attemptedCount: 2 });
    expect(next.mistakes).toEqual([]);
  });

  it("keeps a question that was wrong again", () => {
    const level1 = getLevelById(1);
    const [q1, q2] = level1.questions;
    const withMistakes = { ...defaultProgress, mistakes: [q1.id, q2.id] };
    const level = buildMistakesReviewLevel(withMistakes);

    const next = completeMistakesReview(withMistakes, level, { wrongMissionIds: [q1.id], attemptedCount: 2 });
    expect(next.mistakes).toEqual([q1.id]);
  });

  it("leaves un-attempted mistakes untouched when the run ends early", () => {
    const level1 = getLevelById(1);
    const [q1, q2] = level1.questions;
    const withMistakes = { ...defaultProgress, mistakes: [q1.id, q2.id] };
    const level = buildMistakesReviewLevel(withMistakes);

    const next = completeMistakesReview(withMistakes, level, { wrongMissionIds: [], attemptedCount: 1 });
    expect(next.mistakes).toEqual([q2.id]);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultProgress, loadProgress, saveProgress } from "./storage";

const STORAGE_KEY = "dujeen-quest-progress";

describe("progress settings migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("includes the new settings in fresh progress", () => {
    expect(defaultProgress).toEqual(expect.objectContaining({
      soundEnabled: true,
      reducedMotion: false,
      skipMissionIntro: false,
    }));
  });

  it("adds settings defaults while preserving an old save", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedLevels: [1, 2],
      completedLevels: [1],
      levelStars: { 1: 2 },
      xp: 145,
      soundEnabled: false,
    }));

    expect(loadProgress()).toEqual(expect.objectContaining({
      unlockedLevels: [1, 2],
      completedLevels: [1],
      levelStars: { 1: 2 },
      totalStars: 2,
      xp: 145,
      level: 2,
      soundEnabled: false,
      reducedMotion: false,
      skipMissionIntro: false,
    }));
  });

  it("preserves explicitly saved settings", () => {
    const saved = saveProgress({
      ...defaultProgress,
      reducedMotion: true,
      skipMissionIntro: true,
    });

    expect(saved.reducedMotion).toBe(true);
    expect(saved.skipMissionIntro).toBe(true);
    expect(loadProgress()).toEqual(expect.objectContaining({
      reducedMotion: true,
      skipMissionIntro: true,
    }));
  });
});

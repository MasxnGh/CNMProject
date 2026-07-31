import { beforeEach, describe, expect, it } from "vitest";
import {
  claimDailyReward,
  dailyRewardCoins,
  defaultProgress,
  isDailyRewardClaimed,
  loadProgress,
  saveProgress,
  touchStreak,
} from "./progress.js";

describe("touchStreak", () => {
  it("starts a streak at 1 the first time a player shows up", () => {
    const next = touchStreak(defaultProgress, "2026-07-29");
    expect(next.streak).toEqual({ count: 1, lastDate: "2026-07-29" });
  });

  it("does not change anything if the player already showed up today", () => {
    const today = { ...defaultProgress, streak: { count: 3, lastDate: "2026-07-29" } };
    expect(touchStreak(today, "2026-07-29")).toBe(today);
  });

  it("continues the streak for the very next calendar day", () => {
    const yesterday = { ...defaultProgress, streak: { count: 3, lastDate: "2026-07-28" } };
    expect(touchStreak(yesterday, "2026-07-29").streak).toEqual({ count: 4, lastDate: "2026-07-29" });
  });

  it("resets the streak to 1 if a day was missed", () => {
    const twoDaysAgo = { ...defaultProgress, streak: { count: 5, lastDate: "2026-07-27" } };
    expect(touchStreak(twoDaysAgo, "2026-07-29").streak).toEqual({ count: 1, lastDate: "2026-07-29" });
  });
});

describe("daily reward", () => {
  it("scales with streak length and caps out", () => {
    expect(dailyRewardCoins(1)).toBe(10);
    expect(dailyRewardCoins(2)).toBe(15);
    expect(dailyRewardCoins(100)).toBe(60);
  });

  it("claims once per day and adds coins", () => {
    const progress = { ...defaultProgress, coins: 5, streak: { count: 2, lastDate: "2026-07-29" } };
    const result = claimDailyReward(progress, "2026-07-29");

    expect(result.amount).toBe(15);
    expect(result.progress.coins).toBe(20);
    expect(result.progress.dailyRewardClaimedDate).toBe("2026-07-29");
    expect(isDailyRewardClaimed(result.progress, "2026-07-29")).toBe(true);
  });

  it("refuses a second claim the same day", () => {
    const claimed = { ...defaultProgress, dailyRewardClaimedDate: "2026-07-29" };
    expect(claimDailyReward(claimed, "2026-07-29")).toBeNull();
  });

  it("allows a new claim on the next day", () => {
    const claimedYesterday = { ...defaultProgress, dailyRewardClaimedDate: "2026-07-28" };
    expect(claimDailyReward(claimedYesterday, "2026-07-29")).not.toBeNull();
  });
});

describe("loadProgress / saveProgress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when nothing is saved yet", () => {
    expect(loadProgress()).toEqual(defaultProgress);
  });

  it("round-trips through localStorage", () => {
    const saved = saveProgress({ ...defaultProgress, coins: 42, completed: [1, 2] });
    expect(loadProgress()).toEqual(saved);
  });

  it("falls back to defaults for corrupted JSON instead of throwing", () => {
    window.localStorage.setItem("dujeen-quest-progress-v2", "{not json");
    expect(loadProgress()).toEqual(defaultProgress);
  });

  it("fills in missing fields when loading an older/partial save", () => {
    window.localStorage.setItem("dujeen-quest-progress-v2", JSON.stringify({ coins: 10 }));
    const loaded = loadProgress();
    expect(loaded.coins).toBe(10);
    expect(loaded.unlocked).toEqual([2]);
    expect(loaded.mistakes).toEqual([]);
  });
});

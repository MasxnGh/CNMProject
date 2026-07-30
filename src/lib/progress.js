const STORAGE_KEY = "dujeen-quest-progress-v2";

/* A separate localStorage key from the legacy `dujeen-quest-progress` used
   by the existing App/gameLogic/storage.js stack (still mounted at
   /classic) - the two progress systems must not read or write each other's
   data while both exist side by side during the phased rollout. */
export const defaultProgress = {
  version: 1,
  completed: [],
  unlocked: [1],
  coins: 0,
  xp: 0,
  level: 1,
  badges: [],
  levelStars: {},
  totalStars: 0,
  streak: { count: 0, lastDate: null },
  unlockTestUsed: {},
  clearedCheckpoints: [],
  mistakes: [],
  dailyRewardClaimedDate: null,
  soundEnabled: true,
  reducedMotion: false,
  skipMissionIntro: false,
};

/** Local calendar date as "YYYY-MM-DD", not UTC - streaks/daily rewards run on the player's day. */
export const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const daysBetween = (fromKey, toKey) => {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to - from) / 86400000);
};

/** Continues, resets, or starts the streak depending on how long it's been since the player last showed up. */
export const touchStreak = (progress, today = todayKey()) => {
  const lastDate = progress.streak?.lastDate ?? null;
  if (lastDate === today) return progress;

  const gap = lastDate ? daysBetween(lastDate, today) : null;
  const count = gap === 1 ? (progress.streak?.count ?? 0) + 1 : 1;

  return { ...progress, streak: { count, lastDate: today } };
};

export const dailyRewardCoins = (streakCount) => Math.min(10 + 5 * Math.max(0, streakCount - 1), 60);

export const isDailyRewardClaimed = (progress, today = todayKey()) => progress.dailyRewardClaimedDate === today;

/** Returns null if already claimed today, otherwise the updated progress plus the amount awarded. */
export const claimDailyReward = (progress, today = todayKey()) => {
  if (isDailyRewardClaimed(progress, today)) return null;
  const amount = dailyRewardCoins(progress.streak?.count ?? 1);
  return {
    progress: { ...progress, coins: progress.coins + amount, dailyRewardClaimedDate: today },
    amount,
  };
};

const migrate = (raw) => {
  if (!raw || typeof raw !== "object") return { ...defaultProgress };
  // Only one shape exists so far (version 1) - unknown/future versions fall back
  // to defaults merged with whatever fields still make sense, rather than
  // discarding the save outright.
  return {
    ...defaultProgress,
    ...raw,
    version: 1,
    streak: { ...defaultProgress.streak, ...raw.streak },
    unlockTestUsed: raw.unlockTestUsed ?? {},
    clearedCheckpoints: raw.clearedCheckpoints ?? [],
  };
};

export const loadProgress = () => {
  if (typeof window === "undefined") return { ...defaultProgress };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };
    return migrate(JSON.parse(raw));
  } catch {
    return { ...defaultProgress };
  }
};

export const saveProgress = (progress) => {
  if (typeof window === "undefined") return progress;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage unavailable (private mode, quota) - state still works in-memory for the session
  }
  return progress;
};

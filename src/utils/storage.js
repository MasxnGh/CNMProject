const STORAGE_KEY = "dujeen-quest-progress";

export const defaultProgress = {
  unlockedLevels: [1],
  completedLevels: [],
  levelStars: {},
  totalStars: 0,
  xp: 0,
  level: 1,
  coins: 0,
  badges: [],
  clearedCheckpoints: [],
  unlockedKnowledge: [],
  lastPlayedLevel: 1,
  soundEnabled: true,
  reducedMotion: false,
  skipMissionIntro: false,
};

export const calculatePlayerLevel = (xp) => Math.max(1, Math.floor(xp / 120) + 1);

const normalizeLevelStars = (progress) => {
  const fromSaved = progress.levelStars && typeof progress.levelStars === "object" ? progress.levelStars : null;
  if (fromSaved) {
    return Object.fromEntries(
      Object.entries(fromSaved)
        .map(([levelId, stars]) => [String(levelId), Math.max(0, Math.min(3, Number(stars) || 0))])
        .filter(([, stars]) => stars > 0),
    );
  }

  return Object.fromEntries((progress.completedLevels ?? []).map((levelId) => [String(levelId), 1]));
};

const sumStars = (levelStars) => Object.values(levelStars).reduce((total, stars) => total + (Number(stars) || 0), 0);

const normalizeProgress = (progress) => {
  const levelStars = normalizeLevelStars(progress);
  const completedLevels = [...new Set([...(progress.completedLevels ?? []), ...Object.keys(levelStars).map(Number)])].sort((a, b) => a - b);
  return {
    ...defaultProgress,
    ...progress,
    unlockedLevels: progress.unlockedLevels?.length ? [...new Set(progress.unlockedLevels)].sort((a, b) => a - b) : [1],
    completedLevels,
    levelStars,
    totalStars: sumStars(levelStars),
    badges: progress.badges ?? [],
    clearedCheckpoints: progress.clearedCheckpoints ?? [],
    unlockedKnowledge: progress.unlockedKnowledge ?? [],
    soundEnabled: progress.soundEnabled ?? true,
    reducedMotion: progress.reducedMotion ?? false,
    skipMissionIntro: progress.skipMissionIntro ?? false,
    level: calculatePlayerLevel(progress.xp ?? 0),
  };
};

export const loadProgress = () => {
  if (typeof window === "undefined") {
    return defaultProgress;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultProgress;
    const parsed = JSON.parse(saved);
    return normalizeProgress(parsed);
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (progress) => {
  if (typeof window === "undefined") return progress;
  const normalized = normalizeProgress(progress);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const resetProgress = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return defaultProgress;
};

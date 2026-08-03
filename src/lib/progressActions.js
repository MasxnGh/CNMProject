import chapters from "../content/chapters.json";

function pad(n) {
  return String(n).padStart(2, "0");
}

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yesterdayLocal() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bumpStreak(streak) {
  const today = todayLocal();
  if (streak.lastDate === today) return streak;
  const count = streak.lastDate === yesterdayLocal() ? streak.count + 1 : 1;
  return { count, lastDate: today };
}

function chapterForLesson(lessonId) {
  return chapters.find((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId));
}

function withChapterCompletion(chapterId, completedLessons, completedChapters) {
  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter || completedChapters.includes(chapterId)) return completedChapters;
  const allDone = chapter.lessons.every((lesson) => completedLessons.includes(lesson.id));
  return allDone ? [...completedChapters, chapterId] : completedChapters;
}

// Normal lesson finish: marks the lesson done, awards a stamp + coins the
// first time only (replays give neither), and rolls the chapter into
// completedChapters if that was the last lesson needed.
export function completeLesson(progress, lessonId, { coins = 10 } = {}) {
  const alreadyDone = progress.completedLessons.includes(lessonId);
  const completedLessons = alreadyDone ? progress.completedLessons : [...progress.completedLessons, lessonId];

  let stamps = progress.stamps;
  let coinsGained = 0;
  if (!alreadyDone) {
    stamps = [...stamps, { id: lessonId, kind: "lesson", lessonId, earnedAt: todayLocal() }];
    coinsGained = coins;
  }

  const chapter = chapterForLesson(lessonId);
  const completedChapters = chapter
    ? withChapterCompletion(chapter.id, completedLessons, progress.completedChapters)
    : progress.completedChapters;

  return {
    ...progress,
    completedLessons,
    completedChapters,
    coins: progress.coins + coinsGained,
    stamps,
    streak: bumpStreak(progress.streak),
  };
}

// Unlock-test pass: marks all skipped lessons done at once, awards ONE
// special badge (not a per-lesson stamp - you tested out, you didn't play
// them) plus a coin bonus.
export function completeUnlockTest(progress, chapterId, lessonIds, { bonusCoins = 50 } = {}) {
  const completedLessons = Array.from(new Set([...progress.completedLessons, ...lessonIds]));
  const completedChapters = withChapterCompletion(chapterId, completedLessons, progress.completedChapters);
  const badge = {
    id: `unlock_${chapterId}_${Date.now()}`,
    kind: "unlock",
    chapterId,
    earnedAt: todayLocal(),
  };

  return {
    ...progress,
    completedLessons,
    completedChapters,
    coins: progress.coins + bonusCoins,
    stamps: [...progress.stamps, badge],
    streak: bumpStreak(progress.streak),
  };
}

export function recordUnlockTestUsed(progress, chapterId) {
  return { ...progress, unlockTestUsed: { ...progress.unlockTestUsed, [chapterId]: todayLocal() } };
}

export function spendCoins(progress, amount) {
  if (progress.coins < amount) return progress;
  return { ...progress, coins: progress.coins - amount };
}

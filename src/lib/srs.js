// Simplified SM-2 spaced repetition. The player never rates themselves -
// `result` is derived from how they actually answered (see Lesson/Review
// wiring): 'good' (correct, no hesitation), 'hard' (correct but slow or
// replayed audio a lot), 'again' (wrong).

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MAX_INTERVAL = 180;
const DEFAULT_EASE = 2.5;

function pad(n) {
  return String(n).padStart(2, "0");
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createEntry({ ease = DEFAULT_EASE, interval = 0, due = todayISO(), reps = 0, lapses = 0 } = {}) {
  return { ease, interval, due, reps, lapses, lastSeen: todayISO() };
}

// entry may be undefined/null for a word seen for the first time - it's
// treated as starting from the ease 2.5 / interval 0 baseline before the
// result of this first answer is applied.
export function review(entry, result) {
  const base = entry || createEntry();
  const today = todayISO();

  if (result === "again") {
    return {
      ease: Math.max(MIN_EASE, base.ease - 0.2),
      interval: 0,
      reps: 0,
      lapses: base.lapses + 1,
      due: today,
      lastSeen: today,
    };
  }

  if (result === "hard") {
    const interval = Math.min(MAX_INTERVAL, base.reps === 0 ? 1 : Math.round(base.interval * 1.2));
    return {
      ease: Math.max(MIN_EASE, base.ease - 0.15),
      interval,
      reps: base.reps + 1,
      lapses: base.lapses,
      due: addDays(today, interval),
      lastSeen: today,
    };
  }

  // good
  const reps = base.reps + 1;
  let interval;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.round(base.interval * base.ease);
  interval = Math.min(MAX_INTERVAL, interval);

  return {
    ease: Math.min(MAX_EASE, base.ease + 0.1),
    interval,
    reps,
    lapses: base.lapses,
    due: addDays(today, interval),
    lastSeen: today,
  };
}

// Pure helper for callers that hold a whole `progress` object: applies the
// same result to every id in `ids` (a sentence exercise updates every token).
export function applyReview(progress, ids, result) {
  const srs = { ...progress.srs };
  ids.forEach((id) => {
    srs[id] = review(srs[id], result);
  });
  return { ...progress, srs };
}

export function getDueCards(progress, limit = 20) {
  const today = todayISO();
  const due = Object.entries(progress.srs || {})
    .filter(([, entry]) => entry.due <= today)
    .map(([id, entry]) => ({ id, ...entry }));

  due.sort((a, b) => {
    if (b.lapses !== a.lapses) return b.lapses - a.lapses;
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    return 0;
  });

  return due.slice(0, limit);
}

export function getDueCount(progress) {
  const today = todayISO();
  return Object.values(progress.srs || {}).filter((entry) => entry.due <= today).length;
}

// Cards not due yet, soonest-due first - used for the "review ahead" flow
// when nothing is due today.
export function getUpcomingCards(progress, limit = 10) {
  const today = todayISO();
  const upcoming = Object.entries(progress.srs || {})
    .filter(([, entry]) => entry.due > today)
    .map(([id, entry]) => ({ id, ...entry }));

  upcoming.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  return upcoming.slice(0, limit);
}

export function getNextDueDate(progress) {
  return getUpcomingCards(progress, 1)[0]?.due || null;
}

// Buckets every known word into a coarse memory strength for the profile
// page: fresh (<7d interval), settling in (7-30d), or solid (>30d).
export function getMemoryStats(progress) {
  const entries = Object.values(progress.srs || {});
  const stats = { total: entries.length, learning: 0, familiar: 0, mastered: 0 };

  entries.forEach((entry) => {
    if (entry.interval < 7) stats.learning += 1;
    else if (entry.interval <= 30) stats.familiar += 1;
    else stats.mastered += 1;
  });

  return stats;
}

// How many words come due on each of the next `days` calendar days.
// Anything already overdue is folded into "today" (index 0), since that's
// when it'll actually be reviewed.
export function getForecast(progress, days = 7) {
  const today = todayISO();
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i));
  const counts = dates.map(() => 0);

  Object.values(progress.srs || {}).forEach((entry) => {
    if (entry.due <= today) {
      counts[0] += 1;
      return;
    }
    const index = dates.indexOf(entry.due);
    if (index > 0) counts[index] += 1;
  });

  return dates.map((date, index) => ({ date, count: counts[index] }));
}

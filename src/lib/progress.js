import { createContext, createElement, useContext, useEffect, useState } from "react";
import vocabData from "../content/vocab.json";
import sentenceData from "../content/sentences.json";
import { todayISO, addDays } from "./srs.js";

const STORAGE_KEY = "dujeen_progress";
const VERSION = 2;

export function defaultProgress() {
  return {
    v: VERSION,
    completedLessons: [],
    completedChapters: [],
    unlockedLessons: [],
    coins: 0,
    stamps: [],
    streak: { count: 0, lastDate: "" },
    unlockTestUsed: {},
    mistakes: [],
    srs: {},
    // Last exercise type used per word during a review session, so the next
    // review session can avoid repeating it. Keyed separately from srs
    // because srs.review() rebuilds its entry from scratch each time and
    // would otherwise drop this.
    reviewLastType: {},
    // Counters behind the write_character badges - see src/lib/writeProgress.js.
    writeStats: { totalCompletions: 0, perfectStreak: 0, noGuideCompletions: 0 },
    // Saved drawings (SVG paths, not scores) for the copybook page in
    // Profile - capped at 60 entries, see recordWriteCompletion.
    copybook: [],
  };
}

// v1 had no srs field at all. Backfill it from what we can already infer:
// words the player got wrong start due today (they need it), words from
// lessons they'd already finished cleanly start a few days out.
function buildSrsFromV1(raw) {
  const today = todayISO();
  const mistakeIds = new Set(raw.mistakes || []);
  const completedLessons = new Set(raw.completedLessons || []);
  const srs = {};

  mistakeIds.forEach((id) => {
    srs[id] = { ease: 2.3, interval: 0, due: today, reps: 0, lapses: 1, lastSeen: today };
  });

  [...vocabData, ...sentenceData]
    .filter((entry) => completedLessons.has(entry.lessonId) && !mistakeIds.has(entry.id))
    .forEach((entry) => {
      srs[entry.id] = { ease: 2.5, interval: 3, due: addDays(today, 3), reps: 2, lapses: 0, lastSeen: today };
    });

  return srs;
}

// Any stored shape that isn't v1 or v2 gets folded onto a fresh default
// object instead of crashing - this is the seam future version bumps hang
// their actual field-by-field migration off of.
function migrate(raw) {
  if (!raw || typeof raw !== "object") return defaultProgress();
  if (raw.v !== 1 && raw.v !== 2) return defaultProgress();

  if (raw.v === 2) return { ...defaultProgress(), ...raw, srs: { ...raw.srs } };

  // v === 1: keep every existing field (including mistakes, untouched, in
  // case this needs to be rolled back) and layer srs on top.
  return { ...defaultProgress(), ...raw, v: VERSION, srs: buildSrsFromV1(raw) };
}

function readInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultProgress();
  }
}

const ProgressContext = createContext(null);

// Plain .js (no JSX) so this stays out of the project's .jsx-only-for-markup
// convention - createElement stands in for the <Provider> tag.
export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(readInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // localStorage unavailable (private mode, quota) - progress just won't persist.
    }
  }, [progress]);

  return createElement(ProgressContext.Provider, { value: [progress, setProgress] }, children);
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}

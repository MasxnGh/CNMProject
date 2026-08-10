import { createContext, useContext, useState } from "react";

const RunContext = createContext(null);

/**
 * The active kite-rise run (risk/endless/perfect/zen). Lives above the router
 * so risk mode's /play <-> /modifier round trip doesn't lose progress — Setup
 * starts a run, Play reads/updates it, Modifier applies a card and bounces
 * back. Maze mode doesn't use this at all; it keeps its own local state.
 */
export function RunProvider({ children }) {
  const [run, setRun] = useState(null);

  function startRun(diff) {
    setRun({
      round: 1,
      qIn: 0,
      score: 0,
      combo: 0,
      best: 0,
      ok: 0,
      tot: 0,
      miss: 0,
      mult: diff.multiplier,
      mods: [],
      up: 1,
      shield: 0,
      leveledWordIds: [],
    });
  }

  function patchRun(patch) {
    setRun((r) => (r ? { ...r, ...patch } : r));
  }

  /** Tracks which words were answered correctly this run, for the result screen's word list. */
  function addLeveledWord(wordId) {
    setRun((r) => (r && !r.leveledWordIds.includes(wordId) ? { ...r, leveledWordIds: [...r.leveledWordIds, wordId] } : r));
  }

  /** Applied when a modifier card is picked between risk-mode rounds. */
  function applyModifier(modifierId, multiplier) {
    setRun((r) => {
      if (!r) return r;
      return {
        ...r,
        mods: [...r.mods, modifierId],
        mult: Math.round(r.mult * multiplier * 100) / 100,
        round: r.round + 1,
        qIn: 0,
      };
    });
  }

  function endRun() {
    setRun(null);
  }

  return (
    <RunContext.Provider value={{ run, startRun, patchRun, applyModifier, addLeveledWord, endRun }}>
      {children}
    </RunContext.Provider>
  );
}

export function useRun() {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error("useRun must be used within RunProvider");
  return ctx;
}

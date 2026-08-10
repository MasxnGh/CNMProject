import { createContext, useContext, useState } from "react";

const GameContext = createContext(null);

const DEFAULT_SELECTION = { diffId: "mid", catIds: ["greet"], modeId: "risk" };

export function GameProvider({ children }) {
  const [player, setPlayerState] = useState({ name: "", avatar: "fox" });
  const [selection, setSelection] = useState(DEFAULT_SELECTION);
  // wordId -> mastery level 0-5. Lives here (not per-run) so words missed in an
  // earlier run keep surfacing more often in later ones, for the life of the tab.
  const [mastery, setMastery] = useState({});

  function setPlayer(name, avatar) {
    setPlayerState({ name, avatar });
  }

  function setDiff(diffId) {
    setSelection((s) => ({ ...s, diffId }));
  }

  function toggleCategory(catId) {
    setSelection((s) => {
      const has = s.catIds.includes(catId);
      if (has) {
        if (s.catIds.length <= 1) return s; // always keep at least one selected
        return { ...s, catIds: s.catIds.filter((id) => id !== catId) };
      }
      return { ...s, catIds: [...s.catIds, catId] };
    });
  }

  function setMode(modeId) {
    setSelection((s) => ({ ...s, modeId }));
  }

  /** Call after a correct answer only — wrong answers never lower mastery. */
  function recordCorrect(wordId, isHardDifficulty) {
    setMastery((m) => {
      const level = m[wordId] || 0;
      if (level >= 5) return m;
      return { ...m, [wordId]: Math.min(5, level + (isHardDifficulty ? 2 : 1)) };
    });
  }

  const value = {
    player,
    setPlayer,
    selection,
    setDiff,
    toggleCategory,
    setMode,
    mastery,
    recordCorrect,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

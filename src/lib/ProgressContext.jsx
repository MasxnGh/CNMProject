import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadProgress, saveProgress, touchStreak } from "./progress.js";

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(() => loadProgress());

  // Runs once per mount (i.e. once per page load) - exactly the "did the
  // player show up today" check a streak needs, not on every render.
  useEffect(() => {
    setProgress((current) => {
      const next = touchStreak(current);
      if (next === current) return current;
      return saveProgress(next);
    });
  }, []);

  const updateProgress = (updater) => {
    setProgress((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return saveProgress(next);
    });
  };

  const value = useMemo(() => ({ progress, setProgress: updateProgress }), [progress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used within a ProgressProvider");
  return context;
}

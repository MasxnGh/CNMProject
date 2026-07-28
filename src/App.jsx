import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import GamePage from "./components/GamePage";
import HomePage from "./components/HomePage";
import LoadingScreen from "./components/LoadingScreen";
import MapPage from "./components/MapPage";
import Modal from "./components/Modal";
import ResultPage from "./components/ResultPage";
import SoundToggle from "./components/SoundToggle";
import StageSelectPage from "./components/StageSelectPage";
import { getLevelById } from "./data/levels";
import { completeLevel, getCurrentLevelId, isLevelUnlocked } from "./utils/gameLogic";
import { setAudioEnabled } from "./utils/speech";
import { defaultProgress, loadProgress, resetProgress, saveProgress } from "./utils/storage";

const SOUND_KEY = "dujeen-quest-sound";
const loadAchievementPage = () => import("./components/AchievementPage");
const loadKnowledgeLibrary = () => import("./components/KnowledgeLibrary");
const loadVictoryPage = () => import("./components/VictoryPage");
const AchievementPage = lazy(loadAchievementPage);
const KnowledgeLibrary = lazy(loadKnowledgeLibrary);
const VictoryPage = lazy(loadVictoryPage);

function SceneFallback() {
  return <div className="scene dq-scene v2-scene grid place-items-center" aria-live="polite">กำลังเปิดหน้าผจญภัย...</div>;
}

export default function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home");
  const [progress, setProgress] = useState(initialProgress);
  const [setId, setSetId] = useState(1);
  const [activeLevelId, setActiveLevelId] = useState(initialProgress.lastPlayedLevel ?? 1);
  const [result, setResult] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === "undefined") return true;
    const legacySound = window.localStorage.getItem(SOUND_KEY);
    if (legacySound) return legacySound !== "off";
    return initialProgress.soundEnabled ?? true;
  });

  const activeLevel = useMemo(() => getLevelById(activeLevelId) ?? getLevelById(1), [activeLevelId]);

  const updateProgress = useCallback((nextProgress) => {
    const saved = saveProgress(nextProgress);
    setProgress(saved);
    return saved;
  }, []);

  useEffect(() => {
    setAudioEnabled(soundOn);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
    }
  }, [soundOn]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.reducedMotion = progress.reducedMotion ? "true" : "false";
  }, [progress.reducedMotion]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [page]);

  const goHome = () => setPage("home");

  const startAdventure = () => {
    const current = getLevelById(getCurrentLevelId(progress));
    setSetId(current?.setId ?? 1);
    setPage("stages");
  };

  const openSet = (nextSetId) => {
    setSetId(nextSetId);
    setPage("map");
  };

  const playLevel = (levelId) => {
    if (!isLevelUnlocked(progress, levelId)) return;
    setActiveLevelId(levelId);
    updateProgress({ ...progress, lastPlayedLevel: levelId });
    setPage("game");
  };

  const finishLevel = (level, correctCount, meta = {}) => {
    const outcome = completeLevel(progress, level, {
      correct: correctCount,
      hintsUsed: meta.hintsUsed ?? 0,
      score: meta.score ?? 0,
      missionMetrics: meta.missionMetrics ?? {},
    });
    const saved = updateProgress(outcome.progress);
    setResult({
      ...outcome,
      level,
      correct: correctCount,
      total: level.questions.length,
      progress: saved,
    });
    setPage("result");
  };

  const nextLevel = () => {
    const next = getLevelById(activeLevelId + 1);
    if (!next) {
      setPage("victory");
      return;
    }
    setSetId(next.setId);
    playLevel(next.id);
  };

  const retryLevel = () => {
    setPage("game");
  };

  const confirmReset = () => {
    resetProgress();
    setProgress(defaultProgress);
    setSetId(1);
    setActiveLevelId(1);
    setResult(null);
    setResetOpen(false);
    setPage("home");
  };

  const toggleSound = () => {
    setSoundOn((current) => {
      const next = !current;
      setProgress((currentProgress) => saveProgress({ ...currentProgress, soundEnabled: next }));
      return next;
    });
  };

  const toggleReducedMotion = () => {
    setProgress((current) => saveProgress({ ...current, reducedMotion: !current.reducedMotion }));
  };

  const setSkipMissionIntro = (skipMissionIntro) => {
    setProgress((current) => saveProgress({ ...current, skipMissionIntro }));
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingScreen key="loading" onComplete={() => setLoading(false)} />
        ) : page === "home" ? (
          <HomePage
            key="home"
            progress={progress}
            onStart={startAdventure}
            onLibrary={() => setPage("library")}
            onBadges={() => setPage("badges")}
            onReset={() => setResetOpen(true)}
          />
        ) : page === "stages" ? (
          <StageSelectPage key="stages" progress={progress} onOpenSet={openSet} onHome={goHome} />
        ) : page === "map" ? (
          <MapPage key={`map-${setId}`} setId={setId} progress={progress} onBack={() => setPage("stages")} onPlayLevel={playLevel} />
        ) : page === "game" ? (
          <GamePage
            key={`game-${activeLevelId}`}
            level={activeLevel}
            progress={progress}
            onFinish={finishLevel}
            onMap={() => setPage("map")}
            soundOn={soundOn}
            reducedMotion={progress.reducedMotion}
            skipMissionIntro={progress.skipMissionIntro}
            onToggleSound={toggleSound}
            onToggleReducedMotion={toggleReducedMotion}
            onToggleSkipIntro={setSkipMissionIntro}
          />
        ) : page === "result" && result ? (
          <ResultPage
            key={`result-${result.level.id}-${result.correct}-${result.stars}`}
            result={result}
            progress={progress}
            onNext={nextLevel}
            onMap={() => setPage("map")}
            onRetry={retryLevel}
            onVictory={() => setPage("victory")}
          />
        ) : page === "library" ? (
          <Suspense fallback={<SceneFallback />}><KnowledgeLibrary key="library" progress={progress} onBack={goHome} /></Suspense>
        ) : page === "badges" ? (
          <Suspense fallback={<SceneFallback />}><AchievementPage key="badges" progress={progress} onBack={goHome} /></Suspense>
        ) : (
          <Suspense fallback={<SceneFallback />}><VictoryPage key="victory" progress={progress} onHome={goHome} onReset={() => setResetOpen(true)} /></Suspense>
        )}
      </AnimatePresence>
      {/* The game page has its own sound control in the mission console; the floating
          toggle would otherwise overlap answer buttons and matching cards. */}
      {!loading && page !== "game" ? <SoundToggle enabled={soundOn} onToggle={toggleSound} /> : null}
      <Modal
        open={resetOpen}
        title="ต้องการเริ่มผจญภัยใหม่หรือไม่?"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        onCancel={() => setResetOpen(false)}
        onConfirm={confirmReset}
      >
        ระบบจะล้างด่านที่ปลดล็อก ดาว XP เหรียญ Badge และคลังความรู้ในเครื่องนี้ แล้วกลับไปเริ่มที่ด่าน 1
      </Modal>
    </>
  );
}

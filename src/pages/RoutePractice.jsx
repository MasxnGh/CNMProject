import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Sky from "../components/ui/Sky.jsx";
import GamePage from "../components/GamePage.jsx";
import { buildMistakesReviewLevel, completeMistakesReview } from "../lib/mistakesReview.js";
import { toLegacyProgressView } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import { setAudioEnabled } from "../utils/speech.js";
import "../styles/lantern-game.css";

/** Reuses the same engine again - a review session is just a pseudo-level
    built from progress.mistakes, with no pass/fail reward (only the mistake
    list itself changes) so it goes straight back to the map on finish. */
export default function RoutePractice() {
  const navigate = useNavigate();
  const { progress, setProgress } = useProgress();
  const level = buildMistakesReviewLevel(progress);

  useEffect(() => {
    setAudioEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  if (!level) {
    return (
      <div className="lantern-app">
        <Sky />
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", gap: "16px", padding: "20px", textAlign: "center" }}>
          <p>ยังไม่มีข้อที่เคยตอบผิด เก่งมาก!</p>
          <Button onClick={() => navigate("/chapters")} style={{ maxWidth: "16rem" }}>
            กลับแผนที่
          </Button>
        </main>
      </div>
    );
  }

  const handleFinish = (finishedLevel, correctCount, meta = {}) => {
    const nextProgress = completeMistakesReview(progress, finishedLevel, {
      wrongMissionIds: meta.wrongMissionIds ?? [],
      attemptedCount: meta.attemptedCount ?? finishedLevel.questions.length,
    });
    setProgress(nextProgress);
    navigate("/chapters");
  };

  return (
    <div className="lantern-app">
      <GamePage
        level={level}
        progress={toLegacyProgressView(progress)}
        onFinish={handleFinish}
        onMap={() => navigate("/chapters")}
        soundOn={progress.soundEnabled}
        reducedMotion={progress.reducedMotion}
        skipMissionIntro={progress.skipMissionIntro}
        onToggleSound={() => setProgress((current) => ({ ...current, soundEnabled: !current.soundEnabled }))}
        onToggleReducedMotion={() => setProgress((current) => ({ ...current, reducedMotion: !current.reducedMotion }))}
        onToggleSkipIntro={(skipMissionIntro) => setProgress((current) => ({ ...current, skipMissionIntro }))}
      />
    </div>
  );
}

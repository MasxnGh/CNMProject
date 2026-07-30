import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GamePage from "../components/GamePage.jsx";
import { buildMistakesReviewLevel, completeMistakesReview } from "../lib/mistakesReview.js";
import { toLegacyProgressView } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import { setAudioEnabled } from "../utils/speech.js";

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
      <div className="scene dq-scene v2-scene grid place-items-center">
        <p>ยังไม่มีข้อที่เคยตอบผิด เก่งมาก!</p>
        <button type="button" className="rm-button primary" style={{ maxWidth: "16rem" }} onClick={() => navigate("/")}>
          กลับแผนที่
        </button>
      </div>
    );
  }

  const handleFinish = (finishedLevel, correctCount, meta = {}) => {
    const nextProgress = completeMistakesReview(progress, finishedLevel, {
      wrongMissionIds: meta.wrongMissionIds ?? [],
      attemptedCount: meta.attemptedCount ?? finishedLevel.questions.length,
    });
    setProgress(nextProgress);
    navigate("/");
  };

  return (
    <GamePage
      level={level}
      progress={toLegacyProgressView(progress)}
      onFinish={handleFinish}
      onMap={() => navigate("/")}
      soundOn={progress.soundEnabled}
      reducedMotion={progress.reducedMotion}
      skipMissionIntro={progress.skipMissionIntro}
      onToggleSound={() => setProgress((current) => ({ ...current, soundEnabled: !current.soundEnabled }))}
      onToggleReducedMotion={() => setProgress((current) => ({ ...current, reducedMotion: !current.reducedMotion }))}
      onToggleSkipIntro={(skipMissionIntro) => setProgress((current) => ({ ...current, skipMissionIntro }))}
    />
  );
}

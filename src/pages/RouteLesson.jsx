import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GamePage from "../components/GamePage.jsx";
import { getLevelById } from "../data/levels.js";
import { getChapterIdForNode } from "../lib/checkpointProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import { completeNode, toLegacyProgressView } from "../lib/nodeProgression.js";
import { setAudioEnabled } from "../utils/speech.js";
import "../styles/lantern-game.css";

/* GamePage/QuestionRenderer/evaluateMission are reused completely unchanged
   here - only the progress store and the unlock/reward layer underneath
   them are new (lib/nodeProgression.js). See that file's header for why. */
export default function RouteLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { progress, setProgress } = useProgress();
  const level = getLevelById(Number(lessonId));
  const chapterId = getChapterIdForNode(Number(lessonId));
  const mapPath = chapterId ? `/chapter/${chapterId}` : "/chapters";

  useEffect(() => {
    setAudioEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  if (!level) {
    return (
      <div className="scene dq-scene v2-scene grid place-items-center">
        <p>ไม่พบโหนดนี้</p>
      </div>
    );
  }

  const handleFinish = (finishedLevel, correctCount, meta = {}) => {
    const outcome = completeNode(progress, finishedLevel, {
      correct: correctCount,
      hintsUsed: meta.hintsUsed ?? 0,
      score: meta.score ?? 0,
      missionMetrics: meta.missionMetrics ?? {},
      wrongMissionIds: meta.wrongMissionIds ?? [],
      attemptedCount: meta.attemptedCount ?? finishedLevel.questions.length,
    });
    setProgress(outcome.progress);
    navigate(`/result/${finishedLevel.id}`, { state: { outcome } });
  };

  return (
    <div className="lantern-app">
      <GamePage
        level={level}
        progress={toLegacyProgressView(progress)}
        onFinish={handleFinish}
        onMap={() => navigate(mapPath)}
        soundOn={progress.soundEnabled}
        reducedMotion={progress.reducedMotion}
        skipMissionIntro
        variant="lantern"
        heartsEnabled={false}
        onToggleSound={() => setProgress((current) => ({ ...current, soundEnabled: !current.soundEnabled }))}
        onToggleReducedMotion={() => setProgress((current) => ({ ...current, reducedMotion: !current.reducedMotion }))}
      />
    </div>
  );
}

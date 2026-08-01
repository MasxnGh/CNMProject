import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GamePage from "../components/GamePage.jsx";
import { buildCheckpointLevel, completeCheckpoint, getChapterIdForNode } from "../lib/checkpointProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import { toLegacyProgressView } from "../lib/nodeProgression.js";
import { setAudioEnabled } from "../utils/speech.js";
import "../styles/lantern-game.css";

/* Same reused engine as RouteLesson (GamePage/QuestionRenderer/
   evaluateMission, unchanged) - only the level object is synthetic
   (buildCheckpointLevel pools questions from every node in the lesson) and
   the finish handler unlocks the whole lesson at once instead of one node. */
export default function RouteUnlock() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { progress, setProgress } = useProgress();
  const level = buildCheckpointLevel(lessonId);
  const chapterId = level ? getChapterIdForNode(level.coveredNodeIds[0]) : null;
  const mapPath = chapterId ? `/chapter/${chapterId}` : "/chapters";

  useEffect(() => {
    setAudioEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  if (!level) {
    return (
      <div className="scene dq-scene v2-scene grid place-items-center">
        <p>ไม่พบบทที่จะข้าม</p>
      </div>
    );
  }

  const handleFinish = (finishedLevel, correctCount, meta = {}) => {
    const outcome = completeCheckpoint(progress, finishedLevel, {
      correct: correctCount,
      hintsUsed: meta.hintsUsed ?? 0,
      score: meta.score ?? 0,
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
        isCheckpoint
        variant="lantern"
        onToggleSound={() => setProgress((current) => ({ ...current, soundEnabled: !current.soundEnabled }))}
        onToggleReducedMotion={() => setProgress((current) => ({ ...current, reducedMotion: !current.reducedMotion }))}
      />
    </div>
  );
}

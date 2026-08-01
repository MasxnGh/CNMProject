import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "../components/ResultPage.jsx";
import { getChapterIdForNode } from "../lib/checkpointProgression.js";
import { getChapterLanterns, getNextNodeId, isLastNodeInChapter, toLegacyProgressView } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import Result from "./Result.jsx";

/* dujeen-quest-gameplay-prompts.md Prompt 6 follow-up - regular lessons
   (completeNode's outcome, from RouteLesson's now-real Lesson.jsx engine)
   render through the real Result.jsx: stamp burst, counting coins, and the
   whole-chapter lantern relay on the last node. Checkpoint outcomes
   (completeCheckpoint, from RouteUnlock) still render through the legacy
   ResultPage - RouteUnlock hasn't been migrated off GamePage yet, so its
   outcome shape has no comboMax/elapsedMs for Result.jsx to show. */
export default function RouteResult() {
  const { progress } = useProgress();
  const navigate = useNavigate();
  const location = useLocation();
  const outcome = location.state?.outcome;

  // Reached without state - e.g. a cold deep-link or a page refresh, since
  // router state doesn't survive that. Send the player back rather than
  // rendering a result screen with nothing to show.
  if (!outcome) {
    return (
      <div className="scene dq-scene v2-scene grid place-items-center">
        <p>ไม่พบผลลัพธ์ กลับไปที่แผนที่แล้วเริ่มด่านใหม่ได้เลย</p>
      </div>
    );
  }

  if (outcome.level.isCheckpoint) {
    const anchorNodeId = outcome.level.coveredNodeIds[0];
    const chapterId = getChapterIdForNode(anchorNodeId);
    const mapPath = chapterId ? `/chapter/${chapterId}` : "/chapters";

    return (
      <ResultPage
        result={outcome}
        progress={toLegacyProgressView(progress)}
        onMap={() => navigate(mapPath)}
        onRetry={() => navigate(`/unlock/${outcome.level.lessonId}`)}
        onNext={() => navigate(mapPath)}
        onVictory={() => navigate("/chapters")}
        onPracticeWeakNode={() => outcome.worstNodeId != null && navigate(`/lesson/${outcome.worstNodeId}`)}
      />
    );
  }

  const nodeId = outcome.level.id;
  const chapterId = getChapterIdForNode(nodeId);
  const mapPath = chapterId ? `/chapter/${chapterId}` : "/chapters";
  const nextNodeId = getNextNodeId(nodeId);
  const chapterLanterns = isLastNodeInChapter(nodeId) ? getChapterLanterns(nodeId) : undefined;

  return (
    <Result
      correctCount={outcome.correct}
      total={outcome.total}
      comboMax={location.state?.comboMax ?? 0}
      elapsedMs={location.state?.elapsedMs ?? 0}
      coinsEarned={outcome.earned.coins}
      chapterLanterns={chapterLanterns}
      onBackToMap={() => navigate(mapPath)}
      onNextLesson={nextNodeId != null ? () => navigate(`/lesson/${nextNodeId}`) : undefined}
    />
  );
}

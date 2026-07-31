import { useLocation, useNavigate } from "react-router-dom";
import ResultPage from "../components/ResultPage.jsx";
import { getChapterIdForNode } from "../lib/checkpointProgression.js";
import { getNextNodeId, toLegacyProgressView } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";

export default function RouteResult() {
  const { progress } = useProgress();
  const navigate = useNavigate();
  const location = useLocation();
  const outcome = location.state?.outcome;

  // Reached without state - e.g. a cold deep-link or a page refresh, since
  // router state doesn't survive that. Send the player back rather than
  // rendering ResultPage with nothing to show.
  if (!outcome) {
    return (
      <div className="scene dq-scene v2-scene grid place-items-center">
        <p>ไม่พบผลลัพธ์ กลับไปที่แผนที่แล้วเริ่มด่านใหม่ได้เลย</p>
      </div>
    );
  }

  const nextNodeId = outcome.level.isCheckpoint ? null : getNextNodeId(outcome.level.id);
  const retryPath = outcome.level.isCheckpoint ? `/unlock/${outcome.level.lessonId}` : `/lesson/${outcome.level.id}`;
  const anchorNodeId = outcome.level.isCheckpoint ? outcome.level.coveredNodeIds[0] : outcome.level.id;
  const chapterId = getChapterIdForNode(anchorNodeId);
  const mapPath = chapterId ? `/chapter/${chapterId}` : "/";

  return (
    <ResultPage
      result={outcome}
      progress={toLegacyProgressView(progress)}
      onMap={() => navigate(mapPath)}
      onRetry={() => navigate(retryPath)}
      onNext={() => navigate(nextNodeId != null ? `/lesson/${nextNodeId}` : mapPath)}
      onVictory={() => navigate("/")}
      onPracticeWeakNode={() => outcome.worstNodeId != null && navigate(`/lesson/${outcome.worstNodeId}`)}
    />
  );
}

import { useState } from "react";
import Button from "../components/ui/Button.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import Sky from "../components/ui/Sky.jsx";
import Lesson from "./Lesson.jsx";
import "../styles/review.css";

/**
 * dujeen-quest-gameplay-prompts.md Prompt E #3 - the new engine's "ทวน"
 * (review) page. A review session is just a Lesson run over whatever's
 * currently in progress.mistakes, same idea as the old engine's
 * RoutePractice.jsx/mistakesReview.js - kept presentational (like
 * Result.jsx/UnlockModal.jsx) rather than reading a progress store
 * directly, since the new engine still has no resolved content model for
 * turning a mistake id into an exercise object (the gap disclosed since
 * Prompt B).
 *
 * exercises: already-resolved new-engine exercise objects for whatever ids
 *   are currently in progress.mistakes - empty/undefined shows the
 *   encouraging empty state instead of a blank lesson.
 * onResolved(correctIds): called once the review run finishes, so the
 *   caller can remove those ids from its own mistakes list.
 */
export default function Review({ exercises, onResolved, onBackToLearning }) {
  const [done, setDone] = useState(false);

  if (!exercises?.length || done) {
    return (
      <PageTransition className="lantern-app">
        <Sky />
        <main className="review-empty">
          <p className="review-empty-title">{done ? "ทวนจบแล้ว เก่งมาก!" : "ยังไม่มีข้อที่เคยตอบผิด เก่งมาก!"}</p>
          <p className="review-empty-sub">ไปฝึกคำศัพท์ใหม่ ๆ กันต่อเลย</p>
          <Button onClick={onBackToLearning}>กลับไปเรียนต่อ</Button>
        </main>
      </PageTransition>
    );
  }

  const handleComplete = (summary) => {
    onResolved?.(summary.correctIds);
    setDone(true);
  };

  return <Lesson exercises={exercises} onExit={onBackToLearning} onComplete={handleComplete} />;
}

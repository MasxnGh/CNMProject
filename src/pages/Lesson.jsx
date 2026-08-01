import { X } from "lucide-react";
import { useRef, useState } from "react";
import ComboBadge from "../components/game/ComboBadge.jsx";
import FeedbackBar from "../components/game/FeedbackBar.jsx";
import StampBurst from "../components/game/StampBurst.jsx";
import { exerciseComponents } from "../components/exercises/index.js";
import Button from "../components/ui/Button.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Sky from "../components/ui/Sky.jsx";
import "../styles/lesson.css";

const START_LIVES = 3;

/** Pulls the "correct answer" display info (hanzi/pinyin/thai/audioId) out
    of whichever exercise type just finished, generically enough for
    FeedbackBar to show regardless of type. */
const getAnswerInfo = (exercise) => {
  if (exercise.sentence) {
    const { sentence } = exercise;
    return { hanzi: sentence.hanzi, pinyin: sentence.pinyin, thai: sentence.th, audioId: sentence.id, isSentence: true };
  }
  const correct = exercise.options?.find((option) => option.id === exercise.correctId);
  if (!correct) return null;
  return { hanzi: correct.hanzi, pinyin: correct.pinyin, thai: correct.th, audioId: correct.id };
};

/**
 * dujeen-quest-gameplay-prompts.md Prompt B #1 - the shell around every
 * exercise type. New page, new engine (components/exercises,
 * components/game) - GamePage/QuestionRenderer and /classic are untouched.
 * Prompt E reuses this same shell for the unlock-test via `mode`, rather
 * than duplicating the whole exercise/feedback/combo flow a second time.
 *
 * exercises: array of exercise objects (see components/exercises/*.jsx for
 *   each type's shape) - give each one an `id` and, for unlockTest mode, a
 *   `lessonId` (so a fail can point at the weakest lesson)
 * mode: "lesson" (default) | "unlockTest" - unlockTest swaps the progress
 *   bar to gold, shows 3 life-lanterns instead of unlimited attempts, and
 *   ends immediately (as a fail) once all 3 are lost
 * onExit: called when the player confirms leaving early
 * onComplete: called once every exercise has been answered (or the test
 *   was failed) with { correctCount, total, comboMax, elapsedMs, correctIds,
 *   wrongIds, failed, weakLessonId }
 */
export default function Lesson({ exercises, onExit, onComplete, mode = "lesson" }) {
  const isUnlockTest = mode === "unlockTest";
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("playing");
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMax, setComboMax] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [stampKey, setStampKey] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);
  const startedAt = useRef(Date.now());
  const correctIdsRef = useRef([]);
  const wrongIdsRef = useRef([]);
  const wrongLessonCountsRef = useRef({});
  const failedRef = useRef(false);

  const exercise = exercises[index];
  const ExerciseComponent = exercise ? exerciseComponents[exercise.type] : null;

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      correctIdsRef.current.push(exercise.id);
      setCorrectCount((count) => count + 1);
      setCombo((count) => {
        const next = count + 1;
        setComboMax((max) => Math.max(max, next));
        return next;
      });
      setStampKey((key) => (key ?? 0) + 1);
    } else {
      wrongIdsRef.current.push(exercise.id);
      setCombo(0);
      if (isUnlockTest) {
        if (exercise.lessonId) {
          wrongLessonCountsRef.current[exercise.lessonId] = (wrongLessonCountsRef.current[exercise.lessonId] ?? 0) + 1;
        }
        setLives((count) => {
          const next = count - 1;
          if (next <= 0) failedRef.current = true;
          return next;
        });
      }
    }
    setFeedback({ variant: isCorrect ? "correct" : "wrong", answer: getAnswerInfo(exercise), tokens: exercise.tokens });
    setPhase("feedback");
  };

  const weakestLessonId = () => {
    const entries = Object.entries(wrongLessonCountsRef.current);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  };

  const complete = (nextSkippedCount) => {
    onComplete?.({
      correctCount,
      total: exercises.length - nextSkippedCount,
      comboMax,
      elapsedMs: Date.now() - startedAt.current,
      correctIds: correctIdsRef.current,
      wrongIds: wrongIdsRef.current,
      failed: failedRef.current,
      weakLessonId: failedRef.current ? weakestLessonId() : null,
    });
  };

  const finishOrAdvance = (nextIndex, nextSkippedCount) => {
    if (failedRef.current || nextIndex >= exercises.length) {
      complete(nextSkippedCount);
      return;
    }
    setIndex(nextIndex);
  };

  const continueToNext = () => {
    setFeedback(null);
    setPhase("playing");
    finishOrAdvance(index + 1, skippedCount);
  };

  /* Distinct from handleAnswer - doesn't touch correctCount/combo/total and
     skips FeedbackBar entirely (used for SpeakAloud's always-available "ข้าม
     ข้อนี้" and unsupported-browser fallback, not a graded answer). */
  const handleSkip = () => {
    const nextSkippedCount = skippedCount + 1;
    setSkippedCount(nextSkippedCount);
    finishOrAdvance(index + 1, nextSkippedCount);
  };

  const progressPercent = exercises.length ? (index / exercises.length) * 100 : 0;

  return (
    <PageTransition className="lantern-app">
      <Sky />
      <div className="lesson-shell">
        <div className="lesson-topbar">
          <button type="button" className="lesson-close" onClick={() => setExitOpen(true)} aria-label="ปิด">
            <X size={20} />
          </button>
          <div className="lesson-progress">
            <i className={isUnlockTest ? "is-gold" : ""} style={{ width: `${progressPercent}%` }} />
          </div>
          {isUnlockTest ? (
            <div className="lesson-lives" aria-label={`เหลือ ${lives} ชีวิต`}>
              {Array.from({ length: START_LIVES }, (_, i) => (
                <span key={i} className={`lesson-life-lantern ${i < lives ? "is-lit" : "is-lost"}`} />
              ))}
            </div>
          ) : null}
        </div>

        <main className="lesson-body">
          {phase === "playing" && ExerciseComponent ? (
            <ExerciseComponent key={index} exercise={exercise} onAnswer={handleAnswer} onSkip={handleSkip} />
          ) : null}

          {phase === "feedback" && feedback ? (
            <FeedbackBar
              key={index}
              variant={feedback.variant}
              answer={feedback.answer}
              tokens={feedback.tokens}
              onContinue={continueToNext}
              onReportError={() => window.alert("รายงานข้อผิดพลาดแล้ว")}
            />
          ) : null}

          <ComboBadge combo={combo} />
        </main>
      </div>

      <StampBurst trigger={stampKey} />

      <Sheet open={exitOpen} onClose={() => setExitOpen(false)}>
        <h3>ออกตอนนี้เลยหรือไม่?</h3>
        <p>ความคืบหน้าในด่านนี้จะหายไป</p>
        <Button variant="danger" onClick={onExit}>
          ออกตอนนี้
        </Button>
        <Button variant="ghost" onClick={() => setExitOpen(false)}>
          เล่นต่อ
        </Button>
      </Sheet>
    </PageTransition>
  );
}

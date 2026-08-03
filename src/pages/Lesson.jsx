import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import chapters from "../content/chapters.json";
import { buildPool } from "../lib/exercisePool.js";
import { useProgress } from "../lib/progress.js";
import { playCorrect, playWrong, playCombo } from "../lib/sfx.js";
import { hapticCorrect, hapticWrong } from "../lib/haptics.js";
import { getReplayCount, resetReplayCount } from "../lib/audio.js";
import { applyReview } from "../lib/srs.js";
import { recordWriteCompletion } from "../lib/writeProgress.js";
import { isSelfReporting } from "../lib/exerciseKind.js";
import { EXERCISE_COMPONENTS, CORRECTNESS } from "../components/exercises/QuestionRenderer.jsx";
import { isSpeechRecognitionSupported } from "../components/exercises/support.js";
import QuestionStage from "../components/exercises/QuestionStage.jsx";
import CheckButton from "../components/exercises/CheckButton.jsx";
import { resolveEntry, getEntryId, playEntry, isSentenceId, sentenceById } from "../components/exercises/content.js";
import "../components/exercises/exercises.css";
import FeedbackBar from "../components/game/FeedbackBar.jsx";
import ComboBadge from "../components/game/ComboBadge.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Button from "../components/ui/Button.jsx";
import "./Lesson.css";

const ALLOWED_TYPES = new Set(
  Object.keys(EXERCISE_COMPONENTS).filter((type) => type !== "speak_aloud" || isSpeechRecognitionSupported()),
);

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [, setProgress] = useProgress();
  const chapter = chapters.find((c) => c.lessons.some((l) => l.id === lessonId));

  const exercises = useMemo(
    () => buildPool([lessonId], null, { allowedTypes: ALLOWED_TYPES }),
    [lessonId],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState(null); // null | true | false
  const [comboCount, setComboCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const correctCountRef = useRef(0);
  const maxComboRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    questionStartRef.current = Date.now();
    resetReplayCount();
  }, [index]);

  const currentExercise = exercises[index];

  if (!currentExercise) {
    return (
      <div className="wrap">
        <div className="emptyState">
          <div className="emptyStateIcon">🏮</div>
          <h1>ด่านนี้ยังไม่มีโจทย์</h1>
          <p>เนื้อหาด่านนี้กำลังจัดเตรียมอยู่ ลองเลือกด่านอื่นในบทนี้ไปก่อนได้เลย</p>
          <Button variant="primary" onClick={() => navigate(chapter ? `/chapter/${chapter.id}` : "/chapters")}>
            กลับแผนที่บท
          </Button>
        </div>
      </div>
    );
  }

  const targetEntry = resolveEntry(getEntryId(currentExercise));
  const progressPercent = index / exercises.length;

  const handlePick = (id) => {
    if (checked) return;
    setSelected(id);
  };

  // Shared tail for both exercise families: select-then-check (handleCheck)
  // computes isCorrect/quality itself, then hands off here; self-reporting
  // exercises (handleSelfReport) already know both and just pass them through.
  const applyOutcome = (isCorrect, quality) => {
    setChecked(true);
    setResult(isCorrect);

    const entryId = getEntryId(currentExercise);
    const srsIds = isSentenceId(entryId) ? sentenceById.get(entryId).tokens : [entryId];
    setProgress((current) => applyReview(current, srsIds, quality));

    if (isCorrect) {
      correctCountRef.current += 1;
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
      playCorrect();
      hapticCorrect();
      if (nextCombo >= 3) playCombo(nextCombo);
    } else {
      setComboCount(0);
      playWrong();
      hapticWrong();
      setShake(true);
      setTimeout(() => setShake(false), 300);

      const mistakeId = getEntryId(currentExercise);
      setProgress((current) => (
        current.mistakes.includes(mistakeId)
          ? current
          : { ...current, mistakes: [...current.mistakes, mistakeId] }
      ));
    }
  };

  const handleCheck = () => {
    if (selected == null || checked) return;
    const isCorrect = CORRECTNESS[currentExercise.type](currentExercise, selected);
    const elapsedMs = Date.now() - questionStartRef.current;
    const replayCount = getReplayCount();
    const quality = !isCorrect ? "again" : elapsedMs > 12000 || replayCount > 2 ? "hard" : "good";
    applyOutcome(isCorrect, quality);
  };

  const handleSelfReport = (result) => {
    if (checked) return;
    applyOutcome(result.correct, result.quality);

    // write_character carries extra fields onResult (Lesson/Review/UnlockTest
    // don't need for scoring) that feed the copybook + write_* badges, which
    // are tracked independently of SRS.
    if (currentExercise.type === "write_character") {
      const entryId = getEntryId(currentExercise);
      setProgress((current) =>
        recordWriteCompletion(current, {
          correct: result.correct,
          guided: true,
          usedHint: result.usedHint,
          totalMistakes: result.totalMistakes,
          entryId,
          hanzi: resolveEntry(entryId)?.hanzi,
          drawnPaths: result.drawnPaths,
          canvasSize: result.canvasSize,
        }),
      );
    }
  };

  const handleNext = () => {
    if (index + 1 >= exercises.length) {
      navigate(`/result/${lessonId}`, {
        state: {
          mode: "lesson",
          lessonId,
          correctCount: correctCountRef.current,
          totalCount: exercises.length,
          maxCombo: maxComboRef.current,
          elapsedMs: Date.now() - startTimeRef.current,
        },
      });
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setChecked(false);
    setResult(null);
  };

  const handleSkip = () => {
    if (checked) return;
    handleNext();
  };

  const selfReporting = isSelfReporting(currentExercise.type);
  const checkButton =
    selfReporting || checked ? null : <CheckButton enabled={selected != null} onClick={handleCheck} />;

  return (
    <div className="wrap">
      <div className="top">
        <button type="button" className="back" onClick={() => setExitOpen(true)}>
          ✕
        </button>
        <div className="prog" style={{ flex: 1 }}>
          <i style={{ transform: `scaleX(${progressPercent})` }} />
        </div>
      </div>

      <div className={shake ? "shakeX" : ""}>
        <QuestionStage
          exercise={currentExercise}
          selected={selected}
          checked={checked}
          onPick={handlePick}
          onSkip={handleSkip}
          onResult={handleSelfReport}
          checkButton={checkButton}
        />
      </div>

      <ComboBadge count={comboCount} />

      <FeedbackBar
        visible={checked}
        correct={result}
        entry={targetEntry}
        onNext={handleNext}
        onReplay={() => playEntry(getEntryId(currentExercise))}
      />

      <Sheet
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="ออกจากด่านนี้?"
        description="ออกตอนนี้ความคืบหน้าในด่านนี้จะหายไป"
      >
        <Button variant="primary" onClick={() => navigate(-1)}>
          ออกจากด่าน
        </Button>
        <Button variant="ghost" onClick={() => setExitOpen(false)}>
          เล่นต่อ
        </Button>
      </Sheet>
    </div>
  );
}

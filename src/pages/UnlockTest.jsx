import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import chapters from "../content/chapters.json";
import { buildPool } from "../lib/exercisePool.js";
import { useProgress } from "../lib/progress.js";
import { recordWriteCompletion } from "../lib/writeProgress.js";
import { playCorrect, playWrong, playCombo } from "../lib/sfx.js";
import { hapticCorrect, hapticWrong } from "../lib/haptics.js";
import { playOnEnter, playOnCheck, manualReplay } from "../lib/audioPolicy.js";
import { isSelfReporting } from "../lib/exerciseKind.js";
import { EXERCISE_COMPONENTS, CORRECTNESS } from "../components/exercises/QuestionRenderer.jsx";
import QuestionStage from "../components/exercises/QuestionStage.jsx";
import CheckButton from "../components/exercises/CheckButton.jsx";
import { resolveEntry, getEntryId } from "../components/exercises/content.js";
import "../components/exercises/exercises.css";
import FeedbackBar from "../components/game/FeedbackBar.jsx";
import ComboBadge from "../components/game/ComboBadge.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Button from "../components/ui/Button.jsx";
import "./Lesson.css";
import "./UnlockTest.css";

const ALLOWED_TYPES = new Set(Object.keys(EXERCISE_COMPONENTS));
const TEST_SIZE = 15;
const MAX_LIVES = 3;

// Deep link without router state (direct URL/refresh): rebuild the group as
// this lesson plus the next two in its chapter.
function resolveLessonGroup(lessonId, stateLessonIds, stateChapterId) {
  if (stateLessonIds && stateLessonIds.length > 0) {
    return { chapterId: stateChapterId, lessonIds: stateLessonIds };
  }
  const chapter = chapters.find((c) => c.lessons.some((l) => l.id === lessonId));
  if (!chapter) return { chapterId: null, lessonIds: [lessonId] };
  const startIndex = chapter.lessons.findIndex((l) => l.id === lessonId);
  const lessonIds = chapter.lessons.slice(startIndex, startIndex + 3).map((l) => l.id);
  return { chapterId: chapter.id, lessonIds };
}

function LivesRow({ lives }) {
  return (
    <div className="livesRow">
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <div key={i} className={["miniLamp", i >= lives && "out"].filter(Boolean).join(" ")}>
          灯
        </div>
      ))}
    </div>
  );
}

export default function UnlockTest() {
  const { lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setProgress] = useProgress();

  const { chapterId, lessonIds } = useMemo(
    () => resolveLessonGroup(lessonId, location.state?.lessonIds, location.state?.chapterId),
    [lessonId, location.state],
  );

  const exercises = useMemo(
    () => buildPool(lessonIds, TEST_SIZE, { allowedTypes: ALLOWED_TYPES }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lessonIds.join(",")],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState(null);
  const [comboCount, setComboCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [exitOpen, setExitOpen] = useState(false);

  const correctCountRef = useRef(0);
  const wrongByLessonRef = useRef({});
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  const currentExercise = exercises[index];

  useEffect(() => {
    if (currentExercise) playOnEnter(currentExercise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise?.id]);

  if (!currentExercise) {
    const chapter = chapters.find((c) => c.id === chapterId);
    return (
      <div className="wrap">
        <div className="emptyState">
          <div className="emptyStateIcon">🔑</div>
          <h1>บททดสอบนี้ยังไม่มีโจทย์</h1>
          <p>ด่านที่จะข้ามยังไม่มีเนื้อหาพอสำหรับทำบททดสอบรวม ลองเล่นทีละด่านไปก่อนได้เลย</p>
          <Button variant="primary" onClick={() => navigate(chapter ? `/chapter/${chapter.id}` : "/chapters")}>
            กลับแผนที่บท
          </Button>
        </div>
      </div>
    );
  }

  const targetEntry = resolveEntry(getEntryId(currentExercise));
  const progressPercent = index / exercises.length;

  const finish = (passed) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    navigate(`/result/${lessonId}`, {
      state: {
        mode: passed ? "unlock-pass" : "unlock-fail",
        chapterId,
        lessonIds,
        correctCount: correctCountRef.current,
        totalCount: exercises.length,
        wrongByLesson: wrongByLessonRef.current,
        elapsedMs: Date.now() - startTimeRef.current,
      },
    });
  };

  const handlePick = (id) => {
    if (checked) return;
    setSelected(id);
  };

  // Shared tail for both exercise families - see Lesson.jsx for the same split.
  // UnlockTest doesn't touch SRS at all, so unlike Lesson/Review it only
  // needs `isCorrect`; `quality` is accepted for a uniform onResult shape
  // but simply unused here.
  const applyOutcome = (isCorrect) => {
    setChecked(true);
    setResult(isCorrect);
    playOnCheck(currentExercise);

    if (isCorrect) {
      correctCountRef.current += 1;
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      playCorrect();
      hapticCorrect();
      if (nextCombo >= 3) playCombo(nextCombo);
    } else {
      setComboCount(0);
      playWrong();
      hapticWrong();
      setShake(true);
      setTimeout(() => setShake(false), 300);

      const owningLesson = currentExercise.lessonId;
      wrongByLessonRef.current = {
        ...wrongByLessonRef.current,
        [owningLesson]: (wrongByLessonRef.current[owningLesson] || 0) + 1,
      };
      setLives((value) => Math.max(0, value - 1));
    }
  };

  const handleCheck = () => {
    if (selected == null || checked) return;
    const isCorrect = CORRECTNESS[currentExercise.type](currentExercise, selected);
    applyOutcome(isCorrect);
  };

  const handleSelfReport = (result) => {
    if (checked) return;
    applyOutcome(result.correct);

    if (currentExercise.type === "write_character") {
      const entryId = getEntryId(currentExercise);
      setProgress((current) =>
        recordWriteCompletion(current, {
          correct: result.correct,
          guided: true,
          usedHint: result.usedHint,
          totalMistakes: result.totalMistakes,
          entryId,
          hanzi: currentExercise.targetChar,
          drawnPaths: result.drawnPaths,
          canvasSize: result.canvasSize,
        }),
      );
    }
  };

  const handleNext = () => {
    if (lives <= 0) {
      finish(false);
      return;
    }
    if (index + 1 >= exercises.length) {
      finish(true);
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
        <div className="prog progGold" style={{ flex: 1 }}>
          <i style={{ transform: `scaleX(${progressPercent})` }} />
        </div>
      </div>

      <LivesRow lives={lives} />

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
        onReplay={() => manualReplay(getEntryId(currentExercise))}
        onReplaySlow={() => manualReplay(getEntryId(currentExercise), { slow: true })}
      />

      <Sheet
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="ออกจากบททดสอบนี้?"
        description="ออกตอนนี้ความคืบหน้าในบททดสอบจะหายไป"
      >
        <Button variant="primary" onClick={() => navigate(-1)}>
          ออกจากบททดสอบ
        </Button>
        <Button variant="ghost" onClick={() => setExitOpen(false)}>
          เล่นต่อ
        </Button>
      </Sheet>
    </div>
  );
}

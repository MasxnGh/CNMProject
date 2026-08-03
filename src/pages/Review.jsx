import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../lib/progress.js";
import { applyReview, getDueCount, getNextDueDate } from "../lib/srs.js";
import { recordWriteCompletion } from "../lib/writeProgress.js";
import { buildAdvanceQueue, buildDueQueue, pickExerciseForWord } from "../components/exercises/reviewSession.js";
import { playCorrect, playWrong, playCombo } from "../lib/sfx.js";
import { hapticCorrect, hapticWrong } from "../lib/haptics.js";
import { getReplayCount, resetReplayCount } from "../lib/audio.js";
import { isSelfReporting } from "../lib/exerciseKind.js";
import { CORRECTNESS } from "../components/exercises/QuestionRenderer.jsx";
import QuestionStage from "../components/exercises/QuestionStage.jsx";
import CheckButton from "../components/exercises/CheckButton.jsx";
import { resolveEntry, getEntryId, playEntry, isSentenceId, sentenceById } from "../components/exercises/content.js";
import "../components/exercises/exercises.css";
import FeedbackBar from "../components/game/FeedbackBar.jsx";
import ComboBadge from "../components/game/ComboBadge.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Button from "../components/ui/Button.jsx";
import "./Lesson.css";
import "./Review.css";

function lanternTier(dueCount) {
  if (dueCount === 0) return "full";
  if (dueCount <= 10) return "normal";
  if (dueCount <= 30) return "dim";
  return "dark";
}

function lanternCaption(dueCount) {
  if (dueCount === 0) return "โคมทุกดวงยังสว่างดี";
  if (dueCount <= 10) return "โคมยังสว่างดี ทวนตอนนี้เพื่อความจำที่แน่น";
  if (dueCount <= 30) return "โคมบางดวงเริ่มหรี่ ทวนก่อนที่จะลืม";
  return "โคมหลายดวงเริ่มมอดแล้ว";
}

function estimateMinutes(count) {
  if (count === 0) return 0;
  return Math.max(1, Math.round((count * 8) / 60));
}

function daysUntilLabel(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays <= 0) return "วันนี้";
  if (diffDays === 1) return "พรุ่งนี้";
  return `อีก ${diffDays} วัน`;
}

function ReviewLantern({ tier }) {
  return (
    <div className={`reviewLantern ${tier}`} aria-hidden="true">
      <div className="cap" />
      <div className="body" />
      <div className="zi">忆</div>
      <div className="base" />
      <div className="tassel" />
    </div>
  );
}

export default function Review() {
  const navigate = useNavigate();
  const [progress, setProgress] = useProgress();

  const [phase, setPhase] = useState("landing");
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState(null);
  const [comboCount, setComboCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [summary, setSummary] = useState(null);

  const questionStartRef = useRef(Date.now());
  const uniqueWordIdsRef = useRef(new Set());
  const forgottenIdsRef = useRef(new Set());

  useEffect(() => {
    if (phase !== "session") return;
    questionStartRef.current = Date.now();
    resetReplayCount();
  }, [phase, index]);

  const startSession = (built) => {
    if (built.length === 0) return;
    uniqueWordIdsRef.current = new Set(built.map((entry) => entry.wordId));
    forgottenIdsRef.current = new Set();
    setQueue(built);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setResult(null);
    setComboCount(0);
    setPhase("session");
  };

  const finishSession = () => {
    setSummary({
      reviewedCount: uniqueWordIdsRef.current.size,
      forgottenIds: [...forgottenIdsRef.current],
    });
    setPhase("summary");
  };

  const currentEntry = queue[index];

  const handlePick = (id) => {
    if (checked) return;
    setSelected(id);
  };

  // Shared tail for both exercise families - see Lesson.jsx for the same split.
  const applyOutcome = (isCorrect, quality) => {
    const { exercise, wordId } = currentEntry;
    setChecked(true);
    setResult(isCorrect);

    const exerciseEntryId = getEntryId(exercise);
    const srsIds = isSentenceId(exerciseEntryId) ? sentenceById.get(exerciseEntryId).tokens : [exerciseEntryId];

    setProgress((current) => ({
      ...applyReview(current, srsIds, quality),
      reviewLastType: { ...current.reviewLastType, [wordId]: exercise.type },
    }));

    if (isCorrect) {
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

      forgottenIdsRef.current.add(wordId);
      const retry = pickExerciseForWord(wordId, exercise.type);
      if (retry) setQueue((current) => [...current, { wordId, exercise: retry }]);
    }
  };

  const handleCheck = () => {
    if (selected == null || checked || !currentEntry) return;
    const isCorrect = CORRECTNESS[currentEntry.exercise.type](currentEntry.exercise, selected);
    const elapsedMs = Date.now() - questionStartRef.current;
    const replayCount = getReplayCount();
    const quality = !isCorrect ? "again" : elapsedMs > 12000 || replayCount > 2 ? "hard" : "good";
    applyOutcome(isCorrect, quality);
  };

  const handleSelfReport = (result) => {
    if (checked || !currentEntry) return;
    applyOutcome(result.correct, result.quality);

    if (currentEntry.exercise.type === "write_character") {
      const entryId = getEntryId(currentEntry.exercise);
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
    if (index + 1 >= queue.length) {
      finishSession();
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

  if (phase === "session") {
    if (!currentEntry) {
      return (
        <div className="wrap">
          <div className="emptyState">
            <div className="emptyStateIcon">🏮</div>
            <h1>ยังไม่มีโจทย์สำหรับคำเหล่านี้</h1>
            <p>คำที่ค้างทวนตอนนี้ยังไม่มีโจทย์รองรับ ลองเล่นด่านใหม่เพิ่มก่อนได้เลย</p>
            <Button variant="primary" onClick={() => setPhase("landing")}>
              กลับหน้าทวน
            </Button>
          </div>
        </div>
      );
    }

    const targetEntry = resolveEntry(getEntryId(currentEntry.exercise));
    const progressPercent = index / queue.length;
    const selfReporting = isSelfReporting(currentEntry.exercise.type);
    const checkButton =
      selfReporting || checked ? null : <CheckButton enabled={selected != null} onClick={handleCheck} />;

    return (
      <div className="wrap">
        <div className="top">
          <button type="button" className="back" onClick={() => setExitOpen(true)}>
            ✕
          </button>
          <div className="prog progJade" style={{ flex: 1 }}>
            <i style={{ transform: `scaleX(${progressPercent})` }} />
          </div>
        </div>

        <div className={shake ? "shakeX" : ""}>
          <QuestionStage
            exercise={currentEntry.exercise}
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
          onReplay={() => playEntry(getEntryId(currentEntry.exercise))}
        />

        <Sheet
          open={exitOpen}
          onClose={() => setExitOpen(false)}
          title="ออกจากการทวนนี้?"
          description="ออกตอนนี้ความคืบหน้าในเซสชันทวนนี้จะหายไป"
        >
          <Button variant="primary" onClick={() => setPhase("landing")}>
            ออกจากการทวน
          </Button>
          <Button variant="ghost" onClick={() => setExitOpen(false)}>
            ทวนต่อ
          </Button>
        </Sheet>
      </div>
    );
  }

  if (phase === "summary" && summary) {
    const rememberedCount = summary.reviewedCount - summary.forgottenIds.length;
    const perfect = summary.reviewedCount > 0 && summary.forgottenIds.length === 0;

    return (
      <div className="wrap">
        <div className="top">
          <div style={{ flex: 1 }}>
            <div className="h2">สรุปผลการทวน</div>
            <div className="h1">ทวนจบแล้ว!</div>
          </div>
        </div>

        <ReviewLantern tier={lanternTier(summary.forgottenIds.length)} />

        <div className="statRow">
          <div className="statCell">
            <b>{summary.reviewedCount}</b>
            <span>ทวนไปทั้งหมด</span>
          </div>
          <div className="statCell">
            <b>{rememberedCount}</b>
            <span>จำได้</span>
          </div>
          <div className="statCell">
            <b>{summary.forgottenIds.length}</b>
            <span>ลืม</span>
          </div>
        </div>

        {perfect && (
          <div className="reviewBadgeCard">
            <div className="reviewSeal">忆</div>
            <h3>ตราประทับ: ความจำดี</h3>
          </div>
        )}

        {summary.forgottenIds.length > 0 && (
          <div className="panel">
            <h5>คำที่ลืม</h5>
            <div className="forgottenList">
              {summary.forgottenIds.map((id) => {
                const entryData = resolveEntry(id);
                if (!entryData) return null;
                const due = progress.srs?.[id]?.due;
                return (
                  <div key={id} className="forgottenRow">
                    <button type="button" className="fxIcon" onClick={() => playEntry(id)} aria-label="ฟังเสียง">
                      🔊
                    </button>
                    <div className="forgottenText">
                      <b>{entryData.hanzi}</b> <i>{entryData.pinyin}</i>
                      <div className="forgottenTh">{entryData.th}</div>
                    </div>
                    <div className="forgottenDue">ทวนอีกที{due ? ` ${daysUntilLabel(due)}` : ""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="reviewActions">
          <Button variant="primary" onClick={() => setPhase("landing")}>
            เสร็จแล้ว
          </Button>
        </div>
      </div>
    );
  }

  // phase === "landing"
  const dueCount = getDueCount(progress);
  const nextDue = getNextDueDate(progress);

  if (dueCount === 0) {
    const advanceQueue = buildAdvanceQueue(progress, 10);
    return (
      <div className="wrap">
        <div className="top">
          <div style={{ flex: 1 }}>
            <div className="h2">ทวนคำศัพท์</div>
            <div className="h1">ทวนคำ</div>
          </div>
        </div>

        <ReviewLantern tier="full" />

        <div className="emptyState">
          <h1>{lanternCaption(0)}</h1>
          <p>
            เก่งมาก ยังไม่มีคำไหนถึงกำหนดทวนตอนนี้
            {nextDue ? ` คำถัดไปจะถึงกำหนดทวน${daysUntilLabel(nextDue)}` : ""}
          </p>
          <Button variant="ghost" disabled={advanceQueue.length === 0} onClick={() => startSession(advanceQueue)}>
            ทวนล่วงหน้า
          </Button>
        </div>

        <Button variant="ghost" style={{ marginTop: 16 }} onClick={() => navigate("/write")}>
          ✍️ ฝึกเขียน
        </Button>
      </div>
    );
  }

  const tier = lanternTier(dueCount);
  const minutes = estimateMinutes(Math.min(dueCount, 20));

  return (
    <div className="wrap">
      <div className="top">
        <div style={{ flex: 1 }}>
          <div className="h2">ทวนคำศัพท์</div>
          <div className="h1">ทวนคำ</div>
        </div>
      </div>

      <ReviewLantern tier={tier} />
      <div className="dueCaption">{lanternCaption(dueCount)}</div>
      <div className="dueNumber">{dueCount}</div>
      <div className="dueLabel">คำที่ถึงกำหนดทวนวันนี้</div>

      <Button variant="primary" onClick={() => startSession(buildDueQueue(progress, 20))}>
        เริ่มทวน
      </Button>
      <div className="dueEstimate">ใช้เวลาประมาณ {minutes} นาที</div>

      <Button variant="ghost" style={{ marginTop: 16 }} onClick={() => navigate("/write")}>
        ✍️ ฝึกเขียน
      </Button>
    </div>
  );
}

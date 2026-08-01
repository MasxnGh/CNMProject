import { KeyRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StampBurst from "../components/game/StampBurst.jsx";
import Button from "../components/ui/Button.jsx";
import Lantern from "../components/ui/Lantern.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import Sky from "../components/ui/Sky.jsx";
import { playSfx } from "../lib/audio.js";
import "../styles/result.css";

const COIN_TICKS = 24;
const KEY_BREAK_MS = 500;
const ROPE_FLOW_MS = 500;

const formatElapsed = (ms) => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} นาที ${seconds} วินาที` : `${seconds} วินาที`;
};

/**
 * dujeen-quest-gameplay-prompts.md Prompt B #3 (regular lesson) and Prompt
 * E #4 (unlock-test pass/fail) share this page via `isUnlockTest`/`failed`,
 * rather than a separate result screen for each. Presentational only: the
 * caller persists progress (this new engine isn't wired into a real
 * progress store yet - deferred since Prompt B's content-wiring gap).
 *
 * chapterLanterns: optional [{ icon, label }] for every node in the
 *   chapter, shown lighting up one by one when this was the last node -
 *   for isUnlockTest, preceded by a key-break + light-flows-along-the-rope
 *   flourish and an "unlock" sound per lantern instead of silent lighting.
 * failed/weakLessonLabel/onPracticeWeak: the unlock-test's fail branch -
 *   a distinct, encouraging layout, not a recolored pass screen.
 */
export default function Result({
  correctCount,
  total,
  comboMax,
  elapsedMs,
  coinsEarned,
  chapterLanterns,
  isUnlockTest = false,
  failed = false,
  weakLessonLabel,
  onPracticeWeak,
  onBackToMap,
  onNextLesson,
}) {
  const [coinDisplay, setCoinDisplay] = useState(0);
  const [litCount, setLitCount] = useState(0);
  const isLastInChapter = Boolean(chapterLanterns?.length);
  const stampTrigger = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (failed || coinsEarned <= 0) return undefined;
    const step = Math.max(1, Math.ceil(coinsEarned / COIN_TICKS));
    let current = 0;
    const interval = window.setInterval(() => {
      current = Math.min(coinsEarned, current + step);
      setCoinDisplay(current);
      playSfx("coin");
      if (current >= coinsEarned) window.clearInterval(interval);
    }, 45);
    return () => window.clearInterval(interval);
  }, [coinsEarned, failed]);

  useEffect(() => {
    if (failed || !isLastInChapter) return undefined;
    const startDelay = isUnlockTest ? KEY_BREAK_MS + ROPE_FLOW_MS : 600;
    const timers = chapterLanterns.map((_, index) =>
      window.setTimeout(() => {
        setLitCount((count) => Math.max(count, index + 1));
        playSfx(isUnlockTest ? "unlock" : "stamp");
      }, startDelay + index * 200),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastInChapter, failed, isUnlockTest]);

  if (failed) {
    return (
      <PageTransition className="lantern-app">
        <Sky />
        <main className="result-shell">
          <h1 className="result-title result-title-fail">ยังไม่ผ่านครั้งนี้</h1>
          <p className="result-fail-message">
            {weakLessonLabel
              ? `ด่าน "${weakLessonLabel}" ยังตอบผิดหลายข้อ ลองเล่นด่านนั้นก่อนนะ`
              : "ลองทบทวนคำศัพท์แล้วมาใหม่ได้เสมอนะ"}
          </p>
          <div className="result-actions">
            <Button onClick={onBackToMap} variant="ghost">
              กลับไปที่แผนที่
            </Button>
            {onPracticeWeak ? <Button onClick={onPracticeWeak}>ไปเล่นด่านที่อ่อน</Button> : null}
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="lantern-app">
      <Sky />
      <main className="result-shell">
        <StampBurst trigger={stampTrigger} />

        {isUnlockTest ? (
          <div className="result-key-break" aria-hidden="true">
            <KeyRound size={32} />
          </div>
        ) : null}

        <h1 className="result-title">{isUnlockTest ? "จุดโคมสามดวงสำเร็จ!" : "ภารกิจสำเร็จ"}</h1>

        <div className="result-stats">
          <div>
            <strong>{correctCount}/{total}</strong>
            <span>ตอบถูก</span>
          </div>
          <div>
            <strong>x{comboMax}</strong>
            <span>คอมโบสูงสุด</span>
          </div>
          <div>
            <strong>{formatElapsed(elapsedMs)}</strong>
            <span>เวลาที่ใช้</span>
          </div>
        </div>

        <div className="result-coins">
          🏮 <strong>{coinDisplay}</strong>
        </div>

        {isLastInChapter ? (
          <div className="result-chapter-lanterns">
            {isUnlockTest ? <div className="result-rope-flow" aria-hidden="true" /> : null}
            {chapterLanterns.map((lantern, index) => (
              <Lantern key={lantern.label} state={index < litCount ? "done" : "lock"} icon={lantern.icon} label={lantern.label} />
            ))}
          </div>
        ) : null}

        <div className="result-actions">
          <Button onClick={onBackToMap} variant="ghost">
            กลับไปที่แผนที่
          </Button>
          {onNextLesson ? <Button onClick={onNextLesson}>เล่นด่านต่อไป</Button> : null}
        </div>
      </main>
    </PageTransition>
  );
}

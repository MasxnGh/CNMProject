import { Flag, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/Button.jsx";
import { playSentence, playSfx, playWord } from "../../lib/audio.js";
import "../../styles/game-feedback.css";

const CORRECT_HEADLINES = ["ถูกต้อง!", "เยี่ยม!", "แม่นมาก!"];

/* Prompt F - a short buzz on answer, feature-detected since most desktop
   browsers have no vibrate() at all; wrong gets a distinct two-pulse
   pattern so it doesn't feel identical to a correct answer through touch alone. */
const vibrate = (pattern) => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
};

/**
 * dujeen-quest-gameplay-prompts.md Prompt A #3 - replaces the old
 * MissionVerdict.jsx entirely for the lantern-district exercise engine
 * (kept as a new component under components/game/ rather than editing the
 * shared one, since MissionVerdict is still used by GamePage/classic).
 *
 * variant: "correct" | "wrong"
 * answer: { hanzi, pinyin, thai, audioId, isSentence } - the correct answer,
 *   shown on the bottom line (correct) or as the "เฉลย" (wrong)
 * tokens: optional [{ hanzi, pinyin, thai }] word-by-word breakdown for the
 *   wrong state's "ดูคำแปลตรงตัว" toggle (a sentence's tokens)
 *
 * IMPORTANT: give this a `key` that changes per answer (e.g. the mission
 * index), not just per variant. The headline pick and the correct/wrong
 * sound both fire once on mount by design (each answer is a fresh event) -
 * without a fresh key, going correct -> wrong on the same exercise reuses
 * the mounted instance and replays neither.
 */
export default function FeedbackBar({ variant, answer, tokens, onContinue, onReportError }) {
  const correct = variant === "correct";
  const [literalOpen, setLiteralOpen] = useState(false);
  const headline = useMemo(
    () => (correct ? CORRECT_HEADLINES[Math.floor(Math.random() * CORRECT_HEADLINES.length)] : "ยังไม่ใช่"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const replay = () => {
    if (!answer?.audioId) return;
    if (answer.isSentence) playSentence(answer.audioId);
    else playWord(answer.audioId);
  };

  useEffect(() => {
    playSfx(correct ? "correct" : "wrong");
    vibrate(correct ? 30 : [40, 60, 40]);
    if (correct) replay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Enter" || event.code === "Space" || event.key === " ") {
        event.preventDefault();
        onContinue?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onContinue]);

  return (
    <div className={`game-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status" aria-live="polite">
      <div className="game-feedback-head">
        <strong>{headline}</strong>
        <div className="game-feedback-tools">
          <button type="button" className="game-feedback-icon" onClick={replay} aria-label="ฟังอีกครั้ง">
            <Volume2 size={18} />
          </button>
          <button type="button" className="game-feedback-icon" onClick={onReportError} aria-label="รายงานข้อผิดพลาด">
            <Flag size={18} />
          </button>
        </div>
      </div>

      {answer ? (
        <div className="game-feedback-answer">
          <span className="game-feedback-hanzi">{answer.hanzi}</span>
          <span className="game-feedback-pinyin">{answer.pinyin}</span>
          <span className="game-feedback-thai">{answer.thai}</span>
        </div>
      ) : null}

      {!correct && tokens?.length ? (
        <div className="game-feedback-literal">
          <button type="button" className="game-feedback-literal-toggle" onClick={() => setLiteralOpen((open) => !open)} aria-expanded={literalOpen}>
            ดูคำแปลตรงตัว
          </button>
          {literalOpen ? (
            <div className="game-feedback-literal-tokens">
              {tokens.map((token) => (
                <div key={token.hanzi} className="game-feedback-literal-token">
                  <span>{token.hanzi}</span>
                  <small>{token.thai}</small>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <Button variant={correct ? "primary" : "danger"} onClick={onContinue}>
        ต่อไป
      </Button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { vocabById } from "../exercises/content.js";
import "./FeedbackBar.css";

const CORRECT_MESSAGES = ["ถูกต้อง! 🏮", "เยี่ยม!", "แม่นมาก!"];

function LiteralBreakdown({ tokens }) {
  return (
    <div className="fxLiteral">
      {tokens.map((tokenId) => {
        const word = vocabById.get(tokenId);
        if (!word) return null;
        return (
          <span key={tokenId} className="fxLiteralChip">
            <b>{word.hanzi}</b>
            <i>{word.th}</i>
          </span>
        );
      })}
    </div>
  );
}

export default function FeedbackBar({ visible, correct, entry, onNext, onReplay, onReplaySlow, onReport }) {
  const [heading, setHeading] = useState(CORRECT_MESSAGES[0]);
  const [showLiteral, setShowLiteral] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (correct) setHeading(CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]);
    setShowLiteral(false);
    setReported(false);
  }, [visible, correct, entry?.id]);

  useEffect(() => {
    if (!visible) return undefined;
    const handleKey = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, onNext]);

  if (!entry) return null;

  return (
    <div className={["fx", visible ? "on" : "", correct ? "ok" : "no"].filter(Boolean).join(" ")}>
      <div className="in">
        <div className="fxTop">
          <div>
            <h4>{correct ? heading : "ยังไม่ใช่"}</h4>
            <small>
              {entry.hanzi} {entry.pinyin} — {entry.th}
            </small>
          </div>
          <div className="fxActions">
            <button type="button" className="fxIcon" onClick={onReplay} aria-label="ฟังอีกครั้ง">
              🔊
            </button>
            {onReplaySlow && (
              <button type="button" className="fxIcon" onClick={onReplaySlow} aria-label="ฟังช้าๆ">
                🐢
              </button>
            )}
            <button
              type="button"
              className={["fxIcon", reported && "reported"].filter(Boolean).join(" ")}
              onClick={() => {
                setReported(true);
                onReport?.();
              }}
              disabled={reported}
              aria-label="รายงานปัญหา"
            >
              🚩
            </button>
          </div>
        </div>

        {!correct && entry.tokens && (
          <button type="button" className="fxLiteralToggle" onClick={() => setShowLiteral((value) => !value)}>
            {showLiteral ? "ซ่อนคำแปลตรงตัว" : "ดูคำแปลตรงตัว"}
          </button>
        )}
        {!correct && showLiteral && entry.tokens && <LiteralBreakdown tokens={entry.tokens} />}

        <button type="button" className="btn" onClick={onNext}>
          ต่อไป
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../lib/audio.js";
import "../../styles/game-combo-badge.css";

const SPARK_COUNT = 8;

/**
 * dujeen-quest-gameplay-prompts.md Prompt A #5 - top-right "โคมติดต่อกัน xN"
 * badge, new component under components/game/ (the existing
 * components/ComboBadge.jsx stays as-is for GamePage/classic).
 *
 * `combo` is the running correct-answer streak, owned by the caller - this
 * component only reacts to it: shows at 3+, replays its bounce-in and the
 * "combo" sound on every increase, hides the instant combo resets to 0.
 */
export default function ComboBadge({ combo }) {
  const previous = useRef(0);
  const [bounceKey, setBounceKey] = useState(0);

  useEffect(() => {
    if (combo > previous.current) {
      playSfx("combo", combo);
      setBounceKey((key) => key + 1);
    }
    previous.current = combo;
  }, [combo]);

  if (combo < 3) return null;

  const glowing = combo >= 5;
  const sparking = combo >= 10;

  return (
    <div key={bounceKey} className={`game-combo-badge ${glowing ? "is-glowing" : ""}`} role="status" aria-live="polite">
      {sparking
        ? Array.from({ length: SPARK_COUNT }, (_, index) => (
            <span key={index} className="game-combo-spark" style={{ "--i": index }} aria-hidden="true" />
          ))
        : null}
      <span>โคมติดต่อกัน x{combo}</span>
    </div>
  );
}

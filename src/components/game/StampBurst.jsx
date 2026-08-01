import { useEffect, useState } from "react";
import Stamp from "../ui/Stamp.jsx";
import { playSfx } from "../../lib/audio.js";
import "../../styles/game-stamp-burst.css";

const HOLD_MS = 300;
const FADE_MS = 200;

/**
 * dujeen-quest-gameplay-prompts.md Prompt A #4. Reuses ui/Stamp.jsx's
 * existing bounce-in keyframe (scale 2.6->0.9->1, rotate -32->-12->-12,
 * 500ms - already matches this spec exactly) and adds what that component
 * doesn't do on its own: play the "stamp" sound, hold, then fade out.
 *
 * `trigger` is any value that changes (e.g. a counter) each time a correct
 * answer should burst the stamp.
 */
export default function StampBurst({ trigger, glyph = "过", onComplete }) {
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (trigger === undefined || trigger === null) return undefined;
    playSfx("stamp");
    setPhase("in");
    const fadeTimer = window.setTimeout(() => setPhase("out"), 500 + HOLD_MS);
    const doneTimer = window.setTimeout(() => {
      setPhase("idle");
      onComplete?.();
    }, 500 + HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (phase === "idle") return null;

  return (
    <div className={`ln-stamp-overlay game-stamp-burst ${phase === "out" ? "is-fading" : ""}`}>
      <Stamp glyph={glyph} size={150} />
    </div>
  );
}

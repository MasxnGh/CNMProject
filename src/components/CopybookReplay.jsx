import { useEffect, useRef, useState } from "react";

const STROKE_DURATION = 280;
const STROKE_GAP = 120;

// Redraws a saved copybook entry's actual recorded strokes. Shown fully
// drawn by default (so opening it immediately shows the finished work);
// bumping `playToken` replays the stroke-by-stroke reveal on demand.
export default function CopybookReplay({ entry, playToken }) {
  const pathRefs = useRef([]);
  const [lengths, setLengths] = useState([]);
  // A shared, mutable "which run is current" marker rather than a
  // per-closure boolean: React 18 StrictMode (dev only) invokes this effect
  // twice back to back on mount, and a boolean captured in each closure
  // can't stop an *already-started* stale run from still applying its
  // mutations after being superseded - bumping a shared ref does, since
  // every iteration re-checks it against the live value.
  const generationRef = useRef(0);

  useEffect(() => {
    const lens = pathRefs.current.map((el) => (el ? el.getTotalLength() : 0));
    setLengths(lens);
    pathRefs.current.forEach((el, i) => {
      if (!el) return;
      el.getAnimations().forEach((anim) => anim.cancel());
      el.style.strokeDasharray = `${lens[i]}`;
      el.style.strokeDashoffset = "0";
    });
  }, [entry]);

  useEffect(() => {
    if (playToken == null) return undefined;
    generationRef.current += 1;
    const myGeneration = generationRef.current;

    (async () => {
      for (let i = 0; i < pathRefs.current.length; i += 1) {
        if (generationRef.current !== myGeneration) return;
        const el = pathRefs.current[i];
        if (!el) continue;
        const length = lengths[i] ?? el.getTotalLength();

        el.style.strokeDashoffset = `${length}`;
        el.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
          duration: STROKE_DURATION,
          easing: "ease",
        });

        // Sequenced by a plain timer matched to the animation's own
        // duration rather than awaiting Animation.finished.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, STROKE_DURATION + STROKE_GAP));
        if (generationRef.current !== myGeneration) return;
        el.style.strokeDashoffset = "0";
      }
    })();

    return undefined;
  }, [playToken, lengths]);

  return (
    <svg viewBox={`0 0 ${entry.size || 360} ${entry.size || 360}`} className="copybookReplaySvg">
      {(entry.strokePaths || []).map((d, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el;
          }}
          d={d}
          fill="none"
          stroke="var(--paper)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

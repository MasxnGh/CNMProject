import { useMemo } from "react";

/**
 * dujeen-quest-prototype.html .sky/.spark - drifting embers behind
 * everything. Randomized once per mount (not per render), matching the
 * prototype's one-time `for` loop that built 18 fixed-but-randomized spans.
 */
export default function Sky({ count = 18 }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        duration: `${11 + Math.random() * 13}s`,
        delay: `${-Math.random() * 20}s`,
      })),
    [count],
  );

  return (
    <div className="ln-sky" aria-hidden="true">
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="ln-spark"
          style={{ left: spark.left, animationDuration: spark.duration, animationDelay: spark.delay }}
        />
      ))}
    </div>
  );
}

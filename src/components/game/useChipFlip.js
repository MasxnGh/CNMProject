import { useLayoutEffect, useRef } from "react";

const FLIP_MS = 260;
const FLIP_EASE = "cubic-bezier(.2,.9,.3,1)";

/**
 * True FLIP for chips that move between the tray and the slot row (two
 * different DOM subtrees, so React unmounts/remounts the button rather than
 * moving one node). `capture(chipId)` must run synchronously BEFORE the
 * state change that will relocate the chip; on the next commit this measures
 * where it landed and animates from the old screen position to the new one,
 * so it always looks like one chip flying, never disappear-then-reappear.
 *
 * Uses a double rAF before flipping the transition on: a `transform`-only
 * style change doesn't invalidate layout, so a forced reflow alone isn't
 * reliably enough to make the browser paint the offset state first - without
 * the extra frame the "start" and "end" styles can get coalesced into one
 * paint and the chip never visibly animates in.
 */
export function useChipFlip(containerRef) {
  const pending = useRef(new Map());

  const capture = (chipId) => {
    const el = containerRef.current?.querySelector(`[data-chip-id="${chipId}"]`);
    if (el) pending.current.set(chipId, el.getBoundingClientRect());
  };

  useLayoutEffect(() => {
    if (pending.current.size === 0) return;
    const entries = [...pending.current.entries()];
    pending.current.clear();

    entries.forEach(([chipId, firstRect]) => {
      const el = containerRef.current?.querySelector(`[data-chip-id="${chipId}"]`);
      if (!el) return;
      const lastRect = el.getBoundingClientRect();
      const dx = firstRect.left - lastRect.left;
      const dy = firstRect.top - lastRect.top;
      if (dx === 0 && dy === 0) return;

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
          el.style.transform = "";
        });
      });

      const clear = () => {
        el.style.transition = "";
        el.removeEventListener("transitionend", clear);
      };
      el.addEventListener("transitionend", clear);
    });
  });

  return { capture };
}

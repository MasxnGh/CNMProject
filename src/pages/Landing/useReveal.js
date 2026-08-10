import { useEffect, useRef, useState } from "react";

const supportsIO = typeof window !== "undefined" && "IntersectionObserver" in window;

/**
 * Reveal-on-scroll: true once the element has intersected the viewport, then stays true.
 * Falls back to always-true when IntersectionObserver isn't supported, so content is
 * never permanently hidden.
 */
export default function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!supportsIO);

  useEffect(() => {
    if (!supportsIO || visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.13 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return [ref, visible];
}

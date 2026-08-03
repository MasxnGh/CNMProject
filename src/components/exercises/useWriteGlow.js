import { useEffect } from "react";

// Small glow blob that follows the finger/cursor while drawing - purely
// cosmetic, listens on the container without interfering with HanziWriter's
// own mouse/touch listeners on the SVG it injects inside that container.
export function useWriteGlow(containerRef, glowRef) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const moveGlow = (x, y) => {
      if (!glowRef.current) return;
      const rect = el.getBoundingClientRect();
      glowRef.current.style.transform = `translate(${x - rect.left}px, ${y - rect.top}px)`;
    };
    const showGlow = (event) => {
      moveGlow(event.clientX, event.clientY);
      if (glowRef.current) glowRef.current.style.opacity = "1";
    };
    const moveHandler = (event) => moveGlow(event.clientX, event.clientY);
    const hideGlow = () => {
      if (glowRef.current) glowRef.current.style.opacity = "0";
    };

    el.addEventListener("pointerdown", showGlow);
    el.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", hideGlow);
    window.addEventListener("pointercancel", hideGlow);
    return () => {
      el.removeEventListener("pointerdown", showGlow);
      el.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", hideGlow);
      window.removeEventListener("pointercancel", hideGlow);
    };
  }, [containerRef, glowRef]);
}

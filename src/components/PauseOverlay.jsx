import { ArrowLeft, Pause, Play, RotateCcw, Volume2, WandSparkles } from "lucide-react";
import React, { useEffect, useRef } from "react";

export default function PauseOverlay({
  soundOn,
  reducedMotion,
  onResume,
  onToggleSound,
  onToggleReducedMotion,
  onRestart,
  onMap,
}) {
  const resumeRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    resumeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onResume();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [...(panelRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? [])];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const focusEscaped = !panelRef.current?.contains(active);
      if (focusEscaped || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
        event.preventDefault();
        event.stopPropagation();
        (event.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onResume]);

  return (
    <div className="v2-modal-backdrop" role="dialog" aria-modal="true" aria-label="Game paused">
      <section ref={panelRef} className="v2-modal-panel">
        <div className="v2-modal-head">
          <div className="v2-modal-icon"><Pause size={22} /></div>
          <div>
            <h2>Game paused</h2>
            <p>Your mission state is safe. Resume when you are ready.</p>
          </div>
        </div>

        <div className="grid gap-3 mt-4">
          <button ref={resumeRef} className="v2-button primary" type="button" onClick={onResume}>
            <Play size={20} /> Resume
          </button>
          <button className="v2-button glass" type="button" onClick={onToggleSound}>
            <Volume2 size={20} /> Sound {soundOn ? "on" : "off"}
          </button>
          <button className="v2-button glass" type="button" onClick={onToggleReducedMotion}>
            <WandSparkles size={20} /> Reduced motion {reducedMotion ? "on" : "off"}
          </button>
          <button className="v2-button ghost" type="button" onClick={onRestart}>
            <RotateCcw size={20} /> Restart Level
          </button>
          <button className="v2-button ghost" type="button" onClick={onMap}>
            <ArrowLeft size={20} /> Back to map
          </button>
        </div>
      </section>
    </div>
  );
}

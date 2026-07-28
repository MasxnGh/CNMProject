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
    <div className="v2-modal-backdrop" role="dialog" aria-modal="true" aria-label="หยุดเกมชั่วคราว">
      <section ref={panelRef} className="v2-modal-panel">
        <div className="v2-modal-head">
          <div className="v2-modal-icon"><Pause size={22} /></div>
          <div>
            <h2>หยุดเกมชั่วคราว</h2>
            <p>ภารกิจของคุณถูกบันทึกไว้แล้ว กดเล่นต่อเมื่อพร้อม</p>
          </div>
        </div>

        <div className="grid gap-3 mt-4">
          <button ref={resumeRef} className="v2-button primary" type="button" onClick={onResume}>
            <Play size={20} /> เล่นต่อ
          </button>
          <button className="v2-button glass" type="button" onClick={onToggleSound}>
            <Volume2 size={20} /> {soundOn ? "ปิดเสียง" : "เปิดเสียง"}
          </button>
          <button className="v2-button glass" type="button" onClick={onToggleReducedMotion}>
            <WandSparkles size={20} /> {reducedMotion ? "ปิดลดการเคลื่อนไหว" : "เปิดลดการเคลื่อนไหว"}
          </button>
          <button className="v2-button ghost" type="button" onClick={onRestart}>
            <RotateCcw size={20} /> เริ่มด่านใหม่
          </button>
          <button className="v2-button ghost" type="button" onClick={onMap}>
            <ArrowLeft size={20} /> กลับแผนที่
          </button>
        </div>
      </section>
    </div>
  );
}

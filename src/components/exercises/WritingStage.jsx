import Stamp from "../ui/Stamp.jsx";
import "./WriteCharacter.css";

// Visual chrome for a writing area: the faint 米字格 grid, the div HanziWriter
// mounts its SVG into, and the glow that follows the pointer while drawing.
// Shared between WriteCharacter.jsx (graded exercises) and the free-write
// practice page.
export default function WritingStage({ containerRef, glowRef, completed }) {
  return (
    <div className="writeStage">
      <svg className="writeGrid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1="50" y1="0" x2="50" y2="100" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <line x1="0" y1="0" x2="100" y2="100" />
        <line x1="100" y1="0" x2="0" y2="100" />
      </svg>
      <div ref={containerRef} className="writeCanvas" />
      <div ref={glowRef} className="writeGlow" aria-hidden="true" />
      <Stamp show={!!completed} />
    </div>
  );
}

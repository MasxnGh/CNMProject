import { motion, useReducedMotion } from "framer-motion";

/**
 * The ink-wash mascot: a drop of ink taking on a life of its own. Kept
 * deliberately simple (a single SVG blob + two face states) so the seal
 * stamp stays the one elaborate signature piece of the redesign.
 */
export default function InkDrop({ mood = "happy", text, compact = false }) {
  const reduceMotion = useReducedMotion();
  const sad = mood === "sad";

  return (
    <div className={`v2-inkdrop-guide ${compact ? "compact" : ""}`} aria-label="หมึกน้อย">
      <motion.svg
        className="v2-inkdrop"
        viewBox="0 0 100 100"
        animate={reduceMotion ? undefined : { y: sad ? [0, 2, 0] : [0, -4, 0] }}
        transition={{ duration: sad ? 2.4 : 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          className="v2-inkdrop-body"
          d="M50 8 C68 30 82 48 82 65 C82 84 68 96 50 96 C32 96 18 84 18 65 C18 48 32 30 50 8 Z"
        />
        <ellipse className="v2-inkdrop-sheen" cx="38" cy="46" rx="9" ry="13" />
        {sad ? (
          <g className="v2-inkdrop-face">
            <path className="v2-inkdrop-eye" d="M36 62 q5 -6 10 0" />
            <path className="v2-inkdrop-eye" d="M54 62 q5 -6 10 0" />
            <path className="v2-inkdrop-mouth" d="M40 80 q10 -8 20 0" />
          </g>
        ) : (
          <g className="v2-inkdrop-face">
            <circle className="v2-inkdrop-eye" cx="41" cy="60" r="3.4" />
            <circle className="v2-inkdrop-eye" cx="59" cy="60" r="3.4" />
            <path className="v2-inkdrop-mouth" d="M39 74 q11 10 22 0" />
          </g>
        )}
      </motion.svg>
      {text ? <div className="v2-inkdrop-bubble">{text}</div> : null}
    </div>
  );
}

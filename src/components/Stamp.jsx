import { motion, useReducedMotion } from "framer-motion";

/**
 * The seal (印章) — this redesign's one signature element. A vermilion stamp
 * with a hand-carved edge, standing in for stars/checkmarks anywhere a
 * cleared or earned state needs marking. `animate` plays the stamp-down
 * strike once on mount; pass false to render it already settled (e.g. when
 * listing badges earned in a past session).
 */
export default function Stamp({ size = 56, animate = true, label = "ตราประทับ" }) {
  const reduceMotion = useReducedMotion();
  const play = animate && !reduceMotion;

  return (
    <motion.svg
      className="v2-stamp"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      initial={play ? { scale: 2.2, opacity: 0, rotate: -14 } : false}
      animate={{ scale: 1, opacity: 1, rotate: -6 }}
      transition={play ? { type: "spring", stiffness: 420, damping: 14, mass: 0.8 } : undefined}
    >
      <path
        className="v2-stamp-seal"
        d="M14 10 Q50 2 86 11 Q95 50 87 89 Q50 97 12 88 Q4 50 14 10 Z"
      />
      <path
        className="v2-stamp-inner"
        d="M22 18 Q50 12 79 19 Q86 50 78 81 Q50 88 20 80 Q13 50 22 18 Z"
      />
      <text x="50" y="64" className="v2-stamp-glyph" textAnchor="middle">过</text>
    </motion.svg>
  );
}

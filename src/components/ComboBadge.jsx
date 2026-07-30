import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const tierClass = (combo) => (combo >= 15 ? "tier-3" : combo >= 10 ? "tier-2" : "tier-1");

/** Floats up and fades on every 5th consecutive correct answer, changing color each tier. */
export default function ComboBadge({ combo }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {combo ? (
        <motion.div
          key={combo}
          className={`v2-combo-badge ${tierClass(combo)}`}
          role="status"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
        >
          รัวๆ! x{combo}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import { motion, useReducedMotion } from "framer-motion";

const FLIP_TRANSITION = { duration: 0.26, ease: [0.2, 0.9, 0.3, 1] };

/**
 * dujeen-quest-gameplay-prompts.md Prompt C - the answer slots row. Empty
 * slots show a faint dashed glow; the slot that will receive the next
 * chip glows more intensely. `revealState` (set after submit) is an array
 * of "correct"/"wrong"/null per index, staggered left-to-right via
 * --reveal-delay.
 */
export default function ChipSlots({ placement, fixedSlots = {}, nextEmptyIndex, onRemove, disabled, revealState }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="chip-slots">
      {placement.map((chip, index) => {
        const isFixed = Boolean(fixedSlots[index]);
        const reveal = revealState?.[index];

        if (!chip) {
          return <div key={`empty-${index}`} className={`chip-slot-empty ${index === nextEmptyIndex ? "is-next" : ""}`} />;
        }

        return (
          <motion.button
            key={chip.id}
            layoutId={isFixed ? undefined : `chip-${chip.id}`}
            layout={!isFixed}
            type="button"
            className={`chip chip-slot-filled ${isFixed ? "is-fixed" : ""} ${reveal ? `is-${reveal}` : ""}`}
            onClick={() => !isFixed && onRemove(index)}
            disabled={disabled || isFixed}
            style={{ "--reveal-delay": `${index * 90}ms` }}
            transition={reduceMotion ? { duration: 0 } : FLIP_TRANSITION}
          >
            <strong>{chip.hanzi}</strong>
          </motion.button>
        );
      })}
    </div>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import "../../styles/game-chips.css";

const FLIP_TRANSITION = { duration: 0.26, ease: [0.2, 0.9, 0.3, 1] };

/**
 * dujeen-quest-gameplay-prompts.md Prompt C - the chip pool. Shares
 * layoutId with the chip's slot counterpart in ChipSlots.jsx so Framer
 * Motion performs a real FLIP (measure old/new position, transform between
 * them) when a chip moves between tray and slot - not a disappear/reappear.
 * This is a deliberate, narrow use of Framer Motion for exactly the "real
 * FLIP animation" this prompt asks for (the earlier visual-redesign
 * document's "FM only for page transitions + stamp" rule was scoped to
 * that document's own component set, not restated here).
 */
export default function ChipTray({ chips, onPick, disabled }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="chip-tray">
      {chips.map((chip) => (
        <motion.button
          key={chip.id}
          layoutId={`chip-${chip.id}`}
          layout
          type="button"
          className="chip"
          onClick={() => onPick(chip)}
          disabled={disabled}
          transition={reduceMotion ? { duration: 0 } : FLIP_TRANSITION}
        >
          <strong>{chip.hanzi}</strong>
          {chip.pinyin ? <small>{chip.pinyin}</small> : null}
        </motion.button>
      ))}
    </div>
  );
}

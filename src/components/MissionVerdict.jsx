import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

/**
 * The examiner's verdict. A correct answer gets the jade seal; a wrong answer
 * gets the vermilion seal plus a scroll listing exactly which part was wrong
 * and what it should have been.
 */
export default function MissionVerdict({ feedback, explanation, onContinue, continueRef }) {
  const reduceMotion = useReducedMotion();
  if (!feedback) return null;

  const { correct } = feedback;
  const notes = feedback.notes ?? [];
  const seal = correct ? "jade" : "cinnabar";

  const stamp = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
      initial: { scale: 2.4, opacity: 0, rotate: correct ? -18 : 14 },
      animate: { scale: 1, opacity: 1, rotate: correct ? -7 : 5 },
      transition: { type: "spring", stiffness: 520, damping: 18, mass: 0.7 },
    };

  /* The arena carries a backdrop-filter, which makes it the containing block
     for fixed descendants, so the sheet has to leave that subtree to pin
     itself to the viewport. */
  const sheet = (
    <motion.section
      className={`v2-verdict ${correct ? "right" : "wrong"}`}
      role="status"
      aria-live="polite"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.001 } : { type: "spring", stiffness: 320, damping: 32 }}
    >
      <div className="v2-verdict-head">
        <motion.span className={`v2-seal ${seal}`} aria-hidden="true" {...stamp}>
          {correct ? <Check size={26} strokeWidth={4} /> : <X size={26} strokeWidth={4} />}
        </motion.span>
        <div className="min-w-0">
          <strong>{feedback.text}</strong>
          {explanation ? <p>{explanation}</p> : null}
        </div>
      </div>

      <AnimatePresence>
        {notes.length ? (
          <motion.div
            className="v2-correction-scroll"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            transition={{ duration: reduceMotion ? 0.001 : 0.3, ease: "easeOut", delay: reduceMotion ? 0 : 0.18 }}
          >
            <span className="v2-correction-title">จุดที่ต้องแก้</span>
            <ul>
              {notes.map((note, index) => (
                <motion.li
                  key={note}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.26 + index * 0.06, duration: 0.22 }}
                >
                  <span className="v2-correction-mark" aria-hidden="true" />
                  {note}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button ref={continueRef} className="v2-button primary v2-verdict-continue" type="button" onClick={onContinue}>
        ไปต่อ
      </button>
    </motion.section>
  );

  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}

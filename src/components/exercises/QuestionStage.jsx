import { AnimatePresence, motion } from "framer-motion";
import QuestionRenderer from "./QuestionRenderer.jsx";

// Old question slides out left, new one slides in from the right - no white
// flash, no layout jump (popLayout takes the exiting item out of flow while
// it animates). Shake must NOT live on this element: Framer Motion drives
// this div's `transform` continuously, and a competing CSS animation on the
// same property would fight it - the shakeX wrapper stays one level up.
export default function QuestionStage({ exercise, selected, checked, onPick, onSkip, onResult, checkButton }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={exercise.id}
        className="quizGrid"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.3, 1] }}
      >
        <QuestionRenderer
          exercise={exercise}
          selected={selected}
          checked={checked}
          onPick={onPick}
          onSkip={onSkip}
          onResult={onResult}
          checkButton={checkButton}
        />
      </motion.div>
    </AnimatePresence>
  );
}

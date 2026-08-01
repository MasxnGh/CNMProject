import { motion, useReducedMotion } from "framer-motion";

/**
 * dujeen-quest-gameplay-prompts.md Prompt F - a shared slide+fade so moving
 * between the new engine's own screens (Lesson/Result/Review, switched
 * inside LessonPreview.jsx today since they aren't on real routes yet) never
 * hard-cuts. `.lantern-app`'s own opaque background (theme.css) is what
 * prevents a white flash underneath the slide - this only adds the motion.
 * lantern-ui.css's CSS `transition:none` override doesn't reach
 * framer-motion (it animates via JS, not CSS transitions), so
 * prefers-reduced-motion is handled here directly via useReducedMotion().
 */
export default function PageTransition({ className = "", children }) {
  const reduceMotion = useReducedMotion();
  const distance = reduceMotion ? 0 : 24;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: distance }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -distance }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

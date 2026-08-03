import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./Stamp.css";

const ANIMATION_MS = 500;
const HOLD_MS = 320;

export default function Stamp({ show, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return undefined;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, ANIMATION_MS + HOLD_MS);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="stampPop" aria-hidden="true">
      <motion.div
        initial={{ scale: 2.6, rotate: -32, opacity: 0 }}
        animate={{ scale: [2.6, 0.9, 1], rotate: [-32, -12, -12], opacity: [0, 1, 1] }}
        transition={{ duration: ANIMATION_MS / 1000, times: [0, 0.55, 1], ease: [0.2, 1.5, 0.4, 1] }}
      >
        过
      </motion.div>
    </div>
  );
}

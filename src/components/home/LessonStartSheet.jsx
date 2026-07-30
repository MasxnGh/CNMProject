import { motion } from "framer-motion";
import { Play, X } from "lucide-react";

export default function LessonStartSheet({ title, topic, lessonLabel, onStart, onClose }) {
  return (
    <div className="rm-sheet-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="rm-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="rm-navbutton" style={{ marginLeft: "auto" }} onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>
        <small style={{ color: "var(--v2-gold, #ffd76b)", fontWeight: 800 }}>{lessonLabel}</small>
        <h2>{title}</h2>
        <p>{topic}</p>
        <button type="button" className="rm-button primary" onClick={onStart}>
          <Play size={18} />
          เริ่ม
        </button>
      </motion.div>
    </div>
  );
}

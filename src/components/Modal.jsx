import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function Modal({ open, title, children, confirmText, cancelText = "ยกเลิก", onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="v2-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="v2-modal-panel"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="v2-modal-head">
              <div className="v2-modal-icon"><AlertTriangle size={23} /></div>
              <div>
                <h2>{title}</h2>
                <p>{children}</p>
              </div>
              <motion.button className="v2-modal-close" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onCancel} aria-label="ปิด">
                <X size={20} />
              </motion.button>
            </div>
            <div className="v2-modal-actions">
              <motion.button className="v2-button glass" whileHover={{ y: -2, scale: 1.02 }} whileTap={{ y: 3, scale: 0.98 }} onClick={onCancel}>
                {cancelText}
              </motion.button>
              <motion.button className="v2-button danger" whileHover={{ y: -2, scale: 1.02 }} whileTap={{ y: 3, scale: 0.98 }} onClick={onConfirm}>
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

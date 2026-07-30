import { motion } from "framer-motion";
import { Coins, X } from "lucide-react";

export default function DailyRewardModal({ amount, onClaim, onClose }) {
  return (
    <div className="rm-reward-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="rm-reward-modal"
        role="dialog"
        aria-modal="true"
        aria-label="กล่องรางวัลรายวัน"
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        onClick={(event) => event.stopPropagation()}
      >
        <Coins size={40} color="var(--v2-gold, #ffd76b)" />
        <h2>รางวัลประจำวัน</h2>
        <p className="rm-reward-amount">+{amount}</p>
        <button type="button" className="rm-button primary" onClick={onClaim}>
          รับรางวัล
        </button>
        <button type="button" className="rm-navbutton" style={{ marginTop: "0.5rem" }} onClick={onClose} aria-label="ปิด">
          <X size={18} />
        </button>
      </motion.div>
    </div>
  );
}

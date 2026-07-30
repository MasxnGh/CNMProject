import { motion, useReducedMotion } from "framer-motion";
import { Coins, Flame, Gift } from "lucide-react";
import AnimatedNumber from "../AnimatedNumber.jsx";
import { isDailyRewardClaimed } from "../../lib/progress.js";

export default function TopBar({ progress, onOpenReward }) {
  const claimed = isDailyRewardClaimed(progress);
  const reduceMotion = useReducedMotion();

  return (
    <header className="rm-topbar">
      <span className="rm-topbar-brand">Dujeen Quest</span>
      <div className="rm-topbar-chips">
        <span className="rm-chip streak" aria-label={`ต่อเนื่อง ${progress.streak.count} วัน`}>
          <motion.span
            style={{ display: "inline-flex" }}
            animate={reduceMotion ? undefined : { scale: [1, 1.18, 1] }}
            transition={reduceMotion ? undefined : { duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flame size={18} fill="currentColor" aria-hidden="true" />
          </motion.span>
          <AnimatedNumber value={progress.streak.count} />
        </span>
        <span className="rm-chip coins" aria-label={`เหรียญ ${progress.coins}`}>
          <Coins size={18} aria-hidden="true" />
          <AnimatedNumber value={progress.coins} />
        </span>
        <motion.button
          type="button"
          className="rm-chip-button gift"
          onClick={onOpenReward}
          disabled={claimed}
          aria-label={claimed ? "รับรางวัลวันนี้แล้ว" : "เปิดกล่องรางวัลรายวัน"}
          whileTap={claimed ? undefined : { scale: 0.9 }}
        >
          <Gift size={20} aria-hidden="true" />
        </motion.button>
      </div>
    </header>
  );
}

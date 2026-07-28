import { motion } from "framer-motion";
import { CircleDollarSign, Sparkles, Star, Trophy } from "lucide-react";
import { useId } from "react";
import ProgressBar from "./ProgressBar";

export default function PlayerStatus({ progress, compact = false }) {
  const xpInLevel = progress.xp % 120;
  const labelId = useId();

  return (
    <motion.div
      className={`v2-status-hud ${compact ? "compact" : ""}`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -16, opacity: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <div className="v2-player-chip">
        <span className="v2-player-avatar" aria-hidden="true">猫</span>
        <dl className="v2-player-details">
          <div>
            <dt className="sr-only" id={`${labelId}-level`}>ระดับ</dt>
            <dd aria-labelledby={`${labelId}-level`}>
              <strong>Lv. {progress.level}</strong>
              <small>นักเดินทางคัมภีร์</small>
            </dd>
          </div>
        </dl>
      </div>
      <div className="v2-xp-core" aria-label={`ค่าประสบการณ์ ${progress.xp}`}>
        <div className="v2-xp-label">
          <Trophy size={15} />
          XP {progress.xp}
        </div>
        <ProgressBar value={xpInLevel} max={120} />
      </div>
      <dl className="v2-hud-stats">
        <div className="v2-stat-orb">
          <dt className="sr-only" id={`${labelId}-coins`}>เหรียญ</dt>
          <dd aria-labelledby={`${labelId}-coins`}>
            <CircleDollarSign size={18} aria-hidden="true" />
            <strong>{progress.coins}</strong>
          </dd>
        </div>
        <div className="v2-stat-orb gold">
          <dt className="sr-only" id={`${labelId}-stars`}>ดาวสะสม</dt>
          <dd aria-labelledby={`${labelId}-stars`}>
            <Star size={18} fill="currentColor" aria-hidden="true" />
            <strong>{progress.totalStars ?? 0}</strong>
          </dd>
        </div>
        <div className="v2-stat-orb">
          <dt className="sr-only" id={`${labelId}-completed`}>ด่านที่ผ่านแล้ว</dt>
          <dd aria-labelledby={`${labelId}-completed`}>
            <Sparkles size={18} aria-hidden="true" />
            <strong>{progress.completedLevels.length}/15</strong>
          </dd>
        </div>
      </dl>
    </motion.div>
  );
}

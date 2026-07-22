import { motion } from "framer-motion";
import { CircleDollarSign, Sparkles, Star, Trophy } from "lucide-react";
import ProgressBar from "./ProgressBar";

export default function PlayerStatus({ progress, compact = false }) {
  const xpInLevel = progress.xp % 120;

  return (
    <motion.div
      className={`v2-status-hud ${compact ? "compact" : ""}`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -16, opacity: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <div className="v2-player-chip">
        <span className="v2-player-avatar">猫</span>
        <div>
          <strong>Lv. {progress.level}</strong>
          <small>Dujeen Explorer</small>
        </div>
      </div>
      <div className="v2-xp-core">
        <div className="v2-xp-label">
          <Trophy size={15} />
          XP {progress.xp}
        </div>
        <ProgressBar value={xpInLevel} max={120} />
      </div>
      <div className="v2-stat-orb">
        <CircleDollarSign size={18} />
        <strong>{progress.coins}</strong>
      </div>
      <div className="v2-stat-orb gold">
        <Star size={18} fill="currentColor" />
        <strong>{progress.totalStars ?? 0}</strong>
      </div>
      <div className="v2-stat-orb">
        <Sparkles size={18} />
        <strong>{progress.completedLevels.length}/15</strong>
      </div>
    </motion.div>
  );
}

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
      <div className="v2-player-chip" aria-label={`Level ${progress.level}, Dujeen Explorer`}>
        <span className="v2-player-avatar" aria-hidden="true">猫</span>
        <div>
          <strong>Lv. {progress.level}</strong>
          <small>Dujeen Explorer</small>
        </div>
      </div>
      <div className="v2-xp-core" aria-label={`Experience points: ${progress.xp}`}>
        <div className="v2-xp-label">
          <Trophy size={15} />
          XP {progress.xp}
        </div>
        <ProgressBar value={xpInLevel} max={120} />
      </div>
      <div className="v2-hud-stats" aria-label="Player statistics">
        <div className="v2-stat-orb" aria-label={`Coins: ${progress.coins}`}>
          <CircleDollarSign size={18} aria-hidden="true" />
          <strong>{progress.coins}</strong>
        </div>
        <div className="v2-stat-orb gold" aria-label={`Stars: ${progress.totalStars ?? 0}`}>
          <Star size={18} fill="currentColor" aria-hidden="true" />
          <strong>{progress.totalStars ?? 0}</strong>
        </div>
        <div className="v2-stat-orb" aria-label={`Completed levels: ${progress.completedLevels.length} of 15`}>
          <Sparkles size={18} aria-hidden="true" />
          <strong>{progress.completedLevels.length}/15</strong>
        </div>
      </div>
    </motion.div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Coffee,
  Crown,
  Home,
  Landmark,
  Library,
  Lock,
  Mountain,
  PawPrint,
  PartyPopper,
  Play,
  ScrollText,
  Soup,
  Star,
  TrainFront,
  Utensils,
} from "lucide-react";

const iconMap = {
  BowlFood: Soup,
  CupSoda: Coffee,
  Landmark,
  Clock3,
  TrainFront,
  Utensils,
  PartyPopper,
  BookOpen,
  PawPrint,
  Home,
  Apple,
  ScrollText,
  Library,
  Mountain,
  Crown,
};

/**
 * A stop on the route. The node itself stays small so the path reads as a
 * journey; the level's details unfold in a card beneath it when tapped, which
 * keeps long Thai titles out of the node and off the path.
 */
export default function LevelCard({ level, unlocked, completed, current, stars = 0, onPlay, open, onOpen }) {
  const Icon = iconMap[level.icon] ?? Circle;

  return (
    <div className={`v2-level-stop ${open ? "open" : ""}`}>
      <motion.button
        type="button"
        className={`v2-level-island ${completed ? "completed" : ""} ${stars === 3 ? "perfect" : ""} ${current ? "current" : ""} ${!unlocked ? "locked" : ""}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={unlocked ? { y: -5 } : { x: [-2, 2, -2, 0] }}
        whileTap={unlocked ? { y: 2, scale: 0.97 } : { scale: 1 }}
        onClick={() => unlocked && onOpen?.(level.id)}
        disabled={!unlocked}
        aria-expanded={Boolean(open)}
      >
        <span className="v2-level-glow" />
        {completed ? <span className="dq-seal earned v2-level-seal" aria-hidden="true">過</span> : null}
        <span className="v2-level-orb">
          {completed ? <CheckCircle2 size={26} /> : unlocked ? <Icon size={26} /> : <Lock size={24} />}
        </span>
        <span className="v2-level-index">ด่าน {level.id}</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="v2-level-sheet"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <strong>{level.title}</strong>
            <small>{level.topic}</small>
            <span className="v2-level-stars" aria-label={`${stars} ดาว`}>
              {[1, 2, 3].map((star) => (
                <Star key={star} size={16} fill="currentColor" className={star <= stars ? "earned" : "empty"} />
              ))}
            </span>
            <motion.button
              type="button"
              className="v2-button primary"
              whileHover={{ y: -2 }}
              whileTap={{ y: 2 }}
              onClick={() => onPlay(level.id)}
            >
              <Play size={18} />
              {completed ? "เล่นซ้ำ" : "เริ่ม"}
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

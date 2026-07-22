import { motion } from "framer-motion";
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

export default function LevelCard({ level, unlocked, completed, current, stars = 0, onPlay }) {
  const Icon = iconMap[level.icon] ?? Circle;

  return (
    <motion.button
      className={`v2-level-island ${completed ? "completed" : ""} ${stars === 3 ? "perfect" : ""} ${current ? "current" : ""} ${!unlocked ? "locked" : ""}`}
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      whileHover={unlocked ? { y: -9, scale: 1.035 } : { x: [-2, 2, -2, 0] }}
      whileTap={unlocked ? { y: 2, scale: 0.97 } : { scale: 1 }}
      onClick={() => unlocked && onPlay(level.id)}
      disabled={!unlocked}
    >
      <span className="v2-level-glow" />
      <span className="v2-level-orb">
        {completed ? <CheckCircle2 size={28} /> : unlocked ? <Icon size={28} /> : <Lock size={27} />}
      </span>
      <span className="v2-level-index">ด่าน {level.id}</span>
      <strong>{level.title}</strong>
      <small>{level.topic}</small>
      <span className="v2-level-stars" aria-label={`${stars} ดาว`}>
        {[1, 2, 3].map((star) => (
          <Star key={star} size={17} fill="currentColor" className={star <= stars ? "earned" : "empty"} />
        ))}
      </span>
      <em>{completed ? "ผ่านแล้ว" : unlocked ? "เริ่มภารกิจ" : "ยังล็อก"}</em>
    </motion.button>
  );
}

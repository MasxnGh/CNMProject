import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export default function SoundToggle({ enabled, onToggle }) {
  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <motion.button
      className={`sound-toggle ${enabled ? "on" : "off"}`}
      type="button"
      whileHover={{ y: -2, scale: 1.04 }}
      whileTap={{ y: 2, scale: 0.96 }}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "ปิดเสียง" : "เปิดเสียง"}
    >
      <Icon size={20} />
      <span>{enabled ? "Sound" : "Mute"}</span>
    </motion.button>
  );
}

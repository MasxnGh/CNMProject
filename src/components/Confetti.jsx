import { useMemo } from "react";
import { motion } from "framer-motion";

const colors = ["#C08A34", "#B8272B", "#4F7A68", "#F3EEE1", "#8C1B1E"];

export default function Confetti({ count = 32 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 1.5,
        rotate: Math.random() * 360,
        color: colors[index % colors.length],
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-[-20px] block h-3 w-2 rounded-sm"
          style={{ left: `${piece.left}%`, background: piece.color }}
          initial={{ y: -30, rotate: 0, opacity: 0 }}
          animate={{ y: "110vh", rotate: piece.rotate + 540, opacity: [0, 1, 1, 0] }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

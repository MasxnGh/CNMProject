import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookMarked, Compass, Crown, GraduationCap, Lock, Medal, Mountain, Sparkles, Star } from "lucide-react";
import { badges } from "../data/badges";
import PlayerStatus from "./PlayerStatus";

const iconMap = { Compass, Medal, Sparkles, Star, GraduationCap, BookMarked, Mountain, Crown };

const describeCondition = (condition) => {
  if (condition.type === "level-complete") return `ผ่านด่านที่ ${condition.levelId}`;
  if (condition.type === "complete-set") return `ผ่านชุดที่ ${condition.setId} ให้ครบ`;
  if (condition.type === "stars") return `สะสมดาว ${condition.count} ดวง`;
  if (condition.type === "perfect-count") return `ได้ 3 ดาวใน ${condition.count} ด่าน`;
  if (condition.type === "all-perfect") return "ได้ 3 ดาวครบทั้ง 15 ด่าน";
  if (condition.type === "all-levels") return "ผ่านครบทั้ง 15 ด่าน";
  return "พิชิตภารกิจพิเศษ";
};

export default function AchievementPage({ progress, onBack }) {
  const earned = useMemo(() => new Set(progress.badges), [progress.badges]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const selectedEarned = selectedBadge ? earned.has(selectedBadge.id) : false;

  return (
    <motion.section className="scene dq-scene v2-scene v2-badge-scene" initial={{ opacity: 0, x: 35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -35 }}>
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="dq-container">
        <div className="v2-page-top">
          <motion.button className="v2-icon-button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onBack} aria-label="กลับ">
            <ArrowLeft size={23} />
          </motion.button>
          <div>
            <h1>หอตราเกียรติยศ</h1>
            <p>ตราแต่ละดวงได้มาจากการพิชิตภารกิจและสะสมดาวตลอดเส้นทาง</p>
          </div>
        </div>
        <PlayerStatus progress={progress} />

        <div className="v2-badge-summary">
          <strong>{progress.badges.length}/{badges.length}</strong>
          <span>ตราที่ได้รับแล้ว • ดาวรวม {progress.totalStars ?? 0}</span>
        </div>

        <div className="v2-badge-grid">
          {badges.map((badge, index) => {
            const Icon = iconMap[badge.icon] ?? Medal;
            const isEarned = earned.has(badge.id);
            return (
              <motion.button
                key={badge.id}
                className={`v2-achievement-medal dq-silk ${isEarned ? "earned" : "locked"}`}
                initial={{ opacity: 0, y: 25, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 150, damping: 18 }}
                whileHover={{ y: -6, rotate: isEarned ? 1 : 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="v2-medal-icon">{isEarned ? <Icon size={34} /> : <Lock size={32} />}</div>
                <h2>{badge.name}</h2>
                <p>{badge.description}</p>
                <span>{isEarned ? "ได้รับแล้ว" : "ยังไม่ปลดล็อก"}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedBadge ? (
            <motion.aside className={`v2-badge-detail ${selectedEarned ? "earned" : "locked"}`} initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}>
              <div>
                <p>{selectedEarned ? "ปลดล็อกสำเร็จ" : "เงื่อนไขการปลดล็อก"}</p>
                <h2>{selectedBadge.name}</h2>
                <span>{describeCondition(selectedBadge.condition)}</span>
              </div>
              <motion.button className="v2-button mini" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={() => setSelectedBadge(null)}>
                ปิดรายละเอียด
              </motion.button>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

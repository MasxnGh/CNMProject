import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/home/BottomNav.jsx";
import DailyRewardModal from "../components/home/DailyRewardModal.jsx";
import Stamp from "../components/Stamp.jsx";
import units from "../content/units.json";
import { useProgress } from "../lib/ProgressContext.jsx";
import { claimDailyReward } from "../lib/progress.js";
import TopBar from "../components/home/TopBar.jsx";
import "../styles/route-map.css";

const chapterStatus = (chapter, progress) => {
  if (chapter.draft) return "draft";
  const nodeIds = chapter.lessons.flatMap((lesson) => lesson.nodeIds);
  if (nodeIds.length === 0) return "draft";
  if (nodeIds.every((nodeId) => progress.completed.includes(nodeId))) return "cleared";
  if (nodeIds.some((nodeId) => progress.unlocked.includes(nodeId) || progress.completed.includes(nodeId))) return "current";
  return "locked";
};

/** The chapter-select grid ("หน้าเลือกบท") - the outer layer of the 2-layer
    navigation. Drilling into a chapter (/chapter/:chapterId) shows that
    chapter's own node path, which is what this page used to render directly
    for every chapter at once before the professor's second prompt asked for
    a HelloChinese-style chapter list first. */
export default function RouteHome() {
  const { progress, setProgress } = useProgress();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  const handleOpenReward = () => {
    const result = claimDailyReward(progress);
    if (!result) return;
    setRewardAmount(result.amount);
    setRewardOpen(true);
  };

  const handleClaimReward = () => {
    const result = claimDailyReward(progress);
    if (result) setProgress(result.progress);
    setRewardOpen(false);
  };

  return (
    <motion.div
      className="rm-page"
      initial={reduceMotion ? false : { opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
      transition={{ duration: reduceMotion ? 0.001 : 0.28, ease: "easeOut" }}
    >
      <TopBar progress={progress} onOpenReward={handleOpenReward} />
      <main className="rm-scroll">
        <div className="rm-chapter-grid">
          {units.map((chapter, index) => {
            const status = chapterStatus(chapter, progress);
            const nodeIds = chapter.lessons.flatMap((lesson) => lesson.nodeIds);
            const clearedCount = nodeIds.filter((nodeId) => progress.completed.includes(nodeId)).length;
            const interactive = status !== "locked" && status !== "draft";
            return (
              <motion.button
                type="button"
                key={chapter.id}
                className={`rm-chapter-card ${status}`}
                disabled={!interactive}
                onClick={() => interactive && navigate(`/chapter/${chapter.id}`)}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.03 }}
                whileTap={interactive ? { scale: 0.97 } : undefined}
              >
                <span className="rm-chapter-index">{index + 1}</span>
                <div className="rm-chapter-body">
                  <strong>{chapter.title}</strong>
                  {status === "draft" ? (
                    <span className="rm-chapter-meta">
                      <Clock3 size={14} /> เร็วๆ นี้
                    </span>
                  ) : status === "locked" ? (
                    <span className="rm-chapter-meta">
                      <Lock size={14} /> ยังไม่ปลดล็อค
                    </span>
                  ) : (
                    <span className="rm-chapter-meta">{clearedCount}/{nodeIds.length} ด่าน</span>
                  )}
                </div>
                {status === "cleared" ? <Stamp size={36} animate={false} label={`${chapter.title} ผ่านครบแล้ว`} /> : null}
              </motion.button>
            );
          })}
        </div>
      </main>
      <BottomNav />

      {rewardOpen ? (
        <DailyRewardModal amount={rewardAmount} onClaim={handleClaimReward} onClose={() => setRewardOpen(false)} />
      ) : null}
    </motion.div>
  );
}

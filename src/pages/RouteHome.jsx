import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/home/BottomNav.jsx";
import DailyRewardModal from "../components/home/DailyRewardModal.jsx";
import LessonStartSheet from "../components/home/LessonStartSheet.jsx";
import NodeRoute from "../components/home/NodeRoute.jsx";
import TopBar from "../components/home/TopBar.jsx";
import UnlockOfferModal from "../components/home/UnlockOfferModal.jsx";
import units from "../content/units.json";
import { getLevelById } from "../data/levels.js";
import {
  canPayToUnlock,
  getLessonForNode,
  isCheckpointEligible,
  isCheckpointAvailableToday,
  PAY_TO_UNLOCK_COST,
  payToUnlockLesson,
} from "../lib/checkpointProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import { claimDailyReward } from "../lib/progress.js";
import "../styles/route-map.css";

export default function RouteHome() {
  const { progress, setProgress } = useProgress();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockOfferNodeId, setUnlockOfferNodeId] = useState(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  const lessonByNodeId = useMemo(() => {
    const map = new Map();
    units.forEach((unit) => {
      unit.lessons.forEach((lesson, lessonIndex) => {
        lesson.nodeIds.forEach((nodeId) => {
          map.set(nodeId, { unit, lesson, lessonIndex });
        });
      });
    });
    return map;
  }, []);

  const nodeStatus = (nodeId) => {
    if (progress.completed.includes(nodeId)) return "cleared";
    if (progress.unlocked.includes(nodeId)) return "current";
    return "locked";
  };

  const handleSelectNode = (nodeId) => {
    setSelectedNode(nodeId);
  };

  const handleSelectLockedNode = (nodeId) => {
    setUnlockOfferNodeId(nodeId);
  };

  const handleStart = () => {
    if (selectedNode == null) return;
    navigate(`/lesson/${selectedNode}`);
  };

  const handleOpenReward = () => {
    const result = claimDailyReward(progress);
    // Not claimable right now (already claimed today) - the button is
    // disabled in that case, but stay defensive if state raced.
    if (!result) return;
    setRewardAmount(result.amount);
    setRewardOpen(true);
  };

  const handleClaimReward = () => {
    const result = claimDailyReward(progress);
    if (result) setProgress(result.progress);
    setRewardOpen(false);
  };

  const handleStartTest = () => {
    if (unlockOfferNodeId == null) return;
    const info = getLessonForNode(unlockOfferNodeId);
    if (!info) return;
    setUnlockOfferNodeId(null);
    navigate(`/unlock/${info.lesson.id}`);
  };

  const handlePayToUnlock = () => {
    if (unlockOfferNodeId == null) return;
    const info = getLessonForNode(unlockOfferNodeId);
    if (!info) return;
    const next = payToUnlockLesson(progress, info.lesson.id);
    if (next) setProgress(next);
    setUnlockOfferNodeId(null);
  };

  const selectedInfo = selectedNode != null ? lessonByNodeId.get(selectedNode) : null;
  const selectedLevel = selectedNode != null ? getLevelById(selectedNode) : null;
  const unlockOfferInfo = unlockOfferNodeId != null ? getLessonForNode(unlockOfferNodeId) : null;

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
        <NodeRoute
          units={units}
          nodeStatus={nodeStatus}
          onSelectNode={handleSelectNode}
          isEligibleLocked={(nodeId) => isCheckpointEligible(progress, nodeId)}
          onSelectLockedNode={handleSelectLockedNode}
        />
      </main>
      <BottomNav />

      <AnimatePresence>
        {selectedNode != null && selectedInfo ? (
          <LessonStartSheet
            title={selectedLevel?.title ?? `โหนด ${selectedNode}`}
            topic={selectedLevel?.topic ?? ""}
            lessonLabel={`${selectedInfo.unit.title} · บทที่ ${selectedInfo.lessonIndex + 1}/${selectedInfo.unit.lessons.length}`}
            onStart={handleStart}
            onClose={() => setSelectedNode(null)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {unlockOfferInfo ? (
          <UnlockOfferModal
            unit={unlockOfferInfo.unit}
            lesson={unlockOfferInfo.lesson}
            availableToday={isCheckpointAvailableToday(progress, unlockOfferInfo.lesson.id)}
            canPay={canPayToUnlock(progress)}
            payCost={PAY_TO_UNLOCK_COST}
            onStartTest={handleStartTest}
            onPay={handlePayToUnlock}
            onClose={() => setUnlockOfferNodeId(null)}
          />
        ) : null}
      </AnimatePresence>

      {rewardOpen ? (
        <DailyRewardModal amount={rewardAmount} onClaim={handleClaimReward} onClose={() => setRewardOpen(false)} />
      ) : null}
    </motion.div>
  );
}

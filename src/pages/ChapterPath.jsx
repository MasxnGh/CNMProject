import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LessonStartSheet from "../components/home/LessonStartSheet.jsx";
import NodeRoute from "../components/home/NodeRoute.jsx";
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
import "../styles/route-map.css";

/** The path within a single chapter - what "/" used to render for every
    chapter at once, before the chapter-select grid split it into its own
    screen per the professor's 2-layer navigation ("เลือกบท -> เส้นทางในบท"). */
export default function ChapterPath() {
  const { chapterId } = useParams();
  const { progress, setProgress } = useProgress();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockOfferNodeId, setUnlockOfferNodeId] = useState(null);

  const chapter = units.find((unit) => unit.id === chapterId);

  const lessonByNodeId = useMemo(() => {
    const map = new Map();
    if (!chapter) return map;
    chapter.lessons.forEach((lesson, lessonIndex) => {
      lesson.nodeIds.forEach((nodeId) => map.set(nodeId, { unit: chapter, lesson, lessonIndex }));
    });
    return map;
  }, [chapter]);

  if (!chapter) {
    return (
      <div className="scene dq-scene v2-scene grid place-items-center">
        <p>ไม่พบบทนี้</p>
        <button type="button" className="rm-button primary" style={{ maxWidth: "16rem" }} onClick={() => navigate("/")}>
          กลับหน้าเลือกบท
        </button>
      </div>
    );
  }

  const nodeStatus = (nodeId) => {
    if (progress.completed.includes(nodeId)) return "cleared";
    if (progress.unlocked.includes(nodeId)) return "current";
    return "locked";
  };

  const handleStart = () => {
    if (selectedNode == null) return;
    navigate(`/lesson/${selectedNode}`);
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
      initial={reduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
      transition={{ duration: reduceMotion ? 0.001 : 0.28, ease: "easeOut" }}
    >
      <main className="rm-scroll">
        <NodeRoute
          units={[chapter]}
          nodeStatus={nodeStatus}
          onSelectNode={setSelectedNode}
          isEligibleLocked={(nodeId) => isCheckpointEligible(progress, nodeId)}
          onSelectLockedNode={setUnlockOfferNodeId}
          onBack={() => navigate("/")}
        />
      </main>

      <AnimatePresence>
        {selectedNode != null && selectedInfo ? (
          <LessonStartSheet
            title={selectedLevel?.title ?? `โหนด ${selectedNode}`}
            topic={selectedLevel?.topic ?? ""}
            lessonLabel={`${chapter.title} · บทที่ ${selectedInfo.lessonIndex + 1}/${chapter.lessons.length}`}
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
    </motion.div>
  );
}

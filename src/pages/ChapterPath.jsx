import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UnlockModal from "../components/game/UnlockModal.jsx";
import Button from "../components/ui/Button.jsx";
import Lantern from "../components/ui/Lantern.jsx";
import Nav from "../components/ui/Nav.jsx";
import { buildNavItems } from "../components/ui/navItems.js";
import Sheet from "../components/ui/Sheet.jsx";
import Sky from "../components/ui/Sky.jsx";
import units from "../content/units.json";
import vocabList from "../content/vocab.json";
import { getLevelById } from "../data/levels.js";
import {
  buildCheckpointLevel,
  getLessonForNode,
  isCheckpointEligible,
  isCheckpointAvailableToday,
  PAY_TO_UNLOCK_COST,
  payToUnlockLesson,
} from "../lib/checkpointProgression.js";
import { playWord } from "../lib/audio.js";
import { iconForLessonType } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import "../styles/lantern-screens.css";

/** dujeen-quest-prototype.html #path - the rope of lanterns within a single
    chapter, locked to a 460px center column on desktop with the vocab/stamp
    panels filling the freed-up side space (grid-template-areas "a rope b"),
    same as the prototype. Replaces the old ink-wash NodeRoute/
    LessonStartSheet/UnlockOfferModal combo; the unlock-test/pay-to-unlock
    logic underneath is unchanged. */
export default function ChapterPath() {
  const { chapterId } = useParams();
  const { progress, setProgress } = useProgress();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [unlockOfferNodeId, setUnlockOfferNodeId] = useState(null);

  const chapter = units.find((unit) => unit.id === chapterId);

  const nodeEntries = useMemo(() => {
    if (!chapter) return [];
    return chapter.lessons.flatMap((lesson) => lesson.nodeIds.map((nodeId) => ({ nodeId })));
  }, [chapter]);

  const lessonIndexByNodeId = useMemo(() => {
    const map = new Map();
    chapter?.lessons.forEach((lesson, lessonIndex) => {
      lesson.nodeIds.forEach((nodeId) => map.set(nodeId, lessonIndex));
    });
    return map;
  }, [chapter]);

  const vocabForChapter = useMemo(() => {
    if (!chapter) return [];
    const lessonIds = new Set(chapter.lessons.map((lesson) => lesson.id));
    return vocabList.filter((entry) => lessonIds.has(entry.lessonId));
  }, [chapter]);

  if (!chapter) {
    return (
      <div className="lantern-app">
        <Sky />
        <main className="ln-chapters" style={{ paddingLeft: "var(--rail)", display: "grid", placeItems: "center", minHeight: "100vh" }}>
          <p>ไม่พบบทนี้</p>
          <Button onClick={() => navigate("/chapters")}>กลับหน้าเลือกบท</Button>
        </main>
      </div>
    );
  }

  const nodeIds = nodeEntries.map((entry) => entry.nodeId);
  const clearedCount = nodeIds.filter((nodeId) => progress.completed.includes(nodeId)).length;

  const nodeStatus = (nodeId) => {
    if (progress.completed.includes(nodeId)) return "done";
    if (progress.unlocked.includes(nodeId)) return "now";
    return "lock";
  };

  const handleTapNode = (nodeId, status, eligibleLocked) => {
    if (status === "lock") {
      if (eligibleLocked) setUnlockOfferNodeId(nodeId);
      return;
    }
    setSelectedNode(nodeId);
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

  const selectedLevel = selectedNode != null ? getLevelById(selectedNode) : null;
  const selectedLessonIndex = selectedNode != null ? lessonIndexByNodeId.get(selectedNode) ?? 0 : 0;
  const unlockOfferInfo = unlockOfferNodeId != null ? getLessonForNode(unlockOfferNodeId) : null;
  const unlockOfferAvailableToday = unlockOfferInfo ? isCheckpointAvailableToday(progress, unlockOfferInfo.lesson.id) : false;
  const unlockOfferLevel = unlockOfferInfo ? buildCheckpointLevel(unlockOfferInfo.lesson.id) : null;
  const unlockOfferLanterns = unlockOfferInfo
    ? unlockOfferInfo.lesson.nodeIds.map(() => ({ icon: iconForLessonType(unlockOfferInfo.lesson.type), label: unlockOfferInfo.lesson.title }))
    : [];

  return (
    <div className="lantern-app">
      <Sky />
      <main className="ln-chapters" style={{ paddingLeft: "var(--rail)" }}>
        <div className="ln-top">
          <button type="button" className="ln-back" onClick={() => navigate("/chapters")} aria-label="กลับหน้าเลือกบท">
            ‹
          </button>
          <div style={{ flex: 1 }}>
            <div className="ln-h2">{chapter.zh}</div>
            <div className="ln-h1">{chapter.title}</div>
          </div>
          <div className="ln-stat">
            {clearedCount}/{nodeIds.length}
          </div>
        </div>

        <div className="ln-pathGrid">
          <div className="ln-rope">
            {nodeEntries.map(({ nodeId }, index) => {
              const status = nodeStatus(nodeId);
              const eligibleLocked = status === "lock" && isCheckpointEligible(progress, nodeId);
              const interactive = status !== "lock" || eligibleLocked;
              const level = getLevelById(nodeId);
              const icon = iconForLessonType(chapter.lessons[lessonIndexByNodeId.get(nodeId) ?? 0]?.type);
              const statusLabel =
                status === "done"
                  ? "ผ่านแล้ว"
                  : status === "now"
                    ? "ด่านปัจจุบัน"
                    : eligibleLocked
                      ? "ล็อค - ทำแบบทดสอบข้ามด่านได้"
                      : "ล็อค";
              return (
                <div key={nodeId} className={`ln-node ${index % 2 ? "r" : "l"}`}>
                  <Lantern
                    state={status}
                    icon={icon}
                    label={chapter.lessons[lessonIndexByNodeId.get(nodeId) ?? 0]?.title ?? level?.title ?? `โหนด ${nodeId}`}
                    disabled={!interactive}
                    aria-label={`โหนด ${nodeId} - ${statusLabel}`}
                    onClick={() => handleTapNode(nodeId, status, eligibleLocked)}
                  />
                </div>
              );
            })}
          </div>

          <div className="ln-panel ln-panel-vocab">
            <h5>คำศัพท์ในบทนี้</h5>
            <div className="ln-chips">
              {vocabForChapter.map((entry) => (
                <button key={entry.id} type="button" className="ln-chip" onClick={() => playWord(entry.id)}>
                  <b>{entry.hanzi}</b>
                  <i>{entry.pinyin}</i>
                </button>
              ))}
            </div>
          </div>

          <div className="ln-panel ln-panel-stamp">
            <h5>ตราประทับที่สะสมได้</h5>
            <div className="ln-stampRow">
              {nodeIds.map((nodeId) => {
                const done = progress.completed.includes(nodeId);
                return (
                  <div key={nodeId} className={`ln-sm ${done ? "" : "off"}`}>
                    {done ? "过" : "?"}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Nav items={buildNavItems(navigate)} activeKey="learn" />

      <Sheet open={selectedNode != null} onClose={() => setSelectedNode(null)}>
        <small style={{ color: "var(--lantern)", fontWeight: 600 }}>
          {chapter.title} · บทที่ {selectedLessonIndex + 1}/{chapter.lessons.length}
        </small>
        <h3>{chapter.lessons[selectedLessonIndex]?.title ?? selectedLevel?.title ?? (selectedNode != null ? `โหนด ${selectedNode}` : "")}</h3>
        <p>{selectedLevel?.topic ?? ""}</p>
        <Button onClick={handleStart}>เริ่ม</Button>
        <Button variant="ghost" onClick={() => setSelectedNode(null)}>
          ยังไม่พร้อม
        </Button>
      </Sheet>

      <UnlockModal
        open={unlockOfferNodeId != null}
        lanterns={unlockOfferLanterns}
        questionCount={unlockOfferLevel?.questions.length ?? 0}
        attemptAvailable={unlockOfferAvailableToday}
        coins={progress.coins}
        payCost={PAY_TO_UNLOCK_COST}
        onStartTest={handleStartTest}
        onPayToUnlock={handlePayToUnlock}
        onClose={() => setUnlockOfferNodeId(null)}
      />
    </div>
  );
}

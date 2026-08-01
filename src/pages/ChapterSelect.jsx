import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Nav from "../components/ui/Nav.jsx";
import { buildNavItems } from "../components/ui/navItems.js";
import Sheet from "../components/ui/Sheet.jsx";
import Sky from "../components/ui/Sky.jsx";
import Stamp from "../components/ui/Stamp.jsx";
import units from "../content/units.json";
import { useProgress } from "../lib/ProgressContext.jsx";
import { claimDailyReward, isDailyRewardClaimed } from "../lib/progress.js";
import "../styles/lantern-screens.css";

const chapterStatus = (chapter, progress) => {
  if (chapter.draft) return "draft";
  const nodeIds = chapter.lessons.flatMap((lesson) => lesson.nodeIds);
  if (nodeIds.length === 0) return "draft";
  if (nodeIds.every((nodeId) => progress.completed.includes(nodeId))) return "cleared";
  if (nodeIds.some((nodeId) => progress.unlocked.includes(nodeId) || progress.completed.includes(nodeId))) return "current";
  return "locked";
};

/** dujeen-quest-prototype.html #chapters - the chapter-select grid, moved
    off "/" to make room for StartScreen (see the 2-question decision this
    session made before starting step 4). Same chapter data/status logic
    RouteHome.jsx used to run at "/" directly. */
export default function ChapterSelect() {
  const { progress, setProgress } = useProgress();
  const navigate = useNavigate();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const claimed = isDailyRewardClaimed(progress);

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
    <div className="lantern-app">
      <Sky />
      <main className="ln-chapters" style={{ paddingLeft: "var(--rail)" }}>
        <div className="ln-top">
          <div style={{ flex: 1 }}>
            <div className="ln-h2">แผนที่การเดินทาง</div>
            <div className="ln-h1">เลือกบทเรียน</div>
          </div>
          <button type="button" className="ln-stat ln-stat-tap" onClick={handleOpenReward} disabled={claimed} aria-label={claimed ? "รับรางวัลวันนี้แล้ว" : "เปิดกล่องรางวัลรายวัน"}>
            🧧
          </button>
          <div className="ln-stat">🏮 <b>{progress.coins}</b></div>
          <div className="ln-stat">🔥 <b>{progress.streak.count}</b></div>
        </div>

        <div className="ln-chapGrid">
          {units.map((chapter, index) => {
            const status = chapterStatus(chapter, progress);
            const nodeIds = chapter.lessons.flatMap((lesson) => lesson.nodeIds);
            const clearedCount = nodeIds.filter((nodeId) => progress.completed.includes(nodeId)).length;
            const full = status === "cleared";
            const interactive = status !== "locked" && status !== "draft";

            return (
              <div
                key={chapter.id}
                className={`ln-card ${status === "locked" || status === "draft" ? "lock" : ""} ${full ? "done" : ""}`}
                role="button"
                tabIndex={interactive ? 0 : -1}
                onClick={() => interactive && navigate(`/chapter/${chapter.id}`)}
                onKeyDown={(event) => {
                  if (interactive && (event.key === "Enter" || event.key === " ")) navigate(`/chapter/${chapter.id}`);
                }}
              >
                <div className="ln-num">{status === "locked" || status === "draft" ? "🔒" : index + 1}</div>
                <div className="ln-card-txt">
                  <div className="ln-card-zh">{chapter.zh ?? ""}</div>
                  <div className="ln-card-th">{chapter.title}</div>
                  <div className="ln-bar"><i style={{ width: `${nodeIds.length ? (clearedCount / nodeIds.length) * 100 : 0}%` }} /></div>
                  <div className="ln-cnt">
                    {status === "draft" ? "เร็วๆ นี้" : status === "locked" ? "จบบทก่อนหน้าเพื่อปลดล็อค" : `${clearedCount} / ${nodeIds.length} ด่าน`}
                  </div>
                </div>
                {full ? <Stamp size={44} className="ln-card-seal" /> : null}
              </div>
            );
          })}
        </div>
      </main>

      <Nav items={buildNavItems(navigate)} activeKey="learn" />

      <Sheet open={rewardOpen} onClose={() => setRewardOpen(false)}>
        <h3>รางวัลประจำวัน</h3>
        <p>ได้รับ +{rewardAmount} เหรียญจากการเข้าเล่นต่อเนื่อง {progress.streak.count} วัน</p>
        <Button onClick={handleClaimReward}>รับรางวัล</Button>
      </Sheet>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Nav from "../components/ui/Nav.jsx";
import { buildNavItems } from "../components/ui/navItems.js";
import Sky from "../components/ui/Sky.jsx";
import units from "../content/units.json";
import { useProgress } from "../lib/ProgressContext.jsx";
import "../styles/lantern-screens.css";

const chapterStatus = (chapter, progress) => {
  if (chapter.draft) return "draft";
  const nodeIds = chapter.lessons.flatMap((lesson) => lesson.nodeIds);
  if (nodeIds.length === 0) return "draft";
  if (nodeIds.every((nodeId) => progress.completed.includes(nodeId))) return "cleared";
  if (nodeIds.some((nodeId) => progress.unlocked.includes(nodeId) || progress.completed.includes(nodeId))) return "current";
  return "locked";
};

/** dujeen-quest-prototype.html #start - the splash screen. "เล่นต่อจากเดิม"
    jumps straight into whichever chapter the player is mid-way through
    (matching real progress instead of the prototype's placeholder alert). */
export default function StartScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();

  const handleContinue = () => {
    const current = units.find((chapter) => chapterStatus(chapter, progress) === "current");
    navigate(current ? `/chapter/${current.id}` : "/chapters");
  };

  return (
    <div className="lantern-app">
      <Sky />
      <main className="ln-start" style={{ paddingLeft: "var(--rail)" }}>
        <div className="ln-hero">
          <div className="ln-bigLantern">
            <div className="ln-bigLantern-cap" />
            <div className="ln-bigLantern-body" />
            <div className="ln-bigLantern-zi">中</div>
            <div className="ln-bigLantern-base" />
            <div className="ln-bigLantern-tassel" />
          </div>
          <div>
            <div className="ln-title">杜津</div>
            <div className="ln-subtitle">Dujeen Quest</div>
            <div className="ln-tag">จุดโคมทีละดวง จนพูดจีนได้ทั้งเมือง</div>
            <div className="ln-startBtns">
              <Button onClick={() => navigate("/chapters")}>เริ่มเกม</Button>
              <Button variant="ghost" onClick={handleContinue}>เล่นต่อจากเดิม</Button>
            </div>
          </div>
        </div>
      </main>

      <Nav items={buildNavItems(navigate)} activeKey="learn" />
    </div>
  );
}

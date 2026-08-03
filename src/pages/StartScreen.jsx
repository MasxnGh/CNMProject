import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { useProgress } from "../lib/progress.js";
import "./StartScreen.css";

export default function StartScreen() {
  const navigate = useNavigate();
  const [progress] = useProgress();
  const hasProgress = progress.completedLessons.length > 0 || progress.completedChapters.length > 0;

  return (
    <div className="hero">
      <div className="bigLantern">
        <div className="cap" />
        <div className="body" />
        <div className="zi">中</div>
        <div className="base" />
        <div className="tassel" />
      </div>
      <div>
        <div className="title">杜津</div>
        <div className="subtitle">Dujeen Quest</div>
        <div className="tag">จุดโคมทีละดวง จนพูดจีนได้ทั้งเมือง</div>
        <div className="startBtns">
          <Button variant="primary" onClick={() => navigate("/chapters")}>
            เริ่มเกม
          </Button>
          <Button variant="ghost" disabled={!hasProgress} onClick={() => navigate("/chapters")}>
            เล่นต่อจากเดิม
          </Button>
        </div>
      </div>
    </div>
  );
}

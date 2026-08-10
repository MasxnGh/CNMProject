import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Kite from "../../components/ui/Kite.jsx";
import CATEGORIES from "../../content/categories.json";
import CONFIG from "../../content/config.json";
import { VOCAB_ICON_KEYS } from "../../lib/art.js";

const STATS = [
  { value: CONFIG.difficulties.length, label: "ระดับความยาก" },
  { value: CATEGORIES.length, label: "หมวดคำศัพท์" },
  { value: VOCAB_ICON_KEYS.length, label: "ภาพวาดต้นฉบับ" },
  { value: CATEGORIES.length * CONFIG.difficulties.length, label: "กระดานคะแนน" },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <header className="hero">
      <div>
        <Kite c1="#CE4430" c2="#8E2415" className="heroKite" />
        <h1>纸鸢</h1>
        <div className="en">ZHI YUAN</div>
        <p className="ld">
          เกมฝึกคำศัพท์จีนระดับ <b style={{ fontWeight: 500, color: "var(--verm)" }}>HSK 1</b>
          สำหรับผู้เริ่มต้น เน้นคำที่คนจีนใช้จริงในชีวิตประจำวัน
          <br />
          คำจะลอยขึ้นเป็นว่าวพร้อมภาพประกอบ ตอบให้ทันก่อนว่าวลอยพ้นฟ้า
        </p>
        <div className="cta">
          <Button pulse onClick={() => navigate("/name")}>
            เริ่มเล่นเลย
          </Button>
          <Button variant="ghost" onClick={() => document.getElementById("how")?.scrollIntoView()}>
            ดูวิธีเล่นก่อน
          </Button>
        </div>
        <div className="hstat">
          {STATS.map((s) => (
            <div key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="shint">เลื่อนลง ↓</div>
    </header>
  );
}

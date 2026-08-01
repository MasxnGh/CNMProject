import { useState } from "react";
import ComboBadge from "../components/game/ComboBadge.jsx";
import FeedbackBar from "../components/game/FeedbackBar.jsx";
import StampBurst from "../components/game/StampBurst.jsx";
import Button from "../components/ui/Button.jsx";
import Lantern from "../components/ui/Lantern.jsx";
import Nav from "../components/ui/Nav.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Sky from "../components/ui/Sky.jsx";
import Stamp from "../components/ui/Stamp.jsx";

const buildNavItems = (setNavKey) => [
  { key: "learn", icon: "🏮", label: "เรียน", onClick: () => setNavKey("learn") },
  { key: "review", icon: "🎯", label: "ทวน", onClick: () => setNavKey("review") },
  { key: "me", icon: "🧧", label: "ฉัน", onClick: () => setNavKey("me") },
];

/** All six base components in one place - resize the window to see the
    720px/1080px breakpoints kick in on Nav (bottom bar -> left rail) and
    Sheet (bottom sheet -> centered modal). */
export default function Styleguide() {
  const [navKey, setNavKey] = useState("learn");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stampPopOpen, setStampPopOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [stampBurstKey, setStampBurstKey] = useState(null);
  const [combo, setCombo] = useState(0);

  const triggerStampPop = () => {
    setStampPopOpen(true);
    window.setTimeout(() => setStampPopOpen(false), 900);
  };

  return (
    <div className="lantern-app" style={{ paddingLeft: "var(--rail)" }}>
      <Sky />
      <main style={{ position: "relative", zIndex: 1, padding: "24px var(--pad) 108px", maxWidth: 900 }}>
        <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 32, marginBottom: 24 }}>Styleguide</h1>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 12, color: "var(--dim)", fontSize: 13, letterSpacing: 1 }}>BUTTON</h2>
          <div style={{ display: "grid", gap: 12, maxWidth: 300 }}>
            <Button variant="primary">เริ่มเกม</Button>
            <Button variant="ghost">เล่นต่อจากเดิม</Button>
            <Button variant="primary" disabled>ตรวจคำตอบ</Button>
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 12, color: "var(--dim)", fontSize: 13, letterSpacing: 1 }}>LANTERN</h2>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Lantern state="done" icon="学" label="ทักทาย" />
            <Lantern state="now" icon="学" label="บอกชื่อตัวเอง" />
            <Lantern state="lock" icon="练" label="ทวนการบอกชื่อ" />
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 12, color: "var(--dim)", fontSize: 13, letterSpacing: 1 }}>STAMP</h2>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Stamp size={64} />
            <Button variant="ghost" style={{ width: "auto", display: "inline-block", padding: "10px 18px" }} onClick={triggerStampPop}>
              ทดลองตราประทับเด้งเข้า
            </Button>
          </div>
          {stampPopOpen ? (
            <div className="ln-stamp-overlay">
              <Stamp size={150} />
            </div>
          ) : null}
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 12, color: "var(--dim)", fontSize: 13, letterSpacing: 1 }}>GAMEPLAY (Prompt A)</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Button
              style={{ width: "auto", display: "inline-block", padding: "10px 18px" }}
              onClick={() => {
                setFeedback("correct");
                setFeedbackKey((key) => key + 1);
                setStampBurstKey((key) => (key ?? 0) + 1);
                setCombo((count) => count + 1);
              }}
            >
              ยิง feedback ถูก
            </Button>
            <Button
              variant="danger"
              style={{ width: "auto", display: "inline-block", padding: "10px 18px" }}
              onClick={() => {
                setFeedback("wrong");
                setFeedbackKey((key) => key + 1);
                setCombo(0);
              }}
            >
              ยิง feedback ผิด
            </Button>
            <Button
              variant="ghost"
              style={{ width: "auto", display: "inline-block", padding: "10px 18px" }}
              onClick={() => setFeedback(null)}
            >
              ปิด feedback
            </Button>
          </div>

          <div style={{ position: "relative", minHeight: 90, background: "var(--night2)", borderRadius: 18, padding: 16, marginBottom: 16 }}>
            <p style={{ color: "var(--dim)", fontSize: 13 }}>กล่องนี้จำลองพื้นที่ภารกิจ - คอมโบแสดงมุมขวาบนตรงนี้ (ต้อง x3 ขึ้นไปถึงจะเห็น, x5 เรืองแสง, x10 มีประกาย)</p>
            <ComboBadge combo={combo} />
          </div>

          {feedback ? (
            <FeedbackBar
              key={feedbackKey}
              variant={feedback}
              answer={{ hanzi: "你好", pinyin: "nǐ hǎo", thai: "สวัสดี", audioId: "v_nihao" }}
              tokens={feedback === "wrong" ? [
                { hanzi: "你", thai: "คุณ" },
                { hanzi: "好", thai: "ดี" },
              ] : undefined}
              onContinue={() => setFeedback(null)}
              onReportError={() => window.alert("รายงานข้อผิดพลาดแล้ว (ตัวอย่าง)")}
            />
          ) : null}

          <StampBurst trigger={stampBurstKey} />
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 12, color: "var(--dim)", fontSize: 13, letterSpacing: 1 }}>SHEET</h2>
          <Button style={{ maxWidth: 240 }} onClick={() => setSheetOpen(true)}>เปิด Sheet</Button>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
            <h3>ด่านนี้ยังล็อคอยู่</h3>
            <p>ตัวอย่างเนื้อหาใน Sheet - เลื่อนขึ้นจากล่างบนมือถือ กลางจอบนแท็บเล็ตขึ้นไป</p>
            <Button onClick={() => setSheetOpen(false)}>เข้าใจแล้ว</Button>
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>ยังไม่พร้อม</Button>
          </Sheet>
        </section>

        <section>
          <h2 style={{ marginBottom: 12, color: "var(--dim)", fontSize: 13, letterSpacing: 1 }}>NAV</h2>
          <p style={{ color: "var(--dim)", fontSize: 14 }}>ย่อหน้าต่างให้แคบกว่า 1080px จะเห็นแถบล่าง กว้างกว่านั้นจะย้ายไปแถบซ้าย</p>
        </section>
      </main>

      <Nav items={buildNavItems(setNavKey)} activeKey={navKey} />
    </div>
  );
}

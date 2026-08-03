import { useState } from "react";
import Button from "../components/ui/Button.jsx";
import Lantern from "../components/ui/Lantern.jsx";
import Stamp from "../components/ui/Stamp.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import WriteCharacter from "../components/exercises/WriteCharacter.jsx";
import "../components/exercises/exercises.css";
import "./Lesson.css";

const section = {
  padding: "24px 0",
  borderBottom: "1px solid var(--night3)",
};

const heading = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: "20px",
  marginBottom: "14px",
  color: "var(--lantern)",
};

const row = {
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
  alignItems: "flex-end",
};

export default function Styleguide() {
  const [stampShown, setStampShown] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [writeKey, setWriteKey] = useState(0);
  const [writeResult, setWriteResult] = useState("");

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "32px", marginBottom: "6px" }}>
        杜津 Styleguide
      </h1>
      <p style={{ color: "var(--dim)", marginBottom: "24px", lineHeight: 1.6 }}>
        ย่อ/ขยายหน้าต่างเบราว์เซอร์เพื่อดู breakpoint: มือถือ (&lt;720px) → แท็บเล็ต (≥720px, --pad เป็น 32px)
        → คอมพิวเตอร์ (≥1080px, --rail เป็น 104px แถบเมนูย้ายไปด้านซ้าย)
      </p>

      <section style={section}>
        <h2 style={heading}>Button</h2>
        <div style={{ ...row, maxWidth: "320px", flexDirection: "column" }}>
          <Button variant="primary">ปุ่มหลัก (primary)</Button>
          <Button variant="ghost">ปุ่มรอง (ghost)</Button>
          <Button variant="primary" disabled>
            ปุ่มปิดใช้งาน (disabled)
          </Button>
        </div>
      </section>

      <section style={section}>
        <h2 style={heading}>Lantern</h2>
        <div style={row}>
          <Lantern state="lock" icon="学" label="ยังไม่ปลดล็อค" />
          <Lantern state="now" icon="学" label="ด่านปัจจุบัน" onClick={() => {}} />
          <Lantern state="done" icon="练" label="ผ่านแล้ว" onClick={() => {}} />
        </div>
      </section>

      <section style={section}>
        <h2 style={heading}>Stamp</h2>
        <div style={{ maxWidth: "220px" }}>
          <Button variant="primary" onClick={() => setStampShown(true)}>
            ประทับตรา
          </Button>
        </div>
        <Stamp show={stampShown} onDone={() => setStampShown(false)} />
      </section>

      <section style={section}>
        <h2 style={heading}>Sheet</h2>
        <div style={{ maxWidth: "220px" }}>
          <Button variant="primary" onClick={() => setSheetOpen(true)}>
            เปิด Sheet
          </Button>
        </div>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="ด่านนี้ยังล็อคอยู่"
          description="ตัวอย่างข้อความอธิบายใน bottom sheet บนมือถือ / กล่องกลางจอบนแท็บเล็ตขึ้นไป"
        >
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            ตกลง
          </Button>
          <Button variant="ghost" onClick={() => setSheetOpen(false)}>
            ยังไม่พร้อม
          </Button>
        </Sheet>
      </section>

      <section style={section}>
        <h2 style={heading}>WriteCharacter</h2>
        <div className="quizGrid" style={{ maxWidth: "640px" }}>
          <WriteCharacter
            key={writeKey}
            exercise={{ type: "write_character", targetId: "v_nihao" }}
            onResult={(result) => setWriteResult(JSON.stringify(result))}
            onUnavailable={() => setWriteResult("unavailable")}
          />
        </div>
        {writeResult && <p style={{ color: "var(--dim)", marginTop: "10px" }}>ผลล่าสุด: {writeResult}</p>}
        <Button
          variant="ghost"
          style={{ maxWidth: "220px", marginTop: "10px" }}
          onClick={() => {
            setWriteResult("");
            setWriteKey((k) => k + 1);
          }}
        >
          รีเซ็ตตัวอย่าง
        </Button>
      </section>

      <section style={{ ...section, borderBottom: "none" }}>
        <h2 style={heading}>Nav</h2>
        <p style={{ color: "var(--dim)" }}>
          แถบเมนูอยู่ด้านล่างของหน้าจอ (มือถือ/แท็บเล็ต) และย้ายไปด้านซ้ายเมื่อจอกว้าง ≥1080px
        </p>
      </section>
    </div>
  );
}

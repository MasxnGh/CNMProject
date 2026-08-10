import { useState } from "react";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Chip from "../components/ui/Chip.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Toast from "../components/ui/Toast.jsx";
import Illustration from "../components/ui/Illustration.jsx";
import { AVA, AVATAR_KEYS, VOCAB_ICON_KEYS } from "../lib/art.js";
import CATEGORIES from "../content/categories.json";
import "./StyleGuide.css";

const COLOR_GROUPS = [
  { label: "พื้นหลัง", tokens: ["--ivory", "--shell", "--sand", "--line", "--card"] },
  { label: "ตัวอักษร", tokens: ["--ink", "--ink2", "--ink3"] },
  { label: "หยก Celadon", tokens: ["--cel-l", "--cel", "--cel-d"] },
  { label: "แดงชาด Vermilion", tokens: ["--verm-l", "--verm", "--verm-d"] },
  { label: "ทอง Gold", tokens: ["--gold-l", "--gold", "--gold-d"] },
  { label: "คราม Lapis", tokens: ["--lapis-l", "--lapis", "--lapis-d"] },
  { label: "ม่วงพลัม Plum", tokens: ["--plum-l", "--plum", "--plum-d"] },
];

export default function StyleGuide() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  function fireToast() {
    setToastOpen(true);
    clearTimeout(fireToast._t);
    fireToast._t = setTimeout(() => setToastOpen(false), 1800);
  }

  return (
    <div className="sg">
      <div className="sg-head">
        <h1>纸鸢 Style Guide</h1>
        <p>ระบบดีไซน์ของ Zhi Yuan — ใช้หน้านี้ตรวจสี ปุ่ม และภาพประกอบทุกไฟล์</p>
      </div>

      <section className="sg-section">
        <h2>สี</h2>
        <p className="sg-note">ทุกสีอ้างอิงจาก CSS variable ใน theme.css</p>
        {COLOR_GROUPS.map((g) => (
          <div key={g.label} style={{ marginBottom: 18 }}>
            <div className="sg-note" style={{ marginBottom: 8 }}>{g.label}</div>
            <div className="sg-swatches">
              {g.tokens.map((t) => (
                <div className="sg-swatch" key={t}>
                  <div className="fill" style={{ background: `var(${t})` }} />
                  <div className="lbl">{t}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="sg-section">
        <h2>ปุ่ม (Button)</h2>
        <p className="sg-note">variant: primary / ghost / gold / cel · size: md / sm</p>
        <div className="sg-row">
          <Button>primary</Button>
          <Button variant="ghost">ghost</Button>
          <Button variant="gold">gold</Button>
          <Button variant="cel">cel</Button>
          <Button disabled>disabled</Button>
        </div>
        <div className="sg-row">
          <Button size="sm">primary sm</Button>
          <Button variant="ghost" size="sm">ghost sm</Button>
          <Button variant="gold" size="sm">gold sm</Button>
          <Button variant="cel" size="sm">cel sm</Button>
        </div>
        <div className="sg-row">
          <Button pulse>pulse</Button>
        </div>
        <div className="sg-row" style={{ maxWidth: 320 }}>
          <Button block>block</Button>
        </div>
      </section>

      <section className="sg-section">
        <h2>Card / Chip</h2>
        <div className="sg-row">
          <Card style={{ width: 220 }}>
            <div className="zh" style={{ fontSize: 22 }}>纸鸢</div>
            <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6 }}>Card ปกติ</p>
          </Card>
          <Card padding="sm" style={{ width: 180 }}>
            <div style={{ fontSize: 13 }}>Card padding sm</div>
          </Card>
        </div>
        <div className="sg-row">
          <Chip>ป้ายพื้นฐาน</Chip>
          {CATEGORIES.slice(0, 5).map((c) => (
            <Chip key={c.id} c={c.color} cl={c.colorLight}>{c.zh} {c.th}</Chip>
          ))}
        </div>
      </section>

      <section className="sg-section">
        <h2>Sheet / Toast</h2>
        <div className="sg-row">
          <Button variant="ghost" onClick={() => setSheetOpen(true)}>เปิด Sheet</Button>
          <Button variant="ghost" onClick={fireToast}>แสดง Toast</Button>
        </div>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="ตัวอย่าง Sheet">
          <p>overlay กลางจอสำหรับยืนยันหรือแจ้งเตือน</p>
          <Sheet.Actions>
            <Button block onClick={() => setSheetOpen(false)}>ตกลง</Button>
            <Button block variant="ghost" onClick={() => setSheetOpen(false)}>ยกเลิก</Button>
          </Sheet.Actions>
        </Sheet>
        <Toast open={toastOpen} message="บันทึกแล้ว" />
      </section>

      <section className="sg-section">
        <h2>ตัวละคร (Avatars)</h2>
        <div className="sg-gallery">
          {AVATAR_KEYS.map((k) => (
            <div className="sg-gitem" key={k}>
              <span
                style={{ width: 48, height: 48 }}
                dangerouslySetInnerHTML={{ __html: AVA[k] }}
              />
              <span className="key">{k}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sg-section">
        <h2>
          ภาพประกอบคำศัพท์ <span className="sg-count">{VOCAB_ICON_KEYS.length}</span> ไฟล์
        </h2>
        <p className="sg-note">
          ยังไม่มีไฟล์ภาพถ่าย .webp จึงแสดงชั้นที่ 2 (SVG) ของทุกคำ — ตรวจว่าครบและชื่อไฟล์ (key) ถูกต้อง
        </p>
        <div className="sg-gallery">
          {VOCAB_ICON_KEYS.map((k) => (
            <div className="sg-gitem" key={k}>
              <Illustration vocabKey={k} category="obj" size={56} alt={k} />
              <span className="key">{k}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sg-section">
        <h2>ชั้นที่ 3 — ตัวอักษรบนพื้นสีหมวด (ไม่มีภาพเลย)</h2>
        <p className="sg-note">กรณีไม่มีทั้งภาพถ่ายและ SVG จะ fallback มาที่ตัวอักษรจีนบนพื้นสีของหมวด</p>
        <div className="sg-gallery">
          {CATEGORIES.map((c) => (
            <div className="sg-gitem" key={c.id}>
              <Illustration category={c.id} char={c.zh[0]} size={56} />
              <span className="key">{c.id}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

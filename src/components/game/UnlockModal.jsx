import Button from "../ui/Button.jsx";
import Lantern from "../ui/Lantern.jsx";
import Sheet from "../ui/Sheet.jsx";
import "../../styles/game-unlock-modal.css";

/**
 * dujeen-quest-gameplay-prompts.md Prompt E #1 - tapping an unlit-but-
 * eligible lantern on the chapter path opens this. Presentational only
 * (like Result.jsx): the caller supplies already-computed progress state
 * rather than this component reaching into any particular progress store,
 * so it isn't coupled to either the old checkpointProgression.js model or
 * whatever eventually powers the new engine's content.
 *
 * lanterns: [{ icon, label }] - the (still unlit) nodes being offered.
 * questionCount: how many questions the combined test draws - real lessons
 * are rarely exactly 3 nodes/15 questions like the prototype's static demo
 * text, so both the heading and the copy scale with lanterns.length/
 * questionCount instead of hardcoding "three"/"15".
 */
export default function UnlockModal({ open, lanterns, questionCount, attemptAvailable, coins, payCost, onStartTest, onPayToUnlock, onClose }) {
  const canPay = coins >= payCost;
  const coinsShort = Math.max(0, payCost - coins);
  const count = lanterns?.length ?? 0;

  return (
    <Sheet open={open} onClose={onClose}>
      <h3>จุดโคม {count} ดวงรวดเดียว</h3>
      <div className="unlock-modal-lanterns">
        {lanterns?.map((lantern, index) => (
          <Lantern key={index} state="lock" icon={lantern.icon} label={lantern.label} />
        ))}
      </div>
      <p>
        ทำแบบทดสอบรวม {questionCount} ข้อจากทั้ง {count} ด่านนี้ - ตอบให้ถูกจนจบ ผิดได้ไม่เกิน 2 ข้อ เพื่อจุดโคมทั้ง {count} ดวงพร้อมกัน
      </p>

      {attemptAvailable ? (
        <Button onClick={onStartTest}>เริ่มทำแบบทดสอบ</Button>
      ) : (
        <>
          <p style={{ color: "var(--dim)" }}>ใช้สิทธิ์ทำแบบทดสอบวันนี้ไปแล้ว พรุ่งนี้ลองใหม่ได้</p>
          <Button onClick={onPayToUnlock} disabled={!canPay}>
            จ่าย {payCost} เหรียญ ปลดล็อคทันที
          </Button>
          {!canPay ? <p style={{ color: "var(--dim)" }}>เหรียญไม่พอ ขาดอีก {coinsShort} เหรียญ</p> : null}
        </>
      )}

      <Button variant="ghost" onClick={onClose}>
        ยังไม่พร้อม
      </Button>
    </Sheet>
  );
}

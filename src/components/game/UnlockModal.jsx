import Sheet from "../ui/Sheet.jsx";
import Lantern from "../ui/Lantern.jsx";
import Button from "../ui/Button.jsx";
import { todayLocal } from "../../lib/progressActions.js";
import "./UnlockModal.css";

const DAILY_LIMIT = 1;
export const PAY_COST = 50;

export default function UnlockModal({ open, onClose, chapterId, lessons, progress, onStart, onPay }) {
  const usedToday = progress.unlockTestUsed[chapterId] === todayLocal();
  const attemptsLeft = usedToday ? 0 : DAILY_LIMIT;
  const canPay = progress.coins >= PAY_COST;
  const coinsShort = PAY_COST - progress.coins;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="จุดโคมสามดวงรวดเดียว"
      description={`ตอบ 15 ข้อจาก ${lessons.length} ด่านที่ข้าม ผิดได้ไม่เกิน 2 ข้อ ผ่านแล้วปลดล็อคทั้งหมดพร้อมกัน`}
    >
      <div className="unlockLamps">
        {lessons.map((lesson) => (
          <Lantern key={lesson.id} state="lock" icon="学" label={lesson.title} />
        ))}
      </div>

      {attemptsLeft > 0 ? (
        <>
          <p className="unlockNote">วันนี้ทำได้อีก {attemptsLeft} ครั้ง</p>
          <Button variant="primary" onClick={onStart}>
            ทำบททดสอบรวม
          </Button>
        </>
      ) : (
        <>
          <p className="unlockNote">วันนี้ทำครบแล้ว จ่าย {PAY_COST} เหรียญเพื่อทำอีกครั้งได้</p>
          <Button variant="primary" disabled={!canPay} onClick={onPay}>
            {canPay ? `จ่าย ${PAY_COST} เหรียญ` : `ขาดอีก ${coinsShort} เหรียญ`}
          </Button>
        </>
      )}
      <Button variant="ghost" onClick={onClose}>
        ยังไม่พร้อม
      </Button>
    </Sheet>
  );
}

import { motion } from "framer-motion";
import { Coins, KeyRound, X } from "lucide-react";

export default function UnlockOfferModal({ unit, lesson, availableToday, canPay, payCost, onStartTest, onPay, onClose }) {
  return (
    <div className="rm-sheet-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="rm-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`ข้ามไป ${lesson.title} เลยไหม`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="rm-navbutton" style={{ marginLeft: "auto" }} onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>
        <KeyRound size={32} color="var(--v2-gold, #C08A34)" />
        <h2>ข้ามไป {lesson.title} เลยไหม?</h2>
        <p>
          ทำแบบทดสอบรวมความรู้ {lesson.nodeIds.length} ด่านของ {unit.title} — ตอบให้ถูกจนจบ ผิดได้ไม่เกิน 2 ข้อ
          เพื่อปลดล็อคทั้งหมดพร้อมกัน
        </p>

        {availableToday ? (
          <button type="button" className="rm-button primary" onClick={onStartTest}>
            เริ่มทำแบบทดสอบ
          </button>
        ) : (
          <>
            <p style={{ color: "var(--v2-muted, rgba(248,240,219,0.72))" }}>ใช้สิทธิ์ทำแบบทดสอบวันนี้ไปแล้ว พรุ่งนี้ลองใหม่ได้</p>
            <button type="button" className="rm-button primary" onClick={onPay} disabled={!canPay}>
              <Coins size={18} />
              จ่าย {payCost} เหรียญ ปลดล็อคทันที
            </button>
            {!canPay ? <p style={{ color: "var(--v2-muted, rgba(248,240,219,0.72))" }}>เหรียญไม่พอ</p> : null}
          </>
        )}
      </motion.div>
    </div>
  );
}

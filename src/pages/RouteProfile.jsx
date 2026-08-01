import { Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AchievementPage from "../components/AchievementPage.jsx";
import Button from "../components/ui/Button.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import { defaultProgress } from "../lib/progress.js";
import { toLegacyProgressView } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";
import "../styles/profile-settings.css";

/**
 * dujeen-quest-gameplay-prompts.md Prompt F - "ฉัน" reuses the existing
 * stamp/badge hall (AchievementPage, also rendered by /classic) for
 * badges+stats, since that content already exists and shouldn't be
 * duplicated. The sound toggle + reset-progress controls this prompt asks
 * for are new-engine-only, so they live behind a floating settings button
 * here rather than inside AchievementPage itself (leaving /classic's copy
 * untouched). Reset needs two separate confirm steps before it touches
 * anything, since it's an irreversible localStorage wipe.
 */
export default function RouteProfile() {
  const navigate = useNavigate();
  const { progress, setProgress } = useProgress();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetStep, setResetStep] = useState(0);

  const closeSettings = () => {
    setSettingsOpen(false);
    setResetStep(0);
  };

  const toggleSound = () => setProgress((current) => ({ ...current, soundEnabled: !current.soundEnabled }));

  const confirmReset = () => {
    setProgress({ ...defaultProgress });
    closeSettings();
  };

  return (
    <>
      <AchievementPage progress={toLegacyProgressView(progress)} onBack={() => navigate("/chapters")} />

      <button type="button" className="profile-settings-fab" onClick={() => setSettingsOpen(true)} aria-label="ตั้งค่า">
        <Settings size={22} />
      </button>

      <Sheet open={settingsOpen} onClose={closeSettings}>
        <h3>ตั้งค่า</h3>

        <div className="profile-sound-row">
          <span>เสียง</span>
          <button
            type="button"
            className={`profile-sound-switch ${progress.soundEnabled ? "is-on" : ""}`}
            onClick={toggleSound}
            role="switch"
            aria-checked={progress.soundEnabled}
            aria-label="เปิด/ปิดเสียง"
          >
            <span className="profile-sound-knob" />
          </button>
        </div>

        {resetStep === 0 ? (
          <Button variant="danger" onClick={() => setResetStep(1)}>
            ล้างข้อมูลความคืบหน้า
          </Button>
        ) : resetStep === 1 ? (
          <>
            <p>ระบบจะล้างด่านที่ปลดล็อก เหรียญ ตรา และคำที่เคยตอบผิดทั้งหมดในเครื่องนี้</p>
            <Button variant="danger" onClick={() => setResetStep(2)}>
              ยืนยันต่อ
            </Button>
            <Button variant="ghost" onClick={() => setResetStep(0)}>
              ยกเลิก
            </Button>
          </>
        ) : (
          <>
            <p>แน่ใจจริง ๆ ใช่ไหม การกระทำนี้ย้อนกลับไม่ได้</p>
            <Button variant="danger" onClick={confirmReset}>
              ยืนยัน ล้างข้อมูลทั้งหมด
            </Button>
            <Button variant="ghost" onClick={() => setResetStep(0)}>
              ยกเลิก
            </Button>
          </>
        )}

        <Button variant="ghost" onClick={closeSettings}>
          ปิด
        </Button>
      </Sheet>
    </>
  );
}

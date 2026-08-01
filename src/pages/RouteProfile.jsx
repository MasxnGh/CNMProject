import { useNavigate } from "react-router-dom";
import AchievementPage from "../components/AchievementPage.jsx";
import { toLegacyProgressView } from "../lib/nodeProgression.js";
import { useProgress } from "../lib/ProgressContext.jsx";

/** "ฉัน" reuses the existing stamp/badge hall as a lightweight profile page. */
export default function RouteProfile() {
  const navigate = useNavigate();
  const { progress } = useProgress();

  return <AchievementPage progress={toLegacyProgressView(progress)} onBack={() => navigate("/chapters")} />;
}

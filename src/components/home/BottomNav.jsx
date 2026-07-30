import { BookOpen, Dumbbell, GraduationCap, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { key: "learn", label: "เรียนรู้", icon: GraduationCap, enabled: true, path: "/" },
  { key: "practice", label: "ฝึกฝน", icon: Dumbbell, enabled: true, path: "/practice" },
  { key: "articles", label: "บทความ", icon: BookOpen, enabled: false },
  { key: "chat", label: "สนทนา", icon: MessageCircle, enabled: false },
  { key: "profile", label: "ฉัน", icon: User, enabled: false },
];

/** "เรียนรู้" and "ฝึกฝน" are wired up; the rest are placeholders for later phases. */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="rm-bottomnav" aria-label="เมนูหลัก">
      {TABS.map((tab) => {
        const active = tab.path === location.pathname;
        return (
          <button
            key={tab.key}
            type="button"
            className={`rm-navbutton ${active ? "active" : ""}`}
            disabled={!tab.enabled}
            aria-current={active ? "page" : undefined}
            onClick={() => tab.enabled && navigate(tab.path)}
          >
            <tab.icon size={22} aria-hidden="true" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

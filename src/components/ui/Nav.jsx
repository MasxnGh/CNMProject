import { NavLink } from "react-router-dom";
import { useProgress } from "../../lib/progress.js";
import { getDueCount } from "../../lib/srs.js";
import "./Nav.css";

const ITEMS = [
  { to: "/chapters", icon: "🏮", label: "เรียน" },
  { to: "/review", icon: "🎯", label: "ทวน" },
  { to: "/profile", icon: "🧧", label: "ฉัน" },
];

export default function Nav() {
  const [progress] = useProgress();
  const dueCount = getDueCount(progress);

  return (
    <nav className="rail">
      {ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "on" : "")}>
          <span className="railIcon">
            {item.icon}
            {item.to === "/review" && dueCount > 0 && (
              <i className={["navDot", dueCount > 30 && "danger"].filter(Boolean).join(" ")} />
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

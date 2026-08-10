import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";

const LINKS = [
  { href: "#how", label: "วิธีเล่น" },
  { href: "#level", label: "ระดับภาษา" },
  { href: "#words", label: "คำศัพท์" },
  { href: "#modes", label: "โหมด" },
  { href: "#feat", label: "ระบบ" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 60);
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`lnav${scrolled ? " on" : ""}`}>
      <div className="lg">
        <div className="lgi zhb">纸</div>
        <div className="lgt">ZHI YUAN</div>
      </div>
      <div className="lk">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </div>
      <Button size="sm" onClick={() => navigate("/name")}>
        เริ่มเล่น
      </Button>
    </nav>
  );
}

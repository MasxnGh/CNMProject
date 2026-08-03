import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button.jsx";

// Bounces once, only on the false->true edge, so it catches the eye the
// instant an answer becomes checkable without replaying on every re-render.
export default function CheckButton({ enabled, onClick }) {
  const [pulse, setPulse] = useState(false);
  const wasEnabled = useRef(enabled);

  useEffect(() => {
    const prev = wasEnabled.current;
    wasEnabled.current = enabled;
    if (enabled && !prev) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [enabled]);

  return (
    <Button
      variant="primary"
      className={["checkBtn", pulse && "pulseReady"].filter(Boolean).join(" ")}
      disabled={!enabled}
      onClick={onClick}
    >
      ตรวจคำตอบ
    </Button>
  );
}

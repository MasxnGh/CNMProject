import "./ComboBadge.css";

export default function ComboBadge({ count }) {
  if (count < 3) return null;

  const tier = count >= 10 ? "fire" : count >= 5 ? "hot" : "";

  return (
    <div className={["comboBadge", tier].filter(Boolean).join(" ")}>
      โคมติดต่อกัน x{count}
    </div>
  );
}

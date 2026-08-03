import "./Lantern.css";

export default function Lantern({ state = "lock", icon, label, onClick, className = "" }) {
  const displayIcon = state === "lock" ? "🔒" : icon;
  const classes = ["lamp", state, className].filter(Boolean).join(" ");

  return (
    <button type="button" className={classes} onClick={onClick}>
      <div className="glass">
        <div className="ico">{displayIcon}</div>
        {state === "done" && <div className="tiny">过</div>}
      </div>
      <div className="cap">{label}</div>
    </button>
  );
}

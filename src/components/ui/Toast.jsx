import "./Toast.css";

/** Fixed top notification pill. Controlled: pass `open` and `message`. */
export default function Toast({ open, message, tone = "gold" }) {
  const classes = ["toast", open ? "open" : "", tone !== "gold" ? `tone-${tone}` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} role="status" aria-live="polite">
      {message}
    </div>
  );
}

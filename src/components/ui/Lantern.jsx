/**
 * dujeen-quest-prototype.html .lamp - a single lantern on the chapter path.
 * state: 'done' (jade glow + small stamp badge) | 'now' (amber glow, pulses
 * continuously) | 'lock' (dim, inert).
 */
export default function Lantern({ state = "lock", icon, label, onClick, ...rest }) {
  return (
    <button type="button" className={`ln-lamp ${state}`} onClick={onClick} {...rest}>
      <div className="ln-lamp-glass">
        <div className="ln-lamp-ico">{state === "lock" ? "🔒" : icon}</div>
        {state === "done" ? <div className="ln-lamp-tiny">过</div> : null}
      </div>
      <div className="ln-lamp-cap">{label}</div>
    </button>
  );
}

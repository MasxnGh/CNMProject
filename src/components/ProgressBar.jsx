export default function ProgressBar({ value = 0, max = 100, label, className = "" }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs font-black text-amber-950/80">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      ) : null}
      <div className="progress-track h-4 overflow-hidden rounded-full border-2 border-amber-900/30 bg-amber-950/20 shadow-inner">
        <div
          className="progress-fill h-full rounded-full bg-gradient-to-r from-gold via-amber-300 to-yellow-100 shadow-glow"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

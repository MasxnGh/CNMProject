export default function PandaGuide({ mood = "happy", text, compact = false }) {
  return (
    <div
      className={`v2-panda-guide ${compact ? "compact" : ""} ${mood === "sad" ? "sad-motion" : ""}`}
      aria-label="แพนด้านักผจญภัย"
    >
      <div className={`v2-panda ${mood}`}>
        <span className="v2-panda-backpack" />
        <span className="v2-panda-ear left" />
        <span className="v2-panda-ear right" />
        <span className="v2-panda-face" />
        <span className="v2-panda-eye left" />
        <span className="v2-panda-eye right" />
        <span className="v2-panda-nose" />
        <span className="v2-panda-mouth" />
        <span className="v2-panda-headband" />
        <span className="v2-panda-star" />
      </div>
      {text ? <div className="v2-panda-bubble">{text}</div> : null}
    </div>
  );
}

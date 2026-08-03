import "./LoadingLantern.css";

export default function LoadingLantern() {
  return (
    <div className="loadingLantern">
      <span className="glow" aria-hidden="true">
        🏮
      </span>
      <p>กำลังจุดโคม...</p>
    </div>
  );
}

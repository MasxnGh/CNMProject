import "./RouteStub.css";

/** Placeholder for routes not yet built out — replaced page by page in later prompts. */
export default function RouteStub({ zh, label }) {
  return (
    <div className="stub">
      <div>
        <div className="zh">{zh}</div>
        <p>{label} — ยังไม่ได้สร้างหน้านี้</p>
      </div>
    </div>
  );
}

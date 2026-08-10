import { useEffect, useRef } from "react";

const KITE_COLORS = [
  ["#CE4430", "#8E2415"],
  ["#6FA294", "#3F6D62"],
  ["#C08A2E", "#835811"],
  ["#3F6BA8", "#24446F"],
];

function drawCloud(ctx, x, y, s, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = "#fff";
  for (const [dx, dy, r] of [
    [0, 0, 26],
    [22, 4, 20],
    [-22, 4, 18],
    [10, -10, 17],
    [-10, -8, 15],
  ]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** One personal sky: a small kite for every correct answer this run, at a stable random spot. */
export default function ResultSky({ kites }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.parentElement.clientWidth;
    const h = 250;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    [
      [40, 30, 0.6],
      [w - 70, 58, 0.5],
      [w * 0.5, 24, 0.42],
    ].forEach(([x, y, s]) => drawCloud(ctx, x, y, s, 0.6));

    kites.forEach((k) => {
      const x = 24 + k.x * (w - 48);
      const y = 24 + k.y * (h - 80);
      const s = 7 + k.size * 4;
      const [c1, c2] = KITE_COLORS[k.colorIdx];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(k.tilt);
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, 0);
      ctx.lineTo(0, s * 1.25);
      ctx.lineTo(-s * 0.8, 0);
      ctx.closePath();
      ctx.fillStyle = c1;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, 0);
      ctx.lineTo(0, s * 1.25);
      ctx.closePath();
      ctx.fillStyle = c2;
      ctx.fill();
      ctx.strokeStyle = "rgba(58,51,43,.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, s * 1.25);
      ctx.quadraticCurveTo(s * 0.5, s * 2, 0, s * 2.6);
      ctx.stroke();
      ctx.restore();
    });
  }, [kites]);

  return (
    <div className="resSky">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="cap">คุณปล่อยว่าวได้ {kites.length} ตัวในวันนี้</div>
    </div>
  );
}

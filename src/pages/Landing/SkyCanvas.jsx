import { useEffect, useRef } from "react";
import "./SkyCanvas.css";

const CLOUD_COUNT = 7;
const BIRD_COUNT = 4;
const CLOUD_PUFFS = [
  [0, 0, 26],
  [22, 4, 20],
  [-22, 4, 18],
  [10, -10, 17],
  [-10, -8, 15],
];

/** Full-viewport ambient backdrop: drifting clouds + flying birds, one shared rAF loop. */
export default function SkyCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1;
    let width = 0;
    let height = 0;
    let clouds = [];
    let birds = [];
    let rafId = null;
    let lastTs = 0;

    function initScene() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      width = innerWidth;
      height = innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      clouds = Array.from({ length: CLOUD_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.55,
        s: Math.random() * 0.7 + 0.55,
        v: Math.random() * 0.16 + 0.05,
        a: Math.random() * 0.3 + 0.24,
      }));
      birds = Array.from({ length: BIRD_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.4 + 40,
        v: Math.random() * 0.4 + 0.22,
        ph: Math.random() * 6.3,
        s: Math.random() * 0.5 + 0.5,
      }));
    }

    function drawCloud(x, y, s, a) {
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fff";
      for (const [dx, dy, r] of CLOUD_PUFFS) {
        ctx.beginPath();
        ctx.arc(x + dx * s, y + dy * s, r * s, 0, 6.3);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame(ts) {
      const dt = Math.min((ts - lastTs) / 16.7, 3);
      lastTs = ts;
      ctx.clearRect(0, 0, width, height);

      for (const c of clouds) {
        c.x += c.v * dt;
        if (c.x > width + 90) c.x = -90;
        drawCloud(c.x, c.y, c.s, c.a);
      }

      ctx.strokeStyle = "rgba(58,51,43,.3)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      for (const b of birds) {
        b.x += b.v * dt;
        b.ph += 0.05 * dt;
        if (b.x > width + 30) b.x = -30;
        const flap = Math.sin(b.ph) * 4;
        ctx.beginPath();
        ctx.moveTo(b.x - 7 * b.s, b.y);
        ctx.quadraticCurveTo(b.x - 3 * b.s, b.y - flap, b.x, b.y);
        ctx.quadraticCurveTo(b.x + 3 * b.s, b.y - flap, b.x + 7 * b.s, b.y);
        ctx.stroke();
      }

      rafId = requestAnimationFrame(frame);
    }

    function handleResize() {
      initScene();
    }

    initScene();
    if (!reduceMotion) rafId = requestAnimationFrame(frame);
    addEventListener("resize", handleResize);

    return () => {
      removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="sky-canvas" aria-hidden="true" />;
}

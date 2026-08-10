import { useEffect, useRef } from "react";

const CLOUD_COUNT = 6;
const CLOUD_PUFFS = [
  [0, 0, 26],
  [22, 4, 20],
  [-22, 4, 18],
  [10, -10, 17],
  [-10, -8, 15],
];

/** Day-sky gradient with a handful of clouds drifting across, one shared rAF loop. */
export default function PlaySky() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = 1;
    let width = 0;
    let height = 0;
    let clouds = [];
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
        y: Math.random() * height * 0.5,
        s: Math.random() * 0.7 + 0.55,
        v: Math.random() * 0.14 + 0.04,
        a: Math.random() * 0.3 + 0.3,
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

  return (
    <div className="play-sky">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

import { createContext, useContext, useEffect, useRef } from "react";

const BurstContext = createContext(null);

const reduceMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * App-wide square-confetti burst, drawn on one fixed full-viewport canvas.
 * Call triggerBurst(x, y, colors, count) from anywhere under the provider.
 */
export function BurstProvider({ children }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const runningRef = useRef(false);
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    function resize() {
      dprRef.current = Math.min(devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dprRef.current;
      canvas.height = innerHeight * dprRef.current;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
    }
    resize();
    addEventListener("resize", resize);
    return () => removeEventListener("resize", resize);
  }, []);

  function step() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.99;
      p.rot += p.vr;
      p.life -= p.dec;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (particlesRef.current.length) {
      requestAnimationFrame(step);
    } else {
      runningRef.current = false;
    }
  }

  function triggerBurst(x, y, colors, count = 40) {
    if (reduceMotion()) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * 6.3;
      const sp = Math.random() * 7.5 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 3,
        s: Math.random() * 6 + 3,
        rot: Math.random() * 6.3,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
        dec: Math.random() * 0.014 + 0.009,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    if (!runningRef.current) {
      runningRef.current = true;
      requestAnimationFrame(step);
    }
  }

  return (
    <BurstContext.Provider value={{ triggerBurst }}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 95, pointerEvents: "none" }}
      />
    </BurstContext.Provider>
  );
}

export function useBurst() {
  const ctx = useContext(BurstContext);
  if (!ctx) throw new Error("useBurst must be used within BurstProvider");
  return ctx;
}

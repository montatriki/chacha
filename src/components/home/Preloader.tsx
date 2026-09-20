"use client";
import { useEffect, useRef, useState } from "react";
import { COLOR_DEEP, COLOR_TEAL, COPY, SITE } from "@/config/site";

// Faithful port of the original aradiapp.com preloader. The only difference from the
// original is the shape the particles settle into: the brand word from
// public/data/content/site.json (copy.preloader.word) instead of the icon image.

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

/**
 * Renders the word onto an offscreen canvas and samples its bright pixels, exactly the
 * way the original samples the icon image (2px grid, brightness threshold, random pick).
 */
function sampleWordPoints(word: string, font: string, count: number, w: number, h: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  // Measure the word to size the offscreen canvas around it.
  ctx.font = font;
  const metrics = ctx.measureText(word);
  const textW = Math.ceil(metrics.width);
  const textH = Math.ceil((metrics.actualBoundingBoxAscent || 120) + (metrics.actualBoundingBoxDescent || 20));
  const pad = 16;
  const W = textW + pad * 2;
  const H = textH + pad * 2;
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.fillText(word, pad, pad + (metrics.actualBoundingBoxAscent || 120));

  const { data } = ctx.getImageData(0, 0, W, H);
  const bright: { x: number; y: number }[] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (data[i + 3] > 180 && lum > 180) bright.push({ x, y });
    }
  }
  if (bright.length === 0) return [];

  // Same footprint rule as the original (icon box = min(w,h) * 0.42), but the word is
  // wide, so fit its width into the screen while keeping its aspect ratio.
  const boxH = Math.min(w, h) * 0.42;
  const scale = Math.min(boxH / H, (w * 0.82) / W);
  const drawW = W * scale;
  const drawH = H * scale;
  const ox = w / 2 - drawW / 2;
  const oy = h / 2 - drawH / 2;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const p = bright[Math.floor(Math.random() * bright.length)];
    out.push({ x: ox + p.x * scale, y: oy + p.y * scale });
  }
  return out;
}

export function Preloader({
  onComplete,
  loadProgress,
  reducedMotion = false,
}: {
  onComplete: () => void;
  loadProgress: number;
  reducedMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<"load" | "form" | "hold" | "out">("load");
  const doneRef = useRef(false);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    if (reducedMotion) {
      const t = window.setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
      }, 1200);
      return () => window.clearTimeout(t);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let alive = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const count = window.matchMedia("(max-width: 768px)").matches ? 900 : 2200;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const seed = (targets: { x: number; y: number }[]) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      particles = targets.map((t) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: t.x,
        ty: t.y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.4 + 0.5,
        alpha: Math.random() * 0.5 + 0.4,
      }));
    };

    // Wait for the web font so the word is sampled in the right typeface, then seed
    // (mirrors the original's img.onload / img.onerror pair).
    let cancelled = false;
    const word = COPY.preloader.word || SITE.name;
    const font = COPY.preloader.wordFont || "600 160px Poppins, Montserrat, sans-serif";
    const fontsReady = typeof document !== "undefined" && document.fonts ? document.fonts.load(font).then(() => undefined) : Promise.resolve();
    Promise.race([fontsReady, new Promise<void>((r) => window.setTimeout(r, 1500))])
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        const pts = sampleWordPoints(word, font, count, window.innerWidth, window.innerHeight);
        seed(
          pts.length
            ? pts
            : Array.from({ length: count }, () => ({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
              })),
        );
        setStage("form");
      });

    let formStart = 0;
    let holdStart = 0;
    let outStart = 0;
    let phase: "load" | "form" | "hold" | "out" = "load";

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      alive = false;
      cancelAnimationFrame(raf);
      onComplete();
    };
    const safety = window.setTimeout(finish, 14000);

    const draw = (now: number) => {
      if (!alive) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.fillStyle = COLOR_DEEP;
      ctx.fillRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.55);
      grad.addColorStop(0, COLOR_TEAL);
      grad.addColorStop(1, COLOR_DEEP);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (phase === "load" && particles.length) {
        phase = "form";
        formStart = now;
        setStage("form");
      }

      const FORM_MS = 2800;
      const HOLD_MS = 1100;
      const OUT_MS = 900;

      if (phase === "form") {
        const p = Math.min(1, (now - formStart) / FORM_MS);
        const e = 1 - Math.pow(1 - p, 3);
        for (const pt of particles) {
          pt.x += (pt.tx - pt.x) * (0.04 + e * 0.08);
          pt.y += (pt.ty - pt.y) * (0.04 + e * 0.08);
        }
        if ((p >= 1 && loadProgress >= 0.92) || (p >= 1 && now - startedAt.current > 8000)) {
          phase = "hold";
          holdStart = now;
          setStage("hold");
        }
      } else if (phase === "hold") {
        const sweep = ((now - holdStart) / HOLD_MS) % 1;
        for (const pt of particles) {
          const dx = pt.x - w / 2;
          const glow = Math.max(0, 1 - Math.abs(dx / (w * 0.35) - (sweep * 2 - 1)) * 4);
          pt.alpha = 0.55 + glow * 0.45;
        }
        if (now - holdStart >= HOLD_MS) {
          phase = "out";
          outStart = now;
          setStage("out");
        }
      } else if (phase === "out") {
        const p = Math.min(1, (now - outStart) / OUT_MS);
        for (const pt of particles) {
          pt.x += (pt.x - w / 2) * 0.012;
          pt.y += (pt.y - h / 2) * 0.012;
          pt.alpha *= 0.985;
        }
        if (p >= 1) {
          clearTimeout(safety);
          finish();
          return;
        }
      } else {
        for (const pt of particles) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (pt.x < 0 || pt.x > w) pt.vx *= -1;
          if (pt.y < 0 || pt.y > h) pt.vy *= -1;
        }
      }

      ctx.fillStyle = "#ffffff";
      for (const pt of particles) {
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete, loadProgress, reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{ background: COLOR_DEEP }}
        role="status"
        aria-live="polite"
      >
        <p className="text-[clamp(2rem,8vw,5rem)] font-bold tracking-[0.12em] text-white/90">{COPY.preloader.word || SITE.name}</p>
        <p className="mt-8 text-xs tracking-[0.35em] text-white/60 uppercase">{COPY.preloader.reducedMotion}</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{ background: COLOR_DEEP }}
      role="status"
      aria-live="polite"
      aria-label={COPY.preloader.label}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3">
        <div className="h-[1px] w-40 overflow-hidden bg-white/15">
          <div
            className="h-full bg-white/70 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(Math.min(1, loadProgress) * 100)}%` }}
          />
        </div>
        <span className="text-[10px] tracking-[0.4em] text-white/45 uppercase">
          {stage === "out" ? COPY.preloader.ready : COPY.preloader.preparing}
        </span>
      </div>
    </div>
  );
}

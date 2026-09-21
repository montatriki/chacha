"use client";
import { useMemo } from "react";

/**
 * A field of "brilliant" sparkles over the ready gate: four- and eight-point diamond flares that
 * twinkle at their own pace and drift up very slowly. Positions come from a seeded generator so
 * the layout is identical on every render (no hydration mismatch), denser in a ring around the
 * logo and thinner towards the edges. Pure opacity/transform animations: no filters, no repaints.
 */
interface Spark { x: number; y: number; size: number; dur: number; delay: number; eight: boolean; tint: "white" | "gold" | "blue"; drift: number }

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function makeSparks(count: number, seed: number): Spark[] {
  const rnd = seeded(seed);
  const out: Spark[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const x = rnd() * 100;
    const y = rnd() * 100;
    // keep the very centre (logo + tagline) clean; favour a ring around it
    const dx = (x - 50) / 50, dy = (y - 46) / 46;
    const d = Math.hypot(dx, dy);
    if (d < 0.36) continue;
    if (d > 0.5 && rnd() > 0.55) continue;
    const big = rnd() < 0.22;
    out.push({
      x, y,
      size: big ? 10 + rnd() * 8 : 3 + rnd() * 5,
      dur: 2.6 + rnd() * 3.4,
      delay: rnd() * 6,
      eight: big || rnd() < 0.3,
      tint: rnd() < 0.62 ? "white" : rnd() < 0.5 ? "gold" : "blue",
      drift: 8 + rnd() * 18,
    });
  }
  return out;
}

const TINT = { white: "#ffffff", gold: "#f1dcae", blue: "#bfd2fe" } as const;

export function DiamondField({ count = 42, seed = 7, className = "" }: { count?: number; seed?: number; className?: string }) {
  const sparks = useMemo(() => makeSparks(count, seed), [count, seed]);
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {sparks.map((s, i) => (
        <span
          key={i}
          className={`diamond-brilliant ${s.eight ? "is-eight" : ""}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            color: TINT[s.tint],
            animationDuration: `${s.dur}s, ${s.dur * 4}s`,
            animationDelay: `${s.delay}s, ${s.delay}s`,
            ["--drift" as string]: `${s.drift}px`,
            ["--ray" as string]: `${Math.round(s.size * 2.6)}px`,
          }}
        />
      ))}
    </div>
  );
}

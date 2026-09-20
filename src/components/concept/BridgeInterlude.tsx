"use client";
import { useEffect, useRef, useState } from "react";
import { BRIDGE } from "@/config/pitch";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TEXT = BRIDGE.text;

export function BridgeInterlude() {
  const reducedMotion = useReducedMotion();
  const [typed, setTyped] = useState(reducedMotion ? TEXT : "");
  const [opacity, setOpacity] = useState(reducedMotion ? 1 : 0);
  const [lift, setLift] = useState(reducedMotion ? 0 : 10);
  const [blur, setBlur] = useState(reducedMotion ? 0 : 4);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      setTyped(TEXT);
      setOpacity(1);
      setLift(0);
      setBlur(0);
      return;
    }
    let origin = 0;
    let started = false;
    const step = (now: number) => {
      if (!started) {
        if (now - origin < BRIDGE.delayMs) {
          rafRef.current = requestAnimationFrame(step);
          return;
        }
        started = true;
        origin = now;
      }
      const elapsed = now - origin;
      const p = Math.min(1, elapsed / BRIDGE.typeMs);
      const e = 1 - Math.pow(1 - p, 3);
      setTyped(TEXT.slice(0, Math.round(e * TEXT.length)));
      const rest = 1 - e;
      setOpacity(Math.min(1, e * 1.15));
      setLift(rest * 8);
      setBlur(rest * 3.2);
      if (p < 1 || elapsed < BRIDGE.typeMs + BRIDGE.holdMs) rafRef.current = requestAnimationFrame(step);
    };
    origin = performance.now();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);

  return (
    <section className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black" aria-label="Transition">
      <h2
        className="relative max-w-[18ch] px-6 text-center font-medium tracking-[-0.03em] text-white"
        style={{
          fontSize: "clamp(28px, 6.5vw, 72px)",
          lineHeight: 1.12,
          opacity,
          transform: `translate3d(0, ${lift.toFixed(2)}px, 0)`,
          filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none",
          willChange: "opacity, transform, filter",
        }}
      >
        <span aria-hidden>
          {typed}
          <span className="invisible">{TEXT.slice(typed.length)}</span>
        </span>
        <span className="sr-only">{TEXT}</span>
      </h2>
    </section>
  );
}

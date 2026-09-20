"use client";
import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { COPY } from "@/config/site";

const HOLD_MS = 4000;

export function JourneyOverlay({ videoRef, visible }: { videoRef: RefObject<HTMLVideoElement | null>; visible: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const root = rootRef.current;
    const eyebrow = eyebrowRef.current;
    const head = headRef.current;
    const body = bodyRef.current;
    if (!root || !eyebrow || !head || !body) return;
    gsap.set(root, { opacity: 1 });
    gsap.set([eyebrow, head, body], { opacity: 0, x: -28, y: 0 });
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7 }, 0)
      .to(head, { opacity: 1, x: 0, duration: 0.85 }, 0.12)
      .to(body, { opacity: 1, x: 0, duration: 0.8 }, 0.28)
      .to(root, { opacity: 0, y: -12, duration: 0.7, ease: "power2.in" }, HOLD_MS / 1000);
    const start = performance.now();
    let raf = 0;
    const drift = () => {
      const t = (performance.now() - start) / 1000;
      const d = Math.min(t, 4) * 10;
      if (root.style.opacity !== "0") {
        gsap.set(eyebrow, { y: d * 0.25 });
        gsap.set(head, { y: d * 0.55, x: d * -0.08 });
        gsap.set(body, { y: d * 0.85 });
      }
      void videoRef.current;
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);
    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
    };
  }, [visible, videoRef]);

  if (!visible) return null;
  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-[5%] top-1/2 w-[min(42vw,420px)] -translate-y-1/2 md:left-[7%] md:w-[min(38vw,480px)]">
        <p ref={eyebrowRef} className="mb-3 text-[10px] tracking-[0.4em] text-[#2563eb] uppercase md:text-[11px]">
          {COPY.journey.eyebrow}
        </p>
        <h2 ref={headRef} className="mb-4 text-[clamp(1.75rem,4.2vw,3.4rem)] font-medium leading-[1.08] text-white">
          {COPY.journey.headline}
        </h2>
        <p ref={bodyRef} className="max-w-sm text-sm leading-relaxed text-white/70 md:text-base">
          {COPY.journey.body}
        </p>
      </div>
    </div>
  );
}

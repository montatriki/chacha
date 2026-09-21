"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { COPY } from "@/config/site";

const HOLD_MS = 4000;

export function JourneyOverlay({ videoRef, visible }: { videoRef: RefObject<HTMLVideoElement | null>; visible: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const servicesRef = useRef<HTMLParagraphElement | null>(null);
  // Phones: the copy column takes most of the width instead of the desktop's 42vw strip.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const root = rootRef.current;
    const eyebrow = eyebrowRef.current;
    const head = headRef.current;
    const body = bodyRef.current;
    const services = servicesRef.current;
    if (!root || !eyebrow || !head || !body) return;
    gsap.set(root, { opacity: 1 });
    gsap.set([eyebrow, head, body], { opacity: 0, x: -28, y: 0 });
    // the handwritten line is "signed" in: fades up while its letters slide from the left
    if (services) gsap.set(services, { opacity: 0, x: -40, y: 0, clipPath: "inset(0 100% 0 0)" });
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7 }, 0)
      .to(head, { opacity: 1, x: 0, duration: 0.85 }, 0.12)
      .to(body, { opacity: 1, x: 0, duration: 0.8 }, 0.28);
    if (services) tl.to(services, { opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power1.inOut" }, 0.55);
    tl.to(root, { opacity: 0, y: -12, duration: 0.7, ease: "power2.in" }, HOLD_MS / 1000);
    const start = performance.now();
    let raf = 0;
    const drift = () => {
      const t = (performance.now() - start) / 1000;
      const d = Math.min(t, 4) * 10;
      if (root.style.opacity !== "0") {
        gsap.set(eyebrow, { y: d * 0.25 });
        gsap.set(head, { y: d * 0.55, x: d * -0.08 });
        gsap.set(body, { y: d * 0.85 });
        if (services) gsap.set(services, { y: d * 1.05 });
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
      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: narrow ? "6%" : "7%", width: narrow ? "min(88vw, 480px)" : "min(40vw, 500px)" }}>
        <p ref={eyebrowRef} className="mb-3 tracking-[0.4em] text-[#2563eb] uppercase" style={{ fontSize: narrow ? 10 : 11 }}>
          {COPY.journey.eyebrow}
        </p>
        <h2 ref={headRef} className="mb-4 font-medium leading-[1.08] text-white" style={{ fontSize: narrow ? "clamp(1.9rem, 8.5vw, 2.6rem)" : "clamp(1.75rem, 4.2vw, 3.4rem)" }}>
          {COPY.journey.headline}
        </h2>
        <p ref={bodyRef} className="leading-relaxed text-white/80" style={{ fontSize: narrow ? 14 : 16 }}>
          {COPY.journey.body}
          {COPY.journey.bodyLine2 && (
            <span className="mt-2 block font-medium uppercase" style={{ fontSize: narrow ? 11 : 12, letterSpacing: "0.22em", color: "#e7c98a" }}>{COPY.journey.bodyLine2}</span>
          )}
        </p>
        {/* Optional hand-written line (copy.journey.services); empty = not rendered */}
        {COPY.journey.services && <p
          ref={servicesRef}
          className="journey-script mt-4"
          style={{
            fontSize: narrow ? "clamp(2.6rem, 12vw, 3.6rem)" : "clamp(2.8rem, 5vw, 4.4rem)",
            lineHeight: 1.08,
            letterSpacing: "0.01em",
            paddingRight: "0.3em", // room for the trailing flourish of the script
          }}
        >
          {COPY.journey.services}
        </p>}
      </div>
    </div>
  );
}

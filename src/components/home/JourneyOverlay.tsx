"use client";
import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { COPY } from "@/config/site";

const HOLD_MS = 5200;

export function JourneyOverlay({ videoRef, visible }: { videoRef: RefObject<HTMLVideoElement | null>; visible: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const headRef = useRef<HTMLHeadingElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const servicesRef = useRef<HTMLSpanElement | null>(null);
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
    if (!root || !eyebrow || !head || !body) return;
    void servicesRef.current;
    gsap.set(root, { opacity: 1 });
    gsap.set([eyebrow, head], { opacity: 0, x: -28, y: 0 });
    // The tagline settles in from slightly below, out of focus, and a light sweeps across it
    // once it lands; the service words then light up one by one (CSS, see .journey-service-word).
    gsap.set(body, { opacity: 1, y: 0 });
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(eyebrow, { opacity: 1, x: 0, duration: 0.7 }, 0)
      .to(head, { opacity: 1, x: 0, duration: 0.85 }, 0.12);
    // Once the words have landed, a wave of light keeps travelling along the sentence: each word
    // brightens and lifts a little as the wave passes, then settles. It repeats for the whole scene.
    const words = body.querySelectorAll<HTMLElement>(".journey-word");
    let wave: gsap.core.Timeline | null = null;
    if (words.length) {
      wave = gsap.timeline({ repeat: -1, repeatDelay: 0.9, delay: 1.2 });
      wave
        .to(words, {
          color: "#ffffff",
          textShadow: "0 0 20px rgba(255,255,255,0.9)",
          y: -4,
          duration: 0.34,
          ease: "power2.out",
          stagger: { each: 0.055 },
        })
        .to(
          words,
          {
            color: "rgba(255,255,255,0.88)",
            textShadow: "0 0 0 rgba(255,255,255,0)",
            y: 0,
            duration: 0.62,
            ease: "power2.inOut",
            stagger: { each: 0.055 },
          },
          0.2,
        );
    }
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
      }
      void videoRef.current;
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);
    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
      wave?.kill();
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
        {/* Tagline: each word rises and un-blurs on its own beat, then a light sweeps the finished
            sentence. The service list below builds as glowing gold chips that keep breathing. */}
        <p ref={bodyRef} className="journey-tagline text-white/90" style={{ fontSize: narrow ? 15 : 17, lineHeight: 1.75, marginTop: narrow ? 14 : 18 }}>
          <span className="journey-tagline-inner">
            {COPY.journey.body.split(" ").map((word, i) => (
              <span key={`${word}-${i}`} className="journey-word" style={{ animationDelay: `${0.35 + i * 0.055}s` }}>
                {word}
                <span className="journey-word-gap">&nbsp;</span>
              </span>
            ))}
          </span>
          <span className="journey-underline" aria-hidden />
        </p>
        {COPY.journey.bodyLine2 && (
          <span ref={servicesRef} className="journey-services flex flex-wrap items-center font-semibold uppercase" style={{ marginTop: narrow ? 20 : 26, fontSize: narrow ? 10.5 : 11.5, letterSpacing: "0.26em", gap: narrow ? "10px 10px" : "12px 14px" }}>
            {COPY.journey.bodyLine2.split(" · ").map((part, i, all) => (
              <Fragment key={part}>
                <span className="journey-chip" style={{ animationDelay: `${1.25 + i * 0.3}s`, ["--chip-i" as string]: i }}>
                  <span className="journey-chip-label">{part}</span>
                </span>
                {i < all.length - 1 && <span className="journey-chip-dot" aria-hidden style={{ animationDelay: `${1.4 + i * 0.3}s` }} />}
              </Fragment>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

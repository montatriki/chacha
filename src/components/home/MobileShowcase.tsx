"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectionBlock } from "@/config/hallway";
import { ServiceIcon } from "./ServiceIcon";
import { CardMedia } from "./CardMedia";

const GOLD = "#e7c98a";
const AUTOPLAY_MS = 4200;

/**
 * Phone showcase: one item at a time over a translucent, colour-tinted backdrop that lets the
 * hallway show through. Auto-advances with a progress bar, pauses while the user touches it,
 * supports swipe and taps on the dots.
 */
export function MobileShowcase({ blocks, gold = GOLD, onOpen, openLabel = "View" }: { blocks: ProjectionBlock[]; gold?: string; onOpen?: (block: ProjectionBlock) => void; openLabel?: string }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // restarts the progress animation
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = blocks.length;

  const go = useCallback(
    (next: number, d: 1 | -1 = 1) => {
      setDir(d);
      setIndex(((next % count) + count) % count);
      setTick((t) => t + 1);
    },
    [count],
  );

  const block = blocks[index];
  // Slides with rotating media hold long enough to show every item (photo 5 s, video up to 16 s).
  const holdMs = block.media && block.media.length > 1 ? block.media.reduce((t, m) => t + (m.type === "video" ? 16000 : 5000), 0) : AUTOPLAY_MS;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setTimeout(() => go(index + 1, 1), holdMs);
    return () => window.clearTimeout(id);
  }, [index, paused, count, go, tick, holdMs]);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const t = touch.current;
        touch.current = null;
        setPaused(false);
        if (!t) return;
        const dx = e.changedTouches[0].clientX - t.x;
        const dy = e.changedTouches[0].clientY - t.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? index + 1 : index - 1, dx < 0 ? 1 : -1);
      }}
    >
      {/* Stage */}
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ borderRadius: 22, border: `1px solid rgba(231,201,138,0.45)`, boxShadow: "0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14)", background: "linear-gradient(160deg, rgba(37,99,235,0.28) 0%, rgba(124,58,237,0.18) 45%, rgba(10,15,31,0.55) 100%)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", willChange: "transform", transform: "translateZ(0)", contain: "paint" }}>
        {/* moving colour aurora so the translucent stage feels alive */}
        <span aria-hidden className="pointer-events-none absolute" style={{ left: "-20%", top: "-30%", width: "90%", height: "90%", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.55), transparent 65%)", filter: "blur(30px)", animation: "showcaseAuroraA 9s ease-in-out infinite alternate" }} />
        <span aria-hidden className="pointer-events-none absolute" style={{ right: "-25%", bottom: "-25%", width: "95%", height: "95%", borderRadius: "50%", background: "radial-gradient(circle, rgba(231,201,138,0.42), transparent 65%)", filter: "blur(34px)", animation: "showcaseAuroraB 11s ease-in-out infinite alternate" }} />
        <span aria-hidden className="pointer-events-none absolute" style={{ left: "30%", top: "35%", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.4), transparent 65%)", filter: "blur(36px)", animation: "showcaseAuroraC 13s ease-in-out infinite alternate" }} />
        {/* light sweep */}
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)", backgroundSize: "220% 100%", animation: "projScanSheen 5s ease-in-out 1" }} />
        {block.image && (
          <span aria-hidden className="pointer-events-none absolute inset-0">
            {block.media?.length ? <CardMedia items={block.media} drift /> : <img src={block.image} alt="" className="h-full w-full object-cover" style={{ animation: "eventsBgDrift 14s ease-in-out infinite alternate" }} />}
            <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,15,31,0.15) 0%, rgba(10,15,31,0.35) 45%, rgba(10,15,31,0.92) 100%)" }} />
          </span>
        )}
        {/* gold top ribbon */}
        <span aria-hidden className="pointer-events-none absolute left-0 right-0" style={{ top: 0, height: 3, background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

        {/* Slide */}
        <div key={`${index}-${tick}`} className="absolute inset-0 flex flex-col justify-end" style={{ padding: "26px 26px 28px", animation: `${dir === 1 ? "showcaseSlideIn" : "showcaseSlideInBack"} 0.75s cubic-bezier(0.16, 1, 0.3, 1) both` }}>
          <span aria-hidden className="pointer-events-none absolute" style={{ right: 22, top: 18, fontSize: 64, fontWeight: 600, lineHeight: 1, color: "rgba(255,255,255,0.1)", fontVariantNumeric: "tabular-nums" }}>{block.index ?? String(index + 1).padStart(2, "0")}</span>
          {/* big icon medallion */}
          {block.image ? <span className="mb-auto" aria-hidden /> : <span className="relative mb-auto mt-8 flex items-center justify-center self-center" style={{ width: 118, height: 118, borderRadius: 999, background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(231,201,138,0.14) 45%, rgba(10,15,31,0.55) 100%)", border: `1.5px solid ${gold}`, boxShadow: `0 0 0 10px rgba(231,201,138,0.08), 0 0 60px rgba(231,201,138,0.3)`, color: gold, animation: "showcaseMedallion 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both" }} aria-hidden>
            <span aria-hidden className="absolute inset-0 rounded-full" style={{ border: "1px dashed rgba(231,201,138,0.5)", animation: "showcaseSpin 22s linear infinite", transform: "scale(1.16)" }} />
            <ServiceIcon name={block.icon} size={50} />
          </span>}
          <span className="font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.34em", color: gold, animation: "eventsRise 0.7s ease-out 0.25s both" }}>{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          <h3 className="mt-2 text-white" style={{ fontSize: "clamp(24px, 6.5vw, 30px)", lineHeight: 1.12, fontWeight: 600, letterSpacing: "-0.01em", textShadow: "0 2px 20px rgba(0,0,0,0.5)", animation: "eventsRise 0.7s ease-out 0.32s both" }}>{block.title}</h3>
          <span aria-hidden className="mt-3 block h-px w-10" style={{ background: `linear-gradient(90deg, ${gold}, transparent)`, animation: "eventsRise 0.7s ease-out 0.38s both" }} />
          <p className="mt-3 text-white" style={{ fontSize: 15.5, lineHeight: 1.6, opacity: 0.92, animation: "eventsRise 0.7s ease-out 0.45s both" }}>{block.body}</p>
          {onOpen && (
            <button
              type="button"
              onClick={() => onOpen(block)}
              className="mt-4 inline-flex items-center gap-2 self-start font-semibold uppercase"
              style={{ fontSize: 11, letterSpacing: "0.28em", color: gold, padding: "10px 16px", borderRadius: 999, border: `1px solid rgba(231,201,138,0.55)`, background: "rgba(10,15,31,0.55)", animation: "eventsRise 0.7s ease-out 0.5s both" }}
              aria-label={`${openLabel}: ${block.title}`}
            >
              {openLabel}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>

        {/* progress bar */}
        <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0" style={{ height: 3, background: "rgba(255,255,255,0.12)" }}>
          <span key={tick} className="block h-full" style={{ background: gold, width: "100%", transformOrigin: "left", animation: paused ? undefined : `showcaseProgress ${holdMs}ms linear both`, transform: paused ? "scaleX(0)" : undefined }} />
        </span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between px-1">
        <button type="button" aria-label="Previous" onClick={() => go(index - 1, -1)} className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: "rgba(10,15,31,0.6)", border: "1px solid rgba(231,201,138,0.45)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="flex items-center" style={{ gap: 6 }}>
          {blocks.map((b, i) => (
            <button key={b.title} type="button" aria-label={`Go to ${b.title}`} onClick={() => go(i, i > index ? 1 : -1)} className="rounded-full" style={{ width: i === index ? 20 : 6, height: 6, background: i === index ? gold : "rgba(255,255,255,0.35)", transition: "width 320ms, background 320ms" } as CSSProperties} />
          ))}
        </div>
        <button type="button" aria-label="Next" onClick={() => go(index + 1, 1)} className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: "rgba(10,15,31,0.6)", border: "1px solid rgba(231,201,138,0.45)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
}

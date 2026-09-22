"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { EVENTS, EVENT_ROOM, type EventItem } from "@/config/events";
import { MediaDetail } from "./MediaDetail";

const FONT = "Poppins, Montserrat, sans-serif";
const GOLD = "#e7c98a";

/** Non-scrolling luxury stage: the room image is locked behind everything and never moves. */
export function EventsRoom({ portrait, onBack }: { portrait: boolean; onBack: () => void }) {
  const [active, setActive] = useState<EventItem | null>(null);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active) {
        if (e.key === "Escape") setActive(null);
        return;
      }
      if (e.key === "Escape") onBack();
      if (e.key === "ArrowRight") scrollTo(index + 1);
      if (e.key === "ArrowLeft") scrollTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index, onBack]);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(EVENTS.length - 1, i));
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: "smooth" });
    setIndex(clamped);
  }, []);

  // Keep the dot indicator in sync with manual swipes.
  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((c, i) => {
      const el = c as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best !== index) setIndex(best);
  };

  return (
    <div className="absolute inset-0 z-[70] overflow-hidden" style={{ fontFamily: FONT, animation: "eventsRoomIn 1.2s ease-out both" }} role="region" aria-label={EVENT_ROOM.title}>
      {/* Background: locked, slow cinematic drift, never scrolls */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={portrait ? EVENT_ROOM.backgroundMobile : EVENT_ROOM.backgroundDesktop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{ animation: "eventsBgDrift 28s ease-in-out infinite alternate", willChange: "transform" }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(10,15,31,0.05) 0%, rgba(10,15,31,0.55) 70%, rgba(10,15,31,0.85) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0" style={{ height: "45%", background: "linear-gradient(180deg, transparent, rgba(10,15,31,0.9))" }} />
        {/* floating light dust */}
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(1.5px 1.5px at 12% 30%, rgba(231,201,138,0.55), transparent 100%), radial-gradient(1px 1px at 34% 62%, rgba(255,255,255,0.35), transparent 100%), radial-gradient(1.8px 1.8px at 58% 22%, rgba(231,201,138,0.45), transparent 100%), radial-gradient(1px 1px at 76% 48%, rgba(255,255,255,0.3), transparent 100%), radial-gradient(1.4px 1.4px at 88% 70%, rgba(231,201,138,0.4), transparent 100%)", animation: "eventsDust 14s linear infinite", opacity: 0.8 }} />
      </div>

      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center px-5 text-center" style={{ paddingTop: portrait ? 76 : 88 }}>
        <p className="font-semibold uppercase" style={{ fontSize: "clamp(10px, 0.9vw, 12px)", letterSpacing: "0.42em", color: GOLD, animation: "eventsRise 0.9s ease-out 0.2s both" }}>
          {EVENT_ROOM.eyebrow}
        </p>
        <h1 className="mt-3 font-semibold text-white" style={{ fontSize: "clamp(1.6rem, 4.2vw, 3rem)", lineHeight: 1.08, letterSpacing: "-0.01em", maxWidth: "22ch", textShadow: "0 4px 40px rgba(0,0,0,0.6)", animation: "eventsRise 0.9s ease-out 0.35s both" }}>
          {EVENT_ROOM.title}
        </h1>
        <div className="mt-4 h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, animation: "eventsRise 0.9s ease-out 0.45s both" }} />
        {!portrait && (
          <p className="mt-4 text-white/75" style={{ fontSize: "clamp(14px, 1.05vw, 16px)", maxWidth: "56ch", lineHeight: 1.6, animation: "eventsRise 0.9s ease-out 0.55s both" }}>
            {EVENT_ROOM.intro}
          </p>
        )}
      </div>

      {/* Carousel */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: portrait ? "36%" : "44%", bottom: portrait ? 84 : 76 }}>
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          style={{ gap: portrait ? 16 : 28, padding: portrait ? "16px 10vw 24px" : "20px 18vw 30px", scrollbarWidth: "none", perspective: 1400, msOverflowStyle: "none" } as CSSProperties}
        >
          {EVENTS.map((ev, i) => (
            <EventCard key={ev.id} event={ev} index={i} focused={i === index} portrait={portrait} onOpen={() => setActive(ev)} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-2 flex items-center gap-4" style={{ animation: "eventsRise 0.9s ease-out 0.9s both" }}>
          <NavButton dir="prev" onClick={() => scrollTo(index - 1)} disabled={index === 0} />
          <div className="flex items-center gap-2">
            {EVENTS.map((ev, i) => (
              <button
                key={ev.id}
                type="button"
                aria-label={`Go to ${ev.title}`}
                onClick={() => scrollTo(i)}
                className="rounded-full transition"
                style={{ width: i === index ? 22 : 6, height: 6, background: i === index ? GOLD : "rgba(255,255,255,0.35)", transitionDuration: "350ms" }}
              />
            ))}
          </div>
          <NavButton dir="next" onClick={() => scrollTo(index + 1)} disabled={index === EVENTS.length - 1} />
        </div>
      </div>

      {/* Footer actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 px-4" style={{ paddingBottom: "max(18px, env(safe-area-inset-bottom))", animation: "eventsRise 0.9s ease-out 1s both" }}>
        <a
          href={EVENT_ROOM.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="aradi-silver-lining border-0 px-6 py-2.5 font-semibold text-white uppercase transition hover:brightness-110"
          style={{ fontSize: 10.5, letterSpacing: "0.28em", background: "linear-gradient(180deg, rgba(37,99,235,0.85), rgba(29,78,216,0.95))" }}
        >
          Follow on Instagram
        </a>
        <button type="button" onClick={onBack} className="px-6 py-3 font-semibold text-white uppercase transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7c98a]" style={{ fontSize: 11.5, letterSpacing: "0.3em", background: "linear-gradient(180deg, rgba(20,31,63,0.92), rgba(10,15,31,0.96))", border: "1px solid rgba(231,201,138,0.85)", borderRadius: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
          {EVENT_ROOM.back}
        </button>
      </div>

      {active && <EventDetail event={active} portrait={portrait} onClose={() => setActive(null)} />}
    </div>
  );
}

function NavButton({ dir, onClick, disabled }: { dir: "prev" | "next"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous event" : "Next event"}
      className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:brightness-125 disabled:opacity-30"
      style={{ background: "rgba(10,15,31,0.55)", border: `1px solid rgba(231,201,138,0.45)`, backdropFilter: "blur(8px)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: dir === "prev" ? "rotate(180deg)" : undefined }}>
        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Glass card with 3D tilt on hover. No media on the face: images and videos open on click. */
function EventCard({ event, index, focused, portrait, onOpen }: { event: EventItem; index: number; focused: boolean; portrait: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 });
  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (0.5 - py) * 10, y: (px - 0.5) * 12, gx: px * 100, gy: py * 100 });
  };
  const reset = () => setTilt({ x: 0, y: 0, gx: 50, gy: 50 });
  const w = portrait ? "min(78vw, 340px)" : "min(30vw, 400px)";
  const mediaCount = event.media.length;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="group relative shrink-0 snap-center text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7c98a]"
      style={{
        width: w,
        aspectRatio: portrait ? "4 / 5" : "3 / 4",
        transformStyle: "preserve-3d",
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${focused ? 1 : 0.94})`,
        transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms",
        opacity: focused ? 1 : 0.72,
        animation: `eventCardIn 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + index * 0.09}s both`,
      }}
      aria-label={`${event.title} — open`}
    >
      <span className="absolute inset-0 rounded-[14px]" style={{ background: "linear-gradient(160deg, rgba(37,99,235,0.28) 0%, rgba(10,15,31,0.78) 55%, rgba(10,15,31,0.88) 100%)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(231,201,138,0.35)", boxShadow: focused ? "0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(231,201,138,0.12), inset 0 1px 0 rgba(255,255,255,0.14)" : "0 20px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)" }} aria-hidden />
      {/* gold sheen that follows the cursor */}
      <span className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition group-hover:opacity-100" style={{ background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(231,201,138,0.22), transparent 45%)`, transitionDuration: "300ms" }} aria-hidden />
      {/* inner frame line */}
      <span className="pointer-events-none absolute rounded-[10px]" style={{ inset: 10, border: "1px solid rgba(255,255,255,0.08)" }} aria-hidden />

      <span className="relative flex h-full flex-col justify-between" style={{ padding: portrait ? 22 : 28, transform: "translateZ(30px)" }}>
        <span className="flex items-start justify-between">
          <span className="font-semibold uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: GOLD }}>{event.category}</span>
          <span className="font-semibold" style={{ fontSize: 34, lineHeight: 1, color: "rgba(255,255,255,0.14)", fontVariantNumeric: "tabular-nums" }}>{String(index + 1).padStart(2, "0")}</span>
        </span>
        <span className="flex flex-col">
          <span className="uppercase text-white/60" style={{ fontSize: 10.5, letterSpacing: "0.22em" }}>{event.client} · {event.date}</span>
          <span className="mt-2 font-semibold text-white" style={{ fontSize: portrait ? 22 : "clamp(20px, 1.7vw, 26px)", lineHeight: 1.15, letterSpacing: "-0.01em" }}>{event.title}</span>
          <span className="mt-3 text-white/70" style={{ fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.summary}</span>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.26em", color: GOLD }}>
            {EVENT_ROOM.openLabel}
            {mediaCount > 0 && <span className="rounded-sm px-1.5 py-0.5 text-white" style={{ fontSize: 9, letterSpacing: "0.12em", background: "rgba(37,99,235,0.7)" }}>{mediaCount} {mediaCount === 1 ? "media" : "media"}</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="transition group-hover:translate-x-1"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </span>
      </span>
    </button>
  );
}

/** Full-screen detail with a media gallery (images + reels). Media only appears here. */
function EventDetail({ event, portrait, onClose }: { event: EventItem; portrait: boolean; onClose: () => void }) {
  return (
    <MediaDetail
      eyebrow={`${event.category} · ${event.client} · ${event.date}`}
      title={event.title}
      summary={event.summary}
      details={event.details}
      links={event.links}
      media={event.media}
      cover={event.cover}
      portrait={portrait}
      closeLabel={EVENT_ROOM.close}
      onClose={onClose}
    />
  );
}

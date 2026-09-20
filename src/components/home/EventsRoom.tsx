"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { EVENTS, EVENT_ROOM, type EventItem, type EventMedia } from "@/config/events";
import { SITE } from "@/config/site";

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
        <button type="button" onClick={onBack} className="px-4 py-2.5 text-white/70 uppercase transition hover:text-white" style={{ fontSize: 10.5, letterSpacing: "0.28em" }}>
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
  const gallery: EventMedia[] = event.media.length ? event.media : event.cover ? [{ type: "image", src: event.cover }] : [];
  const [current, setCurrent] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const item = gallery[current];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(gallery.length - 1, c + 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery.length]);

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={event.title} onClick={onClose} style={{ animation: "eventsRoomIn 0.35s ease-out both" }}>
      <div className="absolute inset-0" style={{ background: "rgba(4,8,20,0.8)", backdropFilter: "blur(10px)" }} aria-hidden />
      <div
        className={`relative flex overflow-hidden ${portrait ? "h-full w-full flex-col" : "flex-row"}`}
        style={{
          width: portrait ? "100%" : "min(92vw, 1180px)",
          height: portrait ? "100%" : "min(86vh, 760px)",
          borderRadius: portrait ? 0 : 14,
          background: "linear-gradient(160deg, rgba(20,31,63,0.97) 0%, rgba(10,15,31,0.99) 100%)",
          border: portrait ? "none" : "1px solid rgba(231,201,138,0.35)",
          boxShadow: "0 50px 120px rgba(0,0,0,0.7)",
          animation: "projPanelRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media stage */}
        <div className={`relative ${portrait ? "w-full" : "h-full"} flex items-center justify-center overflow-hidden`} style={{ flex: portrait ? "0 0 52%" : "0 0 58%", background: "#05091a" }}>
          {item && !failed[item.src] ? (
            item.type === "video" ? (
              <video key={item.src} src={item.src} className="h-full w-full object-contain" controls autoPlay muted playsInline preload="metadata" onError={() => setFailed((f) => ({ ...f, [item.src]: true }))} />
            ) : (
              <img key={item.src} src={item.src} alt={item.caption ?? event.title} className="h-full w-full object-contain" onError={() => setFailed((f) => ({ ...f, [item.src]: true }))} style={{ animation: "eventsRoomIn 0.5s ease-out both" }} />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: "linear-gradient(160deg, rgba(37,99,235,0.3), rgba(10,15,31,0.95))" }}>
              <img src={SITE.logoOnDark} alt="" className="w-[60%] max-w-[360px] opacity-80" />
              <p className="text-white/55" style={{ fontSize: 12, letterSpacing: "0.2em" }}>PHOTOS & REELS COMING SOON</p>
            </div>
          )}
          {gallery.length > 1 && (
            <>
              <button type="button" aria-label="Previous media" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white disabled:opacity-30" style={{ background: "rgba(10,15,31,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: "rotate(180deg)" }}><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" aria-label="Next media" onClick={() => setCurrent((c) => Math.min(gallery.length - 1, c + 1))} disabled={current === gallery.length - 1} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white disabled:opacity-30" style={{ background: "rgba(10,15,31,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {gallery.map((m, i) => (
                  <button key={m.src + i} type="button" aria-label={`Media ${i + 1}`} onClick={() => setCurrent(i)} className="rounded-full" style={{ width: i === current ? 18 : 6, height: 6, background: i === current ? GOLD : "rgba(255,255,255,0.4)", transition: "width 300ms" }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Text */}
        <div className="relative min-h-0 flex-1 overflow-y-auto" style={{ padding: portrait ? "20px 20px 28px" : "36px 40px" }}>
          <button type="button" onClick={onClose} aria-label={EVENT_ROOM.close} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:brightness-125" style={{ background: "rgba(10,15,31,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <p className="font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.3em", color: GOLD }}>{event.category} · {event.client} · {event.date}</p>
          <h2 className="mt-3 font-semibold text-white" style={{ fontSize: portrait ? 24 : "clamp(1.5rem, 2.4vw, 2.2rem)", lineHeight: 1.12, letterSpacing: "-0.01em", paddingRight: 44 }}>{event.title}</h2>
          <div className="mt-4 h-px w-12" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          <p className="mt-4 text-white/80" style={{ fontSize: portrait ? 15 : 16, lineHeight: 1.6 }}>{event.summary}</p>
          {event.details.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2.5">
              {event.details.map((d) => (
                <li key={d} className="flex gap-3 text-white/75" style={{ fontSize: 14, lineHeight: 1.55 }}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          )}
          {event.links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {event.links.map((l) => (
                <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-sm px-4 py-2 font-semibold text-white uppercase transition hover:brightness-110" style={{ fontSize: 10.5, letterSpacing: "0.22em", background: "rgba(37,99,235,0.85)" }}>
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

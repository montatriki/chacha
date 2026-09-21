"use client";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";

const GOLD = "#e7c98a";

export interface DetailMedia { type: "image" | "video"; src: string; caption?: string; poster?: string }
export interface DetailLink { label: string; url: string }

/**
 * Full-screen detail sheet with a media gallery (photos + reels) and a text column.
 * Shared by the Events room (one event) and the Clients panel (one client).
 */
export function MediaDetail({
  eyebrow,
  title,
  summary,
  details = [],
  links = [],
  media,
  cover,
  portrait,
  closeLabel = "Close",
  emptyLabel = "PHOTOS & REELS COMING SOON",
  onClose,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  details?: string[];
  links?: DetailLink[];
  media: DetailMedia[];
  cover?: string;
  portrait: boolean;
  closeLabel?: string;
  emptyLabel?: string;
  onClose: () => void;
}) {
  const gallery: DetailMedia[] = media.length ? media : cover ? [{ type: "image", src: cover }] : [];
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

  const navBtn = "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white disabled:opacity-30";
  const navStyle = { background: "rgba(10,15,31,0.6)", border: "1px solid rgba(255,255,255,0.2)" };

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title} onClick={onClose} style={{ animation: "eventsRoomIn 0.35s ease-out both" }}>
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
              <video key={item.src} src={item.src} poster={item.poster} className="h-full w-full object-contain" controls autoPlay muted playsInline preload="metadata" onError={() => setFailed((f) => ({ ...f, [item.src]: true }))} />
            ) : (
              <img key={item.src} src={item.src} alt={item.caption ?? title} className="h-full w-full object-contain" onError={() => setFailed((f) => ({ ...f, [item.src]: true }))} style={{ animation: "eventsRoomIn 0.5s ease-out both" }} />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: "linear-gradient(160deg, rgba(37,99,235,0.3), rgba(10,15,31,0.95))" }}>
              <img src={SITE.logoOnDark} alt="" className="w-[60%] max-w-[360px] opacity-80" />
              <p className="text-white/55" style={{ fontSize: 12, letterSpacing: "0.2em" }}>{emptyLabel}</p>
            </div>
          )}
          {item?.caption && !failed[item.src] && (
            /* phones: the site logo sits over the top-left corner, so the caption goes above the dots instead */
            <p className="pointer-events-none absolute left-0 right-0 px-4 py-3 text-white/85" style={portrait ? { bottom: 14, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", background: "linear-gradient(0deg, rgba(5,9,26,0.75), transparent)" } : { top: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", background: "linear-gradient(180deg, rgba(5,9,26,0.75), transparent)" }}>{item.caption}</p>
          )}
          {gallery.length > 1 && (
            <>
              <button type="button" aria-label="Previous media" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className={`${navBtn} left-3`} style={navStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: "rotate(180deg)" }}><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" aria-label="Next media" onClick={() => setCurrent((c) => Math.min(gallery.length - 1, c + 1))} disabled={current === gallery.length - 1} className={`${navBtn} right-3`} style={navStyle}>
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
          <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:brightness-125" style={{ background: "rgba(10,15,31,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <p className="font-semibold uppercase" style={{ fontSize: 10.5, letterSpacing: "0.3em", color: GOLD, paddingRight: 44 }}>{eyebrow}</p>
          <h2 className="mt-3 font-semibold text-white" style={{ fontSize: portrait ? 24 : "clamp(1.5rem, 2.4vw, 2.2rem)", lineHeight: 1.12, letterSpacing: "-0.01em", paddingRight: 44 }}>{title}</h2>
          <div className="mt-4 h-px w-12" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          <p className="mt-4 text-white/80" style={{ fontSize: portrait ? 15 : 16, lineHeight: 1.6 }}>{summary}</p>
          {details.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2.5">
              {details.map((d) => (
                <li key={d} className="flex gap-3 text-white/75" style={{ fontSize: 14, lineHeight: 1.55 }}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          )}
          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {links.map((l) => (
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

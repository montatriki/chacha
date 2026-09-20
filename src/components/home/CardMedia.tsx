"use client";
import { useEffect, useRef, useState } from "react";
import type { CardMedia as Media } from "@/config/hallway";

const IMAGE_MS = 5000;
const VIDEO_MAX_MS = 16000;

/**
 * Rotating banner for a gallery card: photos hold for a few seconds, muted videos play
 * (capped) and everything crossfades. A single item just renders.
 */
export function CardMedia({ items, className, drift = false, onLabel }: { items: Media[]; className?: string; drift?: boolean; onLabel?: (label: string | undefined) => void }) {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const item = items[index];

  useEffect(() => {
    onLabel?.(item?.label);
  }, [index, item, onLabel]);

  useEffect(() => {
    if (items.length < 2) return;
    const next = () => {
      setPrev(index);
      setIndex((index + 1) % items.length);
    };
    const id = window.setTimeout(next, item.type === "video" ? VIDEO_MAX_MS : IMAGE_MS);
    const v = videoRef.current;
    const onEnded = () => { window.clearTimeout(id); next(); };
    v?.addEventListener("ended", onEnded);
    return () => { window.clearTimeout(id); v?.removeEventListener("ended", onEnded); };
  }, [index, items.length, item]);

  // Only decode video while the card is actually on screen: a scrolled-away card's video is paused,
  // so a grid with several client videos never plays more than the visible ones at once.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.05 });
    io.observe(v);
    return () => io.disconnect();
  }, [index, item]);

  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), 900);
    return () => window.clearTimeout(id);
  }, [prev]);

  const render = (m: Media, key: string, fading: boolean) =>
    m.type === "video" ? (
      <video key={key} ref={fading ? undefined : videoRef} src={m.src} className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`} muted playsInline autoPlay loop={items.length < 2} preload="metadata" style={{ opacity: fading ? 0 : 1, transition: "opacity 900ms ease" }} />
    ) : (
      <img key={key} src={m.src} alt={m.label ?? ""} className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`} style={{ opacity: fading ? 0 : 1, transition: "opacity 900ms ease", animation: drift ? "eventsBgDrift 14s ease-in-out infinite alternate" : undefined }} />
    );

  if (!item) return null;
  return (
    <>
      {prev !== null && items[prev] && render(items[prev], `prev-${prev}`, true)}
      {render(item, `cur-${index}`, false)}
    </>
  );
}

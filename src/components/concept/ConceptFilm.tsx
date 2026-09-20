"use client";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  CONCEPT_DATA,
  CONCEPT_FILM,
  CONCEPT_MIN_WIDTH_DETAIL,
  CONCEPT_MIN_WIDTH_WIDE,
  CONCEPT_SCENES,
  OVERLAY_VARS,
  conceptTranscript,
  type ConceptData,
} from "@/config/concept";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useVideoCover, type FitMode } from "@/hooks/useVideoCover";
import { cn } from "@/lib/cn";
import { buildConceptOverlays, resolvePos, windowOpacity, type OverlayAnchor, type OverlayItem } from "@/lib/concept-overlays";

const FILM_W = CONCEPT_FILM.width;
const FILM_H = CONCEPT_FILM.height;
const LIFT_PX = 4;
const BLUR_PX = 2.5;

const ANCHOR_TRANSFORM: Record<OverlayAnchor, string> = {
  center: "translate(-50%, -50%)",
  left: "translate(0, -50%)",
  right: "translate(-100%, -50%)",
  "left-bottom": "translate(0, -100%)",
  "center-bottom": "translate(-50%, -100%)",
};

const fontSize = ([px, min]: [number, number]) => `max(${min}px, ${((px / FILM_W) * 100).toFixed(4)}cqw)`;

function itemStyle(item: OverlayItem, enabled: boolean): CSSProperties {
  return {
    position: "absolute",
    display: enabled ? "block" : "none",
    opacity: 0,
    whiteSpace: "nowrap",
    lineHeight: 1.1,
    fontSize: fontSize(item.size),
    fontWeight: item.weight ?? 500,
    letterSpacing: item.tracking,
    color: item.color,
    textTransform: item.uppercase ? "uppercase" : undefined,
    textShadow: item.onLight ? "0 1px 0 rgba(255, 255, 255, 0.28)" : "0 1px 5px rgba(0, 0, 0, 0.5)",
    maxWidth: item.maxWidthPx ? `${((item.maxWidthPx / FILM_W) * 100).toFixed(4)}%` : undefined,
    overflow: item.maxWidthPx ? "hidden" : undefined,
    transform: ANCHOR_TRANSFORM[item.anchor],
    willChange: "opacity, transform",
  };
}

const SCENE_TITLE_SIZE = "max(13px, 1.55cqw)";
const SCENE_BODY_SIZE = "max(9px, 0.82cqw)";
const SCENE_FOOTER_SIZE = "max(7.5px, 0.62cqw)";

type Snapshot = { o: number; x: number; y: number; text: string } | null;

export function ConceptFilm({
  className,
  fill = false,
  data = CONCEPT_DATA,
  fit = "cover",
  loop = true,
  autoPlay = true,
  onEnded,
  onPlayingChange,
  playbackRate = 1,
}: {
  className?: string;
  fill?: boolean;
  data?: ConceptData;
  fit?: FitMode;
  loop?: boolean;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  playbackRate?: number;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedRef = useRef(false);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const snapshots = useRef<Snapshot[]>([]);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();
  const { cover } = useVideoCover(stageRef, FILM_W / FILM_H, 0.5, 0.5, fit);
  const items = useMemo(() => buildConceptOverlays(data, reducedMotion), [data, reducedMotion]);
  const transcript = useMemo(() => conceptTranscript(data), [data]);
  const drawnW = cover.drawnW;
  const unit = drawnW > 0 ? drawnW / FILM_W : 0;
  const enabled = useMemo(
    () => items.map((it) => (it.tier === "wide" ? drawnW >= CONCEPT_MIN_WIDTH_WIDE : drawnW >= CONCEPT_MIN_WIDTH_DETAIL)),
    [items, drawnW],
  );

  const tryStart = () => {
    const v = videoRef.current;
    if (!autoPlay || startedRef.current || !v) return;
    v.muted = true;
    v.playbackRate = playbackRate;
    const p = v.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        startedRef.current = true;
      }).catch(() => {});
    } else {
      startedRef.current = true;
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = playbackRate;
    tryStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, playbackRate]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      startedRef.current = true;
      v.muted = true;
      v.playbackRate = playbackRate;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      v.pause();
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || unit <= 0) return;
    const resetSnapshots = () => {
      snapshots.current = items.map(() => null);
    };
    resetSnapshots();
    let raf = 0;
    let lastT = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = v.currentTime;
      const rewound = t < lastT - 0.05;
      if (t === lastT && !rewound) return;
      if (rewound) resetSnapshots();
      lastT = t;
      for (let i = 0; i < items.length; i++) {
        const el = itemRefs.current[i];
        if (!el || !enabled[i]) continue;
        const item = items[i];
        const prev = snapshots.current[i];
        const o = windowOpacity(t, item.window);
        if (o <= 0) {
          if (!prev || prev.o !== 0) {
            el.style.opacity = "0";
            snapshots.current[i] = { o: 0, x: NaN, y: NaN, text: prev?.text ?? "" };
          }
          continue;
        }
        const { x, y } = resolvePos(item.pos, t);
        const text = typeof item.text === "function" ? item.text(t) : item.text;
        if (!prev || prev.text !== text) el.textContent = text;
        if (!prev || prev.x !== x) el.style.left = `${((x / FILM_W) * 100).toFixed(4)}%`;
        if (!prev || prev.y !== y) el.style.top = `${((y / FILM_H) * 100).toFixed(4)}%`;
        if (!prev || prev.o !== o) {
          const rest = reducedMotion ? 0 : 1 - o;
          const lift = rest * LIFT_PX * unit;
          const blur = rest * BLUR_PX * unit;
          el.style.opacity = `${o}`;
          el.style.transform = `${ANCHOR_TRANSFORM[item.anchor]} translate3d(0, ${lift.toFixed(2)}px, 0)`;
          el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
        }
        snapshots.current[i] = { o, x, y, text };
      }
      for (let i = 0; i < CONCEPT_SCENES.length; i++) {
        const el = sceneRefs.current[i];
        if (!el) continue;
        const o = windowOpacity(t, CONCEPT_SCENES[i].window);
        const rest = reducedMotion ? 0 : 1 - o;
        el.style.opacity = `${o}`;
        el.style.transform = `${el.dataset.anchor} translate3d(0, ${(rest * 6 * unit).toFixed(2)}px, 0)`;
        el.style.filter = rest > 0.02 ? `blur(${(rest * 3 * unit).toFixed(2)}px)` : "none";
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items, enabled, unit, reducedMotion]);

  return (
    <div
      ref={stageRef}
      className={cn("relative overflow-hidden", fill ? "h-[100dvh] w-full" : "w-full", className)}
      style={fill ? undefined : { aspectRatio: `${FILM_W} / ${FILM_H}` }}
    >
      <video
        ref={videoRef}
        className={cn("absolute inset-0 h-full w-full object-center", fit === "contain" ? "object-contain" : "object-cover")}
        src={CONCEPT_FILM.src}
        poster={CONCEPT_FILM.poster}
        muted
        playsInline
        loop={loop}
        autoPlay={autoPlay}
        preload="auto"
        controls={false}
        onCanPlay={tryStart}
        onPlay={() => {
          setPlaying(true);
          onPlayingChange?.(true);
        }}
        onPause={() => {
          setPlaying(false);
          onPlayingChange?.(false);
        }}
        onEnded={() => {
          if (!loop) onEnded?.();
        }}
      />
      {drawnW > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute font-sans"
          style={{
            left: cover.offsetX,
            top: cover.offsetY,
            width: cover.drawnW,
            height: cover.drawnH,
            containerType: "size",
            fontVariantNumeric: "tabular-nums",
            fontFeatureSettings: '"tnum" 1',
            ...OVERLAY_VARS,
          } as CSSProperties}
        >
          {items.map((item, i) => (
            <span
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              style={itemStyle(item, enabled[i])}
            />
          ))}
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 font-sans" style={{ containerType: "size", ...OVERLAY_VARS } as CSSProperties}>
        {CONCEPT_SCENES.map((scene, i) => {
          const anchor = scene.align === "center" ? "translate(-50%, 0)" : scene.align === "right" ? "translate(-100%, 0)" : "translate(0, 0)";
          return (
            <div
              key={scene.id}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
              data-anchor={anchor}
              style={{
                position: "absolute",
                left: `${scene.x}%`,
                top: `${scene.y}%`,
                width: `${scene.widthPct}%`,
                transform: anchor,
                textAlign: scene.align,
                opacity: 0,
                willChange: "opacity, transform",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.55), 0 2px 18px rgba(0, 0, 0, 0.5)",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "2.6em",
                  height: 1,
                  marginBottom: "1.1em",
                  marginLeft: scene.align === "center" ? "auto" : undefined,
                  marginRight: scene.align === "center" ? "auto" : scene.align === "right" ? 0 : undefined,
                  marginInlineStart: scene.align === "right" ? "auto" : undefined,
                  background: "linear-gradient(90deg, var(--overlay-gold), transparent)",
                  fontSize: SCENE_BODY_SIZE,
                  opacity: 0.75,
                }}
              />
              <h3
                style={{
                  margin: 0,
                  whiteSpace: "pre-line",
                  fontSize: SCENE_TITLE_SIZE,
                  fontWeight: 500,
                  lineHeight: 1.22,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--overlay-ivory)",
                }}
              >
                {scene.title}
              </h3>
              <p style={{ margin: "0.85em 0 0", fontSize: SCENE_BODY_SIZE, fontWeight: 400, lineHeight: 1.55, letterSpacing: "0.015em", color: "rgba(229,231,235, 0.82)" }}>
                {scene.body}
              </p>
              {scene.footer && (
                <p
                  style={{
                    margin: "1.6em 0 0",
                    fontSize: SCENE_FOOTER_SIZE,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "var(--overlay-gold)",
                  }}
                >
                  {scene.footer}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause the concept film" : "Play the concept film"}
        className="group absolute bottom-[4%] left-1/2 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-[#2563eb]/40 bg-black/25 text-[#ffffff] backdrop-blur-md transition duration-300 hover:border-[#2563eb]/80 hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
      >
        {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" /> : <Play className="ml-0.5 h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" />}
      </button>
      <p className="sr-only">{transcript}</p>
    </div>
  );
}

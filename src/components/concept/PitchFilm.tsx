"use client";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BODY_REVEAL_END,
  NODE_TWEAKS,
  PAUSE_POINTS,
  PITCH_CHAPTERS,
  PITCH_FILM,
  PITCH_NODES,
  PITCH_PALETTE,
  PITCH_SCENES,
  PITCH_STORAGE_KEY,
  SCENE_LEAD,
  SCENE_TAIL,
  type AnchorKey,
  type NodeTweak,
  type PitchNode,
  type PitchScene,
} from "@/config/pitch";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useVideoCover, type CoverBox } from "@/hooks/useVideoCover";
import { sampleKeyframes, sceneOpacity, smooth, typewriter } from "@/lib/pitch-math";

declare global {
  interface Window {
    __pitchSeek?: (t: number) => void;
  }
}

const FILM_W = PITCH_FILM.width;
const FILM_H = PITCH_FILM.height;

type TweakMap = Record<string, NodeTweak>;

const TWEAK_FIELDS: { key: keyof NodeTweak; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "dx", label: "X nudge", min: -200, max: 200, step: 1, unit: "px" },
  { key: "dy", label: "Y nudge", min: -200, max: 200, step: 1, unit: "px" },
  { key: "fontScale", label: "Text size", min: 0.4, max: 2.5, step: 0.01, unit: "×" },
  { key: "scale", label: "Block scale", min: 0.4, max: 2.5, step: 0.01, unit: "×" },
  { key: "rotate", label: "Rotate (in-plane)", min: -30, max: 30, step: 0.5, unit: "°" },
  { key: "rotateX", label: "Tilt X", min: -60, max: 60, step: 0.5, unit: "°" },
  { key: "rotateY", label: "Tilt Y", min: -60, max: 60, step: 0.5, unit: "°" },
  { key: "perspective", label: "Perspective", min: 0, max: 4000, step: 25, unit: "px" },
  { key: "curve", label: "Curvature", min: -60, max: 60, step: 1, unit: "px" },
];
const TWEAK_DEFAULTS: Required<NodeTweak> = { dx: 0, dy: 0, fontScale: 1, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, perspective: 0, curve: 0 };

function AlignPanel({
  nodes,
  time,
  duration,
  selectedId,
  tweaks,
  onSelect,
  onChange,
  onResetNode,
  onResetAll,
  onSeek,
  playing,
  onTogglePlay,
}: {
  nodes: PitchNode[];
  time: number;
  duration: number;
  selectedId: string | null;
  tweaks: TweakMap;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: NodeTweak) => void;
  onResetNode: (id: string) => void;
  onResetAll: () => void;
  onSeek: (t: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const visibleNodes = useMemo(
    () =>
      nodes.filter((n) => {
        const start = n.keyframes[0]?.time ?? 0;
        const end = n.keyframes[n.keyframes.length - 1]?.time ?? 0;
        return time >= start - 0.15 && time <= end + 0.15;
      }),
    [nodes, time],
  );
  const current = selectedId ? (tweaks[selectedId] ?? {}) : null;
  const copyJson = () => {
    const out: TweakMap = {};
    Object.entries(tweaks).forEach(([id, t]) => {
      const diff: NodeTweak = {};
      (Object.keys(TWEAK_DEFAULTS) as (keyof NodeTweak)[]).forEach((k) => {
        const v = t[k];
        if (v !== undefined && v !== TWEAK_DEFAULTS[k]) diff[k] = v;
      });
      if (Object.keys(diff).length) out[id] = diff;
    });
    const json = JSON.stringify(out, null, 2);
    navigator.clipboard?.writeText(json);
    console.log("[pitch tweaks]\n" + json);
  };

  return (
    <aside className="pointer-events-auto fixed right-0 top-0 z-[100] flex h-full w-[320px] flex-col gap-3 overflow-y-auto border-l border-white/15 bg-[#0a0f1f]/95 p-3 text-[11px] text-white/85 backdrop-blur">
      <div className="flex items-center justify-between">
        <strong className="text-[12px] tracking-[0.16em] text-[#e5e7eb] uppercase">Align</strong>
        <button type="button" onClick={onTogglePlay} className="rounded border border-white/25 px-2 py-1 text-[10px] uppercase hover:bg-white/10">
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="tabular-nums text-white/60">
          t = {time.toFixed(2)}s / {duration.toFixed(2)}s
        </span>
        <input type="range" min={0} max={duration} step={1 / 24} value={time} onChange={(e) => onSeek(Number(e.target.value))} />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-white/50">Overlays at this frame ({visibleNodes.length})</span>
        <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
          {visibleNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id === selectedId ? null : n.id)}
              className={`truncate rounded px-1.5 py-1 text-left ${n.id === selectedId ? "bg-[#7c3aed]/20 text-[#a78bfa]" : "hover:bg-white/10"}`}
            >
              {n.id}
              <span className="ml-1 text-white/35">{n.lines[0]?.text?.slice(0, 18) ?? (n.image ? "[image]" : "")}</span>
            </button>
          ))}
        </div>
      </div>
      {selectedId && current ? (
        <div className="flex flex-col gap-2 border-t border-white/15 pt-2">
          <div className="flex items-center justify-between">
            <strong className="truncate text-[#a78bfa]">{selectedId}</strong>
            <button type="button" onClick={() => onResetNode(selectedId)} className="rounded border border-white/25 px-2 py-0.5 text-[10px] uppercase hover:bg-white/10">
              Reset
            </button>
          </div>
          {TWEAK_FIELDS.map((f) => {
            const value = current[f.key] ?? TWEAK_DEFAULTS[f.key];
            return (
              <label key={f.key} className="flex flex-col gap-0.5">
                <span className="flex justify-between text-white/60">
                  {f.label}
                  <span className="tabular-nums text-white">
                    {value}
                    {f.unit}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input type="range" className="flex-1" min={f.min} max={f.max} step={f.step} value={value} onChange={(e) => onChange(selectedId, { [f.key]: Number(e.target.value) })} />
                  <input
                    type="number"
                    className="w-16 rounded border border-white/20 bg-black/40 px-1 py-0.5 text-right tabular-nums"
                    step={f.step}
                    value={value}
                    onChange={(e) => onChange(selectedId, { [f.key]: Number(e.target.value) })}
                  />
                </div>
              </label>
            );
          })}
          <p className="text-white/40">Click an overlay on the film to select it. Arrow keys nudge X/Y, Shift+arrows by 10.</p>
        </div>
      ) : (
        <p className="border-t border-white/15 pt-2 text-white/45">Select an overlay above, or click one on the film.</p>
      )}
      <div className="mt-auto flex gap-2 border-t border-white/15 pt-2">
        <button type="button" onClick={copyJson} className="flex-1 rounded border border-[#e5e7eb]/50 px-2 py-1.5 text-[10px] tracking-[0.14em] text-[#e5e7eb] uppercase hover:bg-[#e5e7eb]/10">
          Copy JSON
        </button>
        <button type="button" onClick={onResetAll} className="rounded border border-white/25 px-2 py-1.5 text-[10px] uppercase hover:bg-white/10">
          Reset all
        </button>
      </div>
      <p className="text-white/35">
        Values persist locally. Paste the copied JSON over <code className="text-white/60">nodeTweaks</code> in public/data/content/pitch.json to make them permanent.
      </p>
    </aside>
  );
}

function OverlayNode({
  node,
  time,
  cover,
  hideSmall,
  reducedMotion,
  tweak,
  onSelect,
  selected,
}: {
  node: PitchNode;
  time: number;
  cover: CoverBox;
  hideSmall: boolean;
  reducedMotion: boolean;
  tweak: NodeTweak;
  onSelect?: (id: string) => void;
  selected: boolean;
}) {
  const start = node.keyframes[0]?.time ?? 0;
  const end = node.keyframes[node.keyframes.length - 1]?.time ?? 0;
  if (time < start - 0.05 || time > end + 0.05 || (hideSmall && !node.mobileKeep)) return null;
  const local = node.staggerMs ? time - node.staggerMs / 1000 : time;
  if (local < start) return null;
  const f = sampleKeyframes(local, node.keyframes);
  if ((f.opacity ?? 0) < 0.02) return null;
  const left = cover.offsetX + (f.x / FILM_W) * cover.drawnW;
  const top = cover.offsetY + (f.y / FILM_H) * cover.drawnH;
  const unit = cover.drawnW / FILM_W;
  const rotate = (f.rotate ?? 0) + (node.groupRotate ?? 0) + (tweak.rotate ?? 0);
  const transform3d = `${tweak.perspective ? `perspective(${tweak.perspective * unit}px) ` : ""}rotateX(${tweak.rotateX ?? 0}deg) rotateY(${tweak.rotateY ?? 0}deg) rotate(${rotate}deg)`;
  const curve = (tweak.curve ?? 0) * unit;
  return (
    <div
      className={`video-ui-text absolute ${onSelect ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
      aria-hidden
      onClick={onSelect ? () => onSelect(node.id) : undefined}
      style={{
        outline: selected ? "1px solid #7c3aed" : undefined,
        outlineOffset: 3,
        left: left + (tweak.dx ?? 0) * unit,
        top: top + (tweak.dy ?? 0) * unit,
        transform: `translate(-50%, -50%) ${transform3d} scale(${(f.scale ?? 1) * (tweak.scale ?? 1)})`,
        transformStyle: "preserve-3d",
        opacity: f.opacity,
        transition: reducedMotion ? undefined : "opacity 200ms ease-out",
        textAlign: node.align ?? "center",
        maxWidth: node.maxWidth ? node.maxWidth * unit : undefined,
        gap: 5 * unit,
        display: "flex",
        flexDirection: "column",
        alignItems: node.align === "left" ? "flex-start" : node.align === "right" ? "flex-end" : "center",
      }}
    >
      {node.image && <img src={node.image.src} alt={node.image.alt ?? ""} style={{ width: node.image.width * unit, height: "auto", opacity: node.image.opacity ?? 1 }} />}
      {node.lines.map((line, i) => (
        <span
          key={`${node.id}-${i}`}
          style={{
            color: PITCH_PALETTE[line.tone ?? "ivory"],
            fontSize: Math.max(7, (line.size ?? 12) * (tweak.fontScale ?? 1) * unit),
            fontWeight: line.weight ?? 500,
            letterSpacing: line.tracking,
            textTransform: line.uppercase ? "uppercase" : undefined,
            whiteSpace: node.maxWidth ? "normal" : "nowrap",
          }}
        >
          {curve
            ? [...line.text].map((ch, ci, all) => {
                const t = all.length > 1 ? ci / (all.length - 1) - 0.5 : 0;
                const dy = curve * (t * t * 4 - 1) * -0.25;
                const rot = curve * t * 2;
                return (
                  <span key={ci} style={{ display: "inline-block", whiteSpace: "pre", transform: `translateY(${dy}px) rotate(${rot * 0.35}deg)` }}>
                    {ch}
                  </span>
                );
              })
            : line.text}
        </span>
      ))}
    </div>
  );
}

const ANCHORS: Record<AnchorKey, { x: string; y: string; tx: string; ty: string; align: "left" | "center" | "right" }> = {
  TL: { x: "5%", y: "13%", tx: "0", ty: "0", align: "left" },
  TC: { x: "50%", y: "12%", tx: "-50%", ty: "0", align: "center" },
  TR: { x: "95%", y: "13%", tx: "-100%", ty: "0", align: "right" },
  ML: { x: "5%", y: "50%", tx: "0", ty: "-50%", align: "left" },
  MR: { x: "95%", y: "50%", tx: "-100%", ty: "-50%", align: "right" },
  BL: { x: "5%", y: "88%", tx: "0", ty: "-100%", align: "left" },
  BC: { x: "50%", y: "88%", tx: "-50%", ty: "-100%", align: "center" },
  BR: { x: "95%", y: "88%", tx: "-100%", ty: "-100%", align: "right" },
};
const SCRIMS = {
  left: "linear-gradient(90deg, rgba(10,15,31,0.72) 0%, rgba(10,15,31,0.28) 45%, transparent 78%)",
  right: "linear-gradient(270deg, rgba(10,15,31,0.72) 0%, rgba(10,15,31,0.28) 45%, transparent 78%)",
  center: "radial-gradient(ellipse 78% 86% at 50% 50%, rgba(10,15,31,0.6) 0%, transparent 72%)",
};

function useFitHeadline(key: string) {
  const [fit, setFit] = useState(1);
  const nodeRef = useRef<HTMLElement | null>(null);
  const fitRef = useRef(1);
  fitRef.current = fit;
  const measure = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    let widest = 0;
    el.querySelectorAll<HTMLElement>("[data-measure]").forEach((m) => {
      widest = Math.max(widest, m.scrollWidth);
    });
    if (!widest) return;
    const natural = widest / (fitRef.current || 1);
    const next = Math.min(1, width / natural);
    if (Math.abs(next - fitRef.current) > 0.004) setFit(next);
  }, []);
  const setNode = useCallback(
    (el: HTMLElement | null) => {
      nodeRef.current = el;
      if (el) measure();
    },
    [measure],
  );
  useLayoutEffect(() => {
    setFit(1);
  }, [key]);
  useLayoutEffect(() => {
    measure();
  }, [measure, key, fit]);
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);
  return { fit, setNode };
}

function SceneCopy({ scene, time, reducedMotion, isMobile }: { scene: PitchScene; time: number; reducedMotion: boolean; isMobile: boolean }) {
  const start = scene.start - SCENE_LEAD;
  const span = scene.end + SCENE_TAIL - start;
  const raw = span > 0 ? (time - start) / span : -1;
  const inRange = raw >= -0.02 && raw <= 1.05;
  const progress = Math.min(1, Math.max(0, raw));
  const { fit, setNode } = useFitHeadline(`${scene.id}:${isMobile}`);
  if (span <= 0 || !inRange) return null;
  const opacity = sceneOpacity(progress);
  if (opacity < 0.02) return null;

  const lines = scene.headline.split("\n");
  const anchor = ANCHORS[scene.anchor];
  const HEAD_SPAN = 0.3;
  const BODY_START = 0.26;
  const BODY_SPAN = BODY_REVEAL_END - 0.26;
  const headProgress = reducedMotion ? 1 : smooth(0.04, 0.04 + HEAD_SPAN, progress);
  const bodyProgress = reducedMotion ? 1 : smooth(BODY_START, BODY_START + BODY_SPAN, progress);
  const totalChars = lines.reduce((n, l) => n + l.length, 0);
  let consumed = 0;
  const typed = lines.map((line) => {
    const from = consumed / totalChars;
    const to = (consumed + line.length) / totalChars;
    consumed += line.length;
    const p = (headProgress - from) / (to - from || 1);
    return typewriter(line, p);
  });

  const placement: CSSProperties = isMobile
    ? { left: "1rem", right: "1rem", bottom: "9vh", top: "auto", transform: "none", alignItems: "flex-start", textAlign: "left" }
    : {
        left: anchor.x,
        top: anchor.y,
        transform: `translate(${anchor.tx}, ${anchor.ty})`,
        alignItems: anchor.align === "left" ? "flex-start" : anchor.align === "right" ? "flex-end" : "center",
        textAlign: anchor.align,
      };

  return (
    <div
      className="scene-copy pointer-events-none absolute z-20 flex flex-col gap-4"
      aria-hidden
      style={{
        opacity,
        width: isMobile ? undefined : "clamp(320px, 42vw, 660px)",
        maxWidth: isMobile ? "92vw" : undefined,
        padding: "1.25rem 1.1rem",
        background: SCRIMS[anchor.align],
        ...placement,
      }}
    >
      <p className="scene-eyebrow" style={{ opacity: smooth(0, 0.08, progress) }}>
        {scene.eyebrow}
      </p>
      <h2 ref={setNode as (el: HTMLHeadingElement | null) => void} className="scene-headline" style={{ width: "100%", minWidth: 0, position: "relative", fontSize: `calc(var(--headline-base) * ${fit.toFixed(3)})` }}>
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 invisible">
          {lines.map((l, i) => (
            <span key={i} data-measure className="block whitespace-nowrap">
              {l}
            </span>
          ))}
        </span>
        {lines.map((_, i) => (
          <span key={i} data-line className="block whitespace-nowrap">
            {typed[i] || " "}
          </span>
        ))}
      </h2>
      {scene.bodyParts ? (
        <div className="scene-body flex flex-col gap-2">
          {scene.bodyParts.map((part, i) => {
            const from = 0.28 + i * 0.16;
            const p = reducedMotion ? 1 : smooth(from, from + 0.18, progress);
            return <p key={part}>{typewriter(part, p) || " "}</p>;
          })}
        </div>
      ) : (
        <p className="scene-body">{typewriter(scene.body, bodyProgress) || " "}</p>
      )}
      {scene.footer && (
        <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] text-[#e5e7eb] uppercase md:text-xs" style={{ opacity: smooth(0.62, 0.8, progress) }}>
          {scene.footer}
        </p>
      )}
    </div>
  );
}

function useAlignFlag() {
  return useMemo(() => (typeof window === "undefined" ? false : new URLSearchParams(window.location.search).has("pitchAlign")), []);
}

export function PitchFilm({
  onComplete,
  onPlayingChange,
  playbackRate = 1,
}: {
  onComplete?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  playbackRate?: number;
}) {
  const reducedMotion = useReducedMotion();
  const alignMode = useAlignFlag();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef(0);
  const pauseIndex = useRef(0);
  const holdingRef = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const [time, setTime] = useState(0);
  const lastTick = useRef(-1);
  const [holding, setHolding] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tweaks, setTweaks] = useState<TweakMap>(() => {
    if (typeof window === "undefined") return NODE_TWEAKS;
    try {
      const raw = window.localStorage.getItem(PITCH_STORAGE_KEY);
      return raw ? { ...NODE_TWEAKS, ...JSON.parse(raw) } : NODE_TWEAKS;
    } catch {
      return NODE_TWEAKS;
    }
  });
  const [viewportW, setViewportW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  const { cover } = useVideoCover(stageRef, FILM_W / FILM_H, 0.5, 0.5);
  const isMobile = viewportW < 768;
  const hideSmall = cover.drawnW > 0 && cover.drawnW < 700;

  const clearHold = useCallback(() => {
    if (holdTimer.current != null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    holdingRef.current = false;
    setHolding(false);
  }, []);
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearHold();
    onComplete?.();
  }, [clearHold, onComplete]);
  const finishRef = useRef(finish);
  finishRef.current = finish;
  const playingChangeRef = useRef(onPlayingChange);
  playingChangeRef.current = onPlayingChange;
  const userPausedRef = useRef(false);

  const resume = useCallback(() => {
    holdingRef.current = false;
    setHolding(false);
    holdTimer.current = null;
    const v = videoRef.current;
    if (!v || finishedRef.current || userPausedRef.current) return;
    v.play().catch(() => {});
  }, []);
  const hold = useCallback(
    (ms: number) => {
      const v = videoRef.current;
      if (!v || holdingRef.current || userPausedRef.current) return;
      holdingRef.current = true;
      setHolding(true);
      v.pause();
      holdTimer.current = window.setTimeout(resume, reducedMotion ? Math.min(ms, 900) : ms);
    },
    [reducedMotion, resume],
  );

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.playbackRate = playbackRate;
    if (alignMode) {
      v.pause();
      const param = new URLSearchParams(window.location.search).get("t");
      const seekTo = param ? Number(param) : 11.55;
      const seek = () => {
        if (Number.isFinite(seekTo)) v.currentTime = seekTo;
      };
      if (v.readyState >= 1) seek();
      else v.addEventListener("loadedmetadata", seek, { once: true });
      window.__pitchSeek = (t: number) => {
        clearHold();
        holdingRef.current = false;
        userPausedRef.current = true;
        v.pause();
        v.currentTime = t;
        setTime(t);
      };
      return () => {
        clearHold();
        delete window.__pitchSeek;
      };
    }
    const start = () => {
      if (!userPausedRef.current && !finishedRef.current) v.play().catch(() => {});
    };
    if (v.readyState >= 2) start();
    else v.addEventListener("canplay", start, { once: true });
    const onEnded = () => finishRef.current();
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("ended", onEnded);
      clearHold();
    };
  }, [alignMode, clearHold, playbackRate]);

  useEffect(() => {
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime;
        const q = Math.round(t * 30) / 30;
        if (q !== lastTick.current) {
          lastTick.current = q;
          setTime(t);
        }
        if (!alignMode && !holdingRef.current && !v.paused && !finishedRef.current) {
          const points = PAUSE_POINTS;
          while (pauseIndex.current < points.length && t >= points[pauseIndex.current].at) {
            const p = points[pauseIndex.current];
            pauseIndex.current += 1;
            if (t <= p.at + 0.35) {
              hold(p.holdMs);
              break;
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [alignMode, hold]);

  const replay = () => {
    finishedRef.current = false;
    userPausedRef.current = false;
    pauseIndex.current = 0;
    clearHold();
    const v = videoRef.current;
    if (v) {
      lastTick.current = -1;
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };
  const skip = () => {
    const v = videoRef.current;
    if (v) {
      userPausedRef.current = true;
      v.pause();
      v.currentTime = PITCH_FILM.duration;
    }
    finish();
  };
  const isPlaying = playing || holding;
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || finishedRef.current) return;
    if (isPlaying) {
      userPausedRef.current = true;
      clearHold();
      v.pause();
      return;
    }
    userPausedRef.current = false;
    clearHold();
    v.play().catch(() => {});
  };

  const persistTweaks = useCallback((next: TweakMap) => {
    setTweaks(next);
    try {
      window.localStorage.setItem(PITCH_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);
  const changeTweak = useCallback((id: string, patch: NodeTweak) => {
    setTweaks((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...patch } };
      try {
        window.localStorage.setItem(PITCH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!alignMode || !selected) return;
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 1;
      const delta = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, [number, number]>)[e.key];
      if (!delta) return;
      e.preventDefault();
      setTweaks((prev) => {
        const cur = prev[selected] ?? {};
        const next = { ...prev, [selected]: { ...cur, dx: (cur.dx ?? 0) + delta[0], dy: (cur.dy ?? 0) + delta[1] } };
        try {
          window.localStorage.setItem(PITCH_STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alignMode, selected]);

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = t;
      setTime(t);
    }
  }, []);
  const chapter = useMemo(() => PITCH_CHAPTERS.find((c) => time >= c.start && time < c.end) ?? PITCH_CHAPTERS[PITCH_CHAPTERS.length - 1], [time]);
  const transcript = useMemo(() => PITCH_SCENES.map((s) => `${s.eyebrow}. ${s.headline.replace(/\n/g, " ")}. ${s.body}`).join(" "), []);

  return (
    <section className="aradi-pitch-scroll relative h-[100dvh] w-full overflow-hidden bg-[#0a0f1f]">
      <div ref={stageRef} className="absolute inset-0">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={PITCH_FILM.src}
          poster={PITCH_FILM.poster}
          muted
          playsInline
          preload="auto"
          controls={false}
          aria-hidden
          onClick={togglePlay}
          onPlay={() => {
            setPlaying(true);
            playingChangeRef.current?.(true);
          }}
          onPause={() => {
            setPlaying(false);
            playingChangeRef.current?.(false);
          }}
        />
        <div className="video-ui-overlay pointer-events-none absolute inset-0 z-10">
          {cover.drawnW > 0 &&
            PITCH_NODES.map((n) => (
              <OverlayNode
                key={n.id}
                node={n}
                time={time}
                cover={cover}
                hideSmall={hideSmall}
                reducedMotion={reducedMotion}
                tweak={tweaks[n.tweakId ?? n.id] ?? {}}
                onSelect={alignMode ? setSelected : undefined}
                selected={alignMode && selected === n.id}
              />
            ))}
        </div>
        <div className="scene-copy-overlay pointer-events-none absolute inset-0 z-20">
          {PITCH_SCENES.map((s) => (
            <SceneCopy key={s.id} scene={s} time={time} reducedMotion={reducedMotion} isMobile={isMobile} />
          ))}
        </div>
        <nav className="scene-progress pointer-events-none absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:right-6 md:flex" aria-hidden>
          {PITCH_CHAPTERS.map((c) => {
            const active = chapter.id === c.id;
            return (
              <div key={c.id} className="flex items-center justify-end gap-2">
                <span
                  className="text-[9px] font-semibold tracking-[0.18em] uppercase transition-opacity duration-300"
                  style={{ color: active ? "#e5e7eb" : "rgba(184,189,201,0.35)", opacity: active ? 1 : 0.55 }}
                >
                  {c.label}
                </span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? "#e5e7eb" : "rgba(184,189,201,0.35)" }} />
              </div>
            );
          })}
        </nav>
        {holding && (
          <div className="pointer-events-none absolute bottom-[74px] left-1/2 z-30 -translate-x-1/2 text-[9px] tracking-[0.28em] text-white/35 uppercase" aria-hidden>
            Hold
          </div>
        )}
        <div className="pointer-events-auto absolute inset-x-0 bottom-5 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
          <button
            type="button"
            onClick={replay}
            className="justify-self-end rounded border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] tracking-[0.2em] text-white/70 uppercase backdrop-blur-sm hover:text-white"
          >
            Replay
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause the journey" : "Play the journey"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e5e7eb]/40 bg-black/25 text-[#ffffff] backdrop-blur-md transition duration-300 hover:border-[#e5e7eb]/80 hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5e7eb]"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" /> : <Play className="ml-0.5 h-3.5 w-3.5" strokeWidth={1.5} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={skip}
            className="justify-self-start rounded border border-[#e5e7eb]/40 bg-black/40 px-3 py-1.5 text-[10px] tracking-[0.2em] text-[#e5e7eb] uppercase backdrop-blur-sm hover:bg-black/55"
          >
            Skip journey
          </button>
        </div>
      </div>
      {alignMode && (
        <AlignPanel
          nodes={PITCH_NODES}
          time={time}
          duration={PITCH_FILM.duration}
          selectedId={selected}
          tweaks={tweaks}
          onSelect={setSelected}
          onChange={changeTweak}
          onResetNode={(id) => {
            const next = { ...tweaks };
            delete next[id];
            persistTweaks(next);
          }}
          onResetAll={() => persistTweaks({})}
          onSeek={seek}
          playing={playing}
          onTogglePlay={togglePlay}
        />
      )}
      <div className="sr-only">{transcript}</div>
    </section>
  );
}

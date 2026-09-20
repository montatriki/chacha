"use client";
import { useEffect, useRef, type RefObject } from "react";
import {
  FRAME_COPY,
  MOBILE_CARDS,
  JUSTIFY_MAP,
  TONE_COLORS,
  type FloorCardId,
  type FrameId,
  type FrameLayout,
  type HallwayLayout,
  type MobileFloorCardLayout,
  type ProjectionId,
} from "@/config/hallway";
import { COPY } from "@/config/site";
import { useVideoCover, type FitMode } from "@/hooks/useVideoCover";
import { DoorGlow } from "./DoorGlow";

export type ProjectionOrigin = "wall" | "floor";

export function HallwayOverlay({
  containerRef,
  visible,
  alignMode,
  mobileFloorAlignMode = false,
  layout,
  activeFrameId,
  activeFloorCardId = "offer",
  onSelectFrame,
  onSelectFloorCard,
  onOpenProjection,
  onContinue,
  onPatchFrame,
  onPatchMobileFloorCard,
  fitMode = "cover",
  fitPad = 0,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  alignMode: boolean;
  mobileFloorAlignMode?: boolean;
  layout: HallwayLayout;
  activeFrameId: FrameId;
  activeFloorCardId?: FloorCardId;
  onSelectFrame: (id: FrameId) => void;
  onSelectFloorCard?: (id: FloorCardId) => void;
  onOpenProjection: (id: ProjectionId, origin: ProjectionOrigin) => void;
  onContinue: () => void;
  onPatchFrame: (id: FrameId, patch: Partial<FrameLayout>) => void;
  onPatchMobileFloorCard?: (id: FloorCardId, patch: Partial<MobileFloorCardLayout>) => void;
  fitMode?: FitMode;
  fitPad?: number;
}) {
  const dragRef = useRef<{ id: FloorCardId; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const { toScreen, cover } = useVideoCover(containerRef, 16 / 9, 0.5, 0.5, fitMode, fitPad);

  useEffect(() => {
    if (!alignMode || !visible) return;
    const onKey = (e: KeyboardEvent) => {
      const step = (e.shiftKey ? 5 : 1) * 0.002;
      const f = layout.frames[activeFrameId];
      if (e.key === "ArrowLeft") { e.preventDefault(); onPatchFrame(activeFrameId, { x: Math.max(0, f.x - step) }); }
      else if (e.key === "ArrowRight") { e.preventDefault(); onPatchFrame(activeFrameId, { x: Math.min(1, f.x + step) }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); onPatchFrame(activeFrameId, { y: Math.max(0, f.y - step) }); }
      else if (e.key === "ArrowDown") { e.preventDefault(); onPatchFrame(activeFrameId, { y: Math.min(1, f.y + step) }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alignMode, visible, activeFrameId, layout, onPatchFrame]);

  useEffect(() => {
    if (!mobileFloorAlignMode || !onPatchMobileFloorCard) return;
    const onKey = (e: KeyboardEvent) => {
      const c = layout.mobileFloorCards[activeFloorCardId];
      const step = (e.shiftKey ? 5 : 1) * 0.002;
      if (e.key === "ArrowLeft") { e.preventDefault(); onPatchMobileFloorCard(activeFloorCardId, { hitX: Math.max(0, c.hitX - step) }); }
      else if (e.key === "ArrowRight") { e.preventDefault(); onPatchMobileFloorCard(activeFloorCardId, { hitX: Math.min(1 - c.hitWidth, c.hitX + step) }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); onPatchMobileFloorCard(activeFloorCardId, { hitY: Math.max(0, c.hitY - step) }); }
      else if (e.key === "ArrowDown") { e.preventDefault(); onPatchMobileFloorCard(activeFloorCardId, { hitY: Math.min(1 - c.hitHeight, c.hitY + step) }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileFloorAlignMode, activeFloorCardId, layout.mobileFloorCards, onPatchMobileFloorCard]);

  useEffect(() => {
    if (!mobileFloorAlignMode || !onPatchMobileFloorCard) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || cover.drawnW <= 0) return;
      const dx = (e.clientX - d.startX) / cover.drawnW;
      const dy = (e.clientY - d.startY) / cover.drawnH;
      const c = layout.mobileFloorCards[d.id];
      onPatchMobileFloorCard(d.id, {
        hitX: Math.max(0, Math.min(1 - c.hitWidth, d.origX + dx)),
        hitY: Math.max(0, Math.min(1 - c.hitHeight, d.origY + dy)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [mobileFloorAlignMode, onPatchMobileFloorCard, cover.drawnW, cover.drawnH, layout.mobileFloorCards]);

  if ((!visible && !alignMode && !mobileFloorAlignMode) || cover.drawnW <= 0) return null;

  // The clickable wall frames live at the far edges of the 16:9 video frame. On a
  // narrow or portrait viewport, object-fit: cover crops those edges away, so the
  // frames render off-screen and the services panel becomes unreachable. Measure it
  // instead of trusting a width breakpoint, and fall back to the floor cards.
  const viewportW = containerRef.current?.clientWidth ?? cover.drawnW;
  const wallFramesFit = (["offer", "how"] as FrameId[]).every((id) => {
    const f = layout.frames[id];
    const b = toScreen(f.x, f.y, f.width, f.height);
    return b.left >= 0 && b.left + b.width <= viewportW;
  });
  // Wall frames only take over once they genuinely fit (previously a hard md breakpoint).
  const useWallFrames = wallFramesFit && viewportW >= 768;

  const cb = layout.continueBtn;
  const cbPos = toScreen(cb.x, cb.y, 0.001, 0.001);
  const cbW = cb.boxWidth > 0 ? cb.boxWidth * cover.drawnW : undefined;
  const cbH = cb.boxHeight > 0 ? cb.boxHeight * cover.drawnH : undefined;
  const cbFont = Math.max(7, cb.fontSize * (cbH ?? cover.drawnH));
  const cbPadX = cb.padX * (cbW ?? cover.drawnW);
  const cbPadY = cb.padY * (cbH ?? cover.drawnH);
  const showFloorCards = mobileFloorAlignMode;
  const showFrames = !mobileFloorAlignMode;
  // Mobile / portrait: all four frames as a 2x2 grid of floor cards, anchored to the
  // viewport instead of the cropped video frame so every card is always on screen.
  const showMobileGrid = visible && !useWallFrames && !mobileFloorAlignMode;
  const MOBILE_CARD_ORDER: FrameId[] = ["offer", "readyLeft", "readyRight", "how"];

  return (
    <div className="absolute inset-0 z-40">
      <DoorGlow containerRef={containerRef} glow={layout.doorGlow} visible alignOutline={alignMode} fitMode={fitMode} fitPad={fitPad} />

      {showFrames &&
        (Object.keys(FRAME_COPY) as FrameId[]).map((id) => {
          const f = layout.frames[id];
          const copy = FRAME_COPY[id];
          const box = toScreen(f.x, f.y, f.width, f.height);
          const clickable = !!copy.projectionId;
          const selected = alignMode && activeFrameId === id;
          const fontSize = Math.max(8, f.fontSize * box.height);
          const hintSize = Math.max(6, f.hintSize * box.height);
          const gap = f.gap * box.height;
          const hintGap = f.hintGap * box.height;
          const padX = f.paddingX * box.width;
          const padY = f.paddingY * box.height;
          const transform = [
            `perspective(${f.perspective}px)`,
            `rotateX(${f.rotateX}deg)`,
            `rotateY(${f.rotateY}deg)`,
            `rotateZ(${f.rotateZ}deg)`,
            `skew(${f.skewX}deg, ${f.skewY}deg)`,
          ].join(" ");
          const Tag: "button" | "div" = clickable && !alignMode ? "button" : "div";
          return (
            <Tag
              key={id}
              type={Tag === "button" ? "button" : undefined}
              className={`absolute flex-col ${alignMode || useWallFrames ? "flex" : "hidden"} ${
                clickable && !alignMode
                  ? "cursor-pointer transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7c98a]"
                  : alignMode
                    ? "cursor-pointer"
                    : "pointer-events-none"
              }`}
              style={{
                left: box.left,
                top: box.top,
                width: Math.max(box.width, 16),
                height: Math.max(box.height, 16),
                paddingLeft: padX,
                paddingRight: padX,
                paddingTop: padY,
                paddingBottom: padY,
                fontFamily: 'Poppins, Montserrat, sans-serif',
                textAlign: f.textAlign,
                justifyContent: JUSTIFY_MAP[f.justify],
                transform,
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
                outline: selected ? "2px solid #2563eb" : alignMode ? "1px dashed rgba(37,99,235,0.35)" : undefined,
                outlineOffset: 2,
                background: selected ? "rgba(37,99,235,0.12)" : "transparent",
                animation: alignMode ? undefined : "hallwayFrameIn 0.9s ease-out both",
              }}
              onClick={() => {
                if (alignMode) {
                  onSelectFrame(id);
                  return;
                }
                if (copy.projectionId) onOpenProjection(copy.projectionId, "wall");
              }}
              aria-label={clickable ? `${copy.lines.map((l) => l.text).join(" ")} — open details` : undefined}
            >
              <div
                className="flex w-full flex-col"
                style={{
                  gap,
                  alignItems: f.textAlign === "left" ? "flex-start" : f.textAlign === "right" ? "flex-end" : "center",
                  justifyContent: JUSTIFY_MAP[f.justify],
                  flex: f.justify === "between" ? 1 : undefined,
                  height: f.justify === "between" ? "100%" : undefined,
                }}
              >
                {copy.lines.map((line, i) => (
                  <span
                    key={`${id}-${i}`}
                    style={{
                      color: TONE_COLORS[line.tone],
                      fontSize,
                      lineHeight: f.lineHeight,
                      letterSpacing: `${f.letterSpacing}em`,
                      fontWeight: line.tone === "teal" ? 400 : 500,
                      fontStyle: line.tone === "teal" ? "italic" : undefined,
                      textShadow: "0 2px 14px rgba(0,0,0,0.6), 0 0 30px rgba(231,201,138,0.12)",
                    }}
                  >
                    {line.text}
                  </span>
                ))}
              </div>
              {copy.hint && (
                <span
                  className="uppercase"
                  style={{
                    marginTop: hintGap,
                    fontSize: hintSize,
                    letterSpacing: `${f.hintTracking + 0.08}em`,
                    color: "rgba(231,201,138,0.9)",
                    textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                    borderTop: "1px solid rgba(231,201,138,0.35)",
                    paddingTop: hintGap * 0.6,
                  }}
                >
                  {copy.hint}
                </span>
              )}
            </Tag>
          );
        })}

      {showFloorCards &&
        (["offer", "how"] as FloorCardId[]).map((id, index) => {
          const c = layout.mobileFloorCards[id];
          const copy = FRAME_COPY[id];
          const box = toScreen(c.x, c.y, c.width, c.height);
          const hit = toScreen(c.hitX, c.hitY, c.hitWidth, c.hitHeight);
          const selected = mobileFloorAlignMode && activeFloorCardId === id;
          const titleSize = Math.max(11, Math.min(18, box.height * 0.32));
          const subSize = Math.max(9, Math.min(14, box.height * 0.22));
          const hintSize = Math.max(7, Math.min(10, box.height * 0.16));
          const transform = [
            `perspective(${c.perspective}px)`,
            `rotateX(${c.rotateX}deg)`,
            `rotateY(${c.rotateY}deg)`,
            `rotateZ(${c.rotateZ}deg)`,
            `skew(${c.skewX}deg, ${c.skewY}deg)`,
          ].join(" ");
          const z = id === "offer" ? 52 : 51;
          return (
            <button
              key={`floor-${id}`}
              type="button"
              className={`absolute touch-manipulation overflow-visible text-left ${
                mobileFloorAlignMode || !useWallFrames ? "" : "hidden"
              } ${
                mobileFloorAlignMode ? "cursor-move" : "cursor-pointer active:brightness-110"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]`}
              style={{
                left: hit.left,
                top: hit.top,
                width: Math.max(hit.width, 8),
                height: Math.max(hit.height, 8),
                zIndex: z,
                WebkitTapHighlightColor: "transparent",
                background: mobileFloorAlignMode ? (selected ? "rgba(37,99,235,0.22)" : "rgba(124,58,237,0.14)") : "rgba(0,0,0,0.01)",
                outline: mobileFloorAlignMode ? (selected ? "2px solid #2563eb" : "1px dashed rgba(124,58,237,0.7)") : undefined,
                outlineOffset: 0,
                touchAction: "manipulation",
              }}
              onPointerDown={(e) => {
                if (!mobileFloorAlignMode || !onPatchMobileFloorCard) return;
                e.preventDefault();
                onSelectFloorCard?.(id);
                dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: c.hitX, origY: c.hitY };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onClick={() => {
                if (mobileFloorAlignMode) {
                  onSelectFloorCard?.(id);
                  return;
                }
                onOpenProjection(id, "floor");
              }}
              aria-label={`${copy.lines.map((l) => l.text).join(" ")} — open details`}
            >
              {mobileFloorAlignMode && selected && (
                <span className="pointer-events-none absolute -top-5 left-0 whitespace-nowrap rounded bg-[#2563eb] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-black uppercase">
                  Hit area
                </span>
              )}
              <span
                className="pointer-events-none absolute flex flex-col justify-center overflow-hidden px-3 py-2"
                style={{
                  left: box.left - hit.left,
                  top: box.top - hit.top,
                  width: Math.max(box.width, 48),
                  height: Math.max(box.height, 36),
                  fontFamily: 'Poppins, Montserrat, sans-serif',
                  background: "linear-gradient(145deg, rgba(18,28,58,0.84) 0%, rgba(12,19,40,0.92) 100%)",
                  backdropFilter: "blur(10px)",
                  transform,
                  transformOrigin: `${c.originX * 100}% ${c.originY * 100}%`,
                  transformStyle: "preserve-3d",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                  animation: mobileFloorAlignMode ? undefined : `hallwayFrameIn 0.9s ease-out ${0.08 + index * 0.08}s both`,
                }}
                aria-hidden
              >
                <span className="aradi-silver-lining absolute inset-0" aria-hidden />
                <span className="relative flex flex-col gap-0.5">
                  {copy.lines.map((line, i) => (
                    <span
                      key={`${id}-f-${i}`}
                      className="leading-tight"
                      style={{
                        color: TONE_COLORS[line.tone],
                        fontSize: line.tone === "teal" ? subSize : titleSize,
                        fontWeight: line.tone === "teal" ? 500 : 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {line.text}
                    </span>
                  ))}
                </span>
                {copy.hint && (
                  <span className="relative mt-1 block uppercase tracking-[0.2em]" style={{ color: "rgba(37,99,235,0.9)", fontSize: hintSize }}>
                    {copy.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}

      {showMobileGrid && (
        <div className="absolute inset-x-4 z-[52] flex flex-col" style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))", gap: 10 }}>
          {MOBILE_CARD_ORDER.map((id, index) => {
            const copy = FRAME_COPY[id];
            const card = MOBILE_CARDS[id];
            const clickable = !!copy.projectionId;
            return (
              <button
                key={`mobile-${id}`}
                type="button"
                onClick={clickable ? () => onOpenProjection(copy.projectionId as ProjectionId, "floor") : undefined}
                className="group relative flex items-center overflow-hidden text-left touch-manipulation active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7c98a]"
                style={{
                  fontFamily: "Poppins, Montserrat, sans-serif",
                  padding: "12px 14px 12px 12px",
                  gap: 14,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(37,99,235,0.28) 0%, rgba(10,15,31,0.82) 55%, rgba(10,15,31,0.9) 100%)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(231,201,138,0.42)",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
                  WebkitTapHighlightColor: "transparent",
                  transition: "transform 160ms ease-out",
                  animation: `eventCardIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + index * 0.1}s both`,
                }}
                aria-label={`${copy.lines.map((l) => l.text).join(" ")} — open details`}
              >
                <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)", backgroundSize: "220% 100%", animation: "projScanSheen 5s ease-in-out infinite" }} aria-hidden />
                <span className="relative flex shrink-0 items-center justify-center" style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(160deg, rgba(231,201,138,0.22), rgba(10,15,31,0.6))", border: "1px solid rgba(231,201,138,0.55)", boxShadow: "0 0 18px rgba(231,201,138,0.18)", color: "#e7c98a" }} aria-hidden>
                  <CardIcon name={card.icon} />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold text-white" style={{ fontSize: 17, lineHeight: 1.15, letterSpacing: "0.01em", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>{card.title}</span>
                  <span className="mt-1 truncate" style={{ fontSize: 11.5, lineHeight: 1.3, color: "rgba(255,255,255,0.68)" }}>{card.subtitle}</span>
                </span>
                <span className="relative flex shrink-0 items-center justify-center" style={{ width: 30, height: 30, borderRadius: 999, border: "1px solid rgba(231,201,138,0.45)", color: "#e7c98a" }} aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(visible || alignMode || mobileFloorAlignMode) && (
        <button
          type="button"
          onClick={() => {
            if (!alignMode && !mobileFloorAlignMode) onContinue();
          }}
          className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7c98a]"
          style={{
            left: cbPos.left,
            top: cbPos.top,
            transform: `translate(-50%, -50%) rotate(${cb.rotateZ}deg) scale(${cb.scale})`,
            outline: alignMode || mobileFloorAlignMode ? "2px solid #2563eb" : undefined,
            animation: alignMode || mobileFloorAlignMode ? undefined : "hallwayFrameIn 1.1s ease-out 0.25s both",
          }}
          aria-label="LevelUp AI: continue to the platform door"
        >
          <span
            className="aradi-gold-lining inline-flex items-center justify-center uppercase text-[#f7efe1]"
            style={{
              fontFamily: 'Poppins, Montserrat, sans-serif',
              fontWeight: 500,
              fontSize: cbFont,
              letterSpacing: `${cb.letterSpacing}em`,
              lineHeight: 1,
              width: cbW,
              height: cbH,
              padding: `${cbPadY}px ${cbPadX}px`,
              boxSizing: "border-box",
              borderRadius: cb.radius,
              overflow: "hidden",
              whiteSpace: "nowrap",
              background: `linear-gradient(180deg, rgba(28,22,16,${cb.bgOpacity}), rgba(10,8,6,${Math.min(1, cb.bgOpacity + 0.08)}))`,
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            {COPY.hallway.continue}
          </span>
          {cb.showArrow && (
            <span className="text-[#e7c98a]" style={{ marginTop: cb.arrowGap * cover.drawnH, animation: "hallwayContinueBob 2.2s ease-in-out infinite" }} aria-hidden>
              <svg width={cb.arrowSize} height={cb.arrowSize} viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function CardIcon({ name }: { name: "sparkles" | "users" | "calendar" | "info" }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "sparkles":
      return <svg {...common}><path d="M12 3l1.8 4.6L18.5 9.4l-4.7 1.8L12 16l-1.8-4.8L5.5 9.4l4.7-1.8z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /><path d="M5 15.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.7-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9" r="2.6" /><path d="M15.5 14.2c2.4.2 4.2 1.7 4.8 4.8" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M8 14h3M13 14h3M8 17h3" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg>;
  }
}

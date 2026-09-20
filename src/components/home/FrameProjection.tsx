"use client";
import { useEffect, useId, useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { PROJECTIONS, type HallwayLayout, type ProjectionId } from "@/config/hallway";
import { useVideoCover, type FitMode } from "@/hooks/useVideoCover";
import { track } from "@/lib/analytics";
import { ServiceIcon } from "./ServiceIcon";
import { MobileShowcase } from "./MobileShowcase";
import { CardMedia } from "./CardMedia";

const angleBetween = (x1: number, y1: number, x2: number, y2: number) => (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

export function FrameProjection({
  projectionId,
  onClose,
  containerRef,
  layout,
  fromFloor = false,
  fitMode = "cover",
  fitPad = 0,
}: {
  projectionId: ProjectionId | null;
  onClose: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  layout: HallwayLayout;
  fromFloor?: boolean;
  fitMode?: FitMode;
  fitPad?: number;
}) {
  const titleId = useId();
  const svgId = useId().replace(/:/g, "");
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const guardUntil = useRef(0);
  const content = projectionId ? (PROJECTIONS[projectionId] ?? null) : null;
  const { toScreen, cover } = useVideoCover(containerRef, 16 / 9, 0.5, 0.5, fitMode, fitPad);

  const source = useMemo(() => {
    if (!projectionId || cover.drawnW <= 0) return null;
    if (fromFloor && (projectionId === "offer" || projectionId === "how")) {
      const c = layout.mobileFloorCards[projectionId];
      return toScreen(c.x, c.y, c.width, c.height);
    }
    const f =
      projectionId === "offer" ? layout.frames.offer : projectionId === "clients" ? layout.frames.readyLeft : projectionId === "events" ? layout.frames.readyRight : layout.frames.how;
    return toScreen(f.x, f.y, f.width, f.height);
  }, [projectionId, layout, toScreen, cover.drawnW, fromFloor]);

  useEffect(() => {
    if (!content) return;
    guardUntil.current = performance.now() + 450;
    track("gallery_item_opened", { id: content.id });
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      track("gallery_item_closed", { id: content.id });
    };
  }, [content, onClose, fromFloor]);

  if (!content || !source || cover.drawnW <= 0 || !projectionId) return null;

  const isOfferWall = !fromFloor && (projectionId === "offer" || projectionId === "clients");
  const beam = layout.beams[projectionId === "events" || projectionId === "about" ? "how" : projectionId];
  const el = containerRef.current;
  const cw = el?.clientWidth || cover.drawnW;
  const ch = el?.clientHeight || cover.drawnH;
  const margin = fromFloor ? Math.max(12, cw * 0.04) : 0;

  // Gallery geometry: a wide glass stage sized from the viewport. Cards flow 3 / 2 columns on
  // desktop and become a horizontal swipe carousel on phones.
  const blockCount = content.blocks.length;
  const isLongList = blockCount > 5;
  const narrowViewport = cw < 640;
  const asSheet = narrowViewport || fromFloor;
  const sheetMargin = Math.max(12, cw * 0.04);
  const headerClearance = narrowViewport ? 64 : 0;
  let panelW = narrowViewport ? cw : Math.min(cw * 0.92, isLongList ? 1240 : 1000);
  let panelH = narrowViewport ? ch - headerClearance : Math.min(ch * 0.9, isLongList ? 940 : 720);
  let panelLeft = (cw - panelW) / 2;
  let panelTop = narrowViewport ? headerClearance : (ch - panelH) / 2;

  const columns = narrowViewport ? 1 : Math.min(blockCount, panelW >= 1000 ? 3 : 2);
  const scale = Math.max(0, Math.min(1, (panelW - 320) / 900));
  const titleSize = Math.round(18 + scale * 4);
  const bodySize = Math.round((13.5 + scale * 1.5) * 10) / 10;
  const eyebrowSize = Math.round(10.5 + scale * 2);
  const headlineSize = narrowViewport ? 27 : Math.round(30 + scale * 16);
  const blockGap = Math.round(12 + scale * 8);
  const padding = narrowViewport ? 18 : Math.round(26 + scale * 22);
  const cardPad = narrowViewport ? 22 : Math.round(18 + scale * 8);
  const GOLD = "#e7c98a";

  const ox = fromFloor ? source.left + source.width * 0.5 : source.left + beam.originX * source.width + beam.offsetX * cover.drawnW;
  const oy = fromFloor ? source.top + source.height * 0.15 : source.top + beam.originY * source.height + beam.offsetY * cover.drawnH;
  const tx = fromFloor ? panelLeft + panelW * 0.5 : isOfferWall ? panelLeft + panelW * 0.08 : panelLeft + panelW * 0.92;
  const ty = fromFloor ? panelTop + panelH * 0.92 : panelTop + panelH * 0.5;
  const len = distance(ox, oy, tx, ty) * beam.length;
  const rawAngle = angleBetween(ox, oy, tx, ty);
  const angle = fromFloor ? rawAngle : beam.useAngleOverride ? beam.angle : rawAngle + beam.angleOffset;
  const spread = Math.min(cover.drawnH * 0.42, panelH * 1.05) * (fromFloor ? beam.spread * 0.85 : beam.spread);
  const emitterW = source.width * (fromFloor ? 1.15 : 1.8) * beam.emitterScale;
  const emitterH = source.height * (fromFloor ? 0.7 : 0.55) * beam.emitterScale;

  const gradLen = `${svgId}-len`;
  const gradSoft = `${svgId}-soft`;
  const gradCore = `${svgId}-core`;
  const blurSoft = `${svgId}-blur-soft`;
  const blurCore = `${svgId}-blur-core`;
  const nearHalf = spread * 0.08;
  const farHalf = spread * 0.5;
  const outerPath = `M 0 ${-nearHalf} L ${len} ${-farHalf} L ${len} ${farHalf} L 0 ${nearHalf} Z`;
  const coreNear = spread * 0.03;
  const coreFar = spread * 0.14;
  const corePath = `M 0 ${-coreNear} L ${len * 0.94} ${-coreFar} L ${len * 0.94} ${coreFar} L 0 ${coreNear} Z`;

  const panelStyle = {
    left: panelLeft,
    top: panelTop,
    width: panelW,
    // Two-column long lists are short enough to hug their content; anything else
    // keeps the fixed height so the beam geometry stays put.
    height: narrowViewport ? panelH : undefined,
    maxHeight: panelH,
    maxWidth: narrowViewport ? undefined : asSheet ? `calc(100% - ${margin * 2}px)` : undefined,
    boxSizing: "border-box",
    fontFamily: 'Poppins, Montserrat, sans-serif',
    // Phone: translucent colour wash so the hallway shows through; desktop: dark glass stage.
    background: narrowViewport ? "linear-gradient(180deg, rgba(20,31,63,0.62) 0%, rgba(37,99,235,0.22) 45%, rgba(10,15,31,0.72) 100%)" : "linear-gradient(160deg, rgba(20,31,63,0.9) 0%, rgba(10,15,31,0.95) 60%, rgba(10,15,31,0.97) 100%)",
    border: narrowViewport ? "none" : "1px solid rgba(231,201,138,0.35)",
    borderRadius: narrowViewport ? 0 : 18,
    boxShadow: `
            0 0 60px rgba(37,99,235,0.18),
            0 30px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.12),
            inset 0 0 80px rgba(124,58,237,0.06)
          `,
    // phones keep a light glass blur over the door (panel is translucent there); desktop panel is near-opaque, blur dropped for 60fps
    backdropFilter: narrowViewport ? "blur(10px) saturate(1.3)" : undefined,
    WebkitBackdropFilter: narrowViewport ? "blur(10px) saturate(1.3)" : undefined,
    willChange: "transform, opacity",
    contain: "layout paint",
    "--proj-slide": narrowViewport ? "0px" : fromFloor ? "48px" : isOfferWall ? "-36px" : "36px",
    animation: narrowViewport
      ? "eventsRoomIn 0.6s ease-out both"
      : fromFloor
        ? "projPanelRise 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both"
        : "projPanelReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both",
    padding,
  } as CSSProperties;

  return (
    <div
      className="absolute inset-0 z-[50]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && performance.now() >= guardUntil.current) onClose();
      }}
      onPointerUp={(e) => {
        if (e.target === e.currentTarget && performance.now() < guardUntil.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: narrowViewport
            ? "linear-gradient(180deg, rgba(10,15,31,0.35), rgba(10,15,31,0.2))"
            : fromFloor
            ? "radial-gradient(ellipse 80% 55% at 50% 70%, rgba(10,15,31,0.15) 0%, rgba(6,9,20,0.55) 100%)"
            : isOfferWall
              ? "radial-gradient(ellipse 70% 60% at 35% 50%, rgba(10,15,31,0.2) 0%, rgba(6,9,20,0.55) 100%)"
              : "radial-gradient(ellipse 70% 60% at 65% 50%, rgba(10,15,31,0.2) 0%, rgba(6,9,20,0.55) 100%)",
          animation: "frameProjectionBg 0.6s ease-out both",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          style={{
            position: "absolute",
            left: ox,
            top: oy,
            width: emitterW,
            height: emitterH,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(191,210,254,0.22) 32%, rgba(37,99,235,0.06) 58%, transparent 78%)",
            filter: "blur(20px)",
            mixBlendMode: "screen",
          }}
        />
        <svg width="100%" height="100%" className="absolute inset-0" style={{ mixBlendMode: "screen", animation: "projBeamIn 0.95s ease-out both" }}>
          <defs>
            <linearGradient id={gradLen} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity="0.55" />
              <stop offset="18%" stopColor="rgb(219,230,254)" stopOpacity="0.38" />
              <stop offset="42%" stopColor="rgb(191,210,254)" stopOpacity="0.22" />
              <stop offset="68%" stopColor="rgb(147,170,253)" stopOpacity="0.1" />
              <stop offset="88%" stopColor="rgb(37,99,235)" stopOpacity="0.035" />
              <stop offset="100%" stopColor="rgb(37,99,235)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={gradSoft} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity="0.28" />
              <stop offset="30%" stopColor="rgb(191,210,254)" stopOpacity="0.16" />
              <stop offset="65%" stopColor="rgb(147,170,253)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="rgb(37,99,235)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={gradCore} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity="0.65" />
              <stop offset="25%" stopColor="rgb(219,230,254)" stopOpacity="0.4" />
              <stop offset="55%" stopColor="rgb(191,210,254)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="rgb(147,170,253)" stopOpacity="0" />
            </linearGradient>
            <filter id={blurSoft} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="28" />
            </filter>
            <filter id={blurCore} x="-15%" y="-50%" width="130%" height="200%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <g transform={`translate(${ox} ${oy}) rotate(${angle})`}>
            <path d={outerPath} fill={`url(#${gradSoft})`} filter={`url(#${blurSoft})`} />
            <path d={outerPath} fill={`url(#${gradLen})`} filter={`url(#${blurSoft})`} opacity={0.85} />
            <path d={corePath} fill={`url(#${gradCore})`} filter={`url(#${blurCore})`} />
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            left: ox,
            top: oy,
            width: len,
            height: spread * 0.5,
            transformOrigin: "0% 50%",
            transform: `translateY(-50%) rotate(${angle}deg)`,
            backgroundImage:
              "radial-gradient(1.2px 1.2px at 16% 42%, rgba(255,255,255,0.35) 0%, transparent 100%), radial-gradient(1px 1px at 38% 58%, rgba(235,241,255,0.25) 0%, transparent 100%), radial-gradient(1.4px 1.4px at 55% 36%, rgba(255,255,255,0.28) 0%, transparent 100%), radial-gradient(1px 1px at 72% 55%, rgba(235,241,255,0.22) 0%, transparent 100%), radial-gradient(1px 1px at 86% 44%, rgba(255,255,255,0.18) 0%, transparent 100%)",
            opacity: 0.4,
            mixBlendMode: "screen",
            filter: "blur(0.6px)",
            maskImage:
              "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, black 20%, black 70%, transparent 100%), linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, black 20%, black 70%, transparent 100%), linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
            animation: "projDustDrift 9s linear 1 both",
          }}
        />
      </div>

      <div className="absolute flex flex-col overflow-hidden" style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.05) 48%, transparent 62%)",
            backgroundSize: "220% 100%",
            animation: "projScanSheen 4.5s ease-in-out 1",
          }}
          aria-hidden
        />
        {/* gold corner ornaments */}
        {!narrowViewport && ["top-left", "top-right", "bottom-left", "bottom-right"].map((c) => (
          <span key={c} aria-hidden className="pointer-events-none absolute" style={{ width: 28, height: 28, [c.includes("top") ? "top" : "bottom"]: 12, [c.includes("left") ? "left" : "right"]: 12, borderTop: c.includes("top") ? `1px solid ${GOLD}` : undefined, borderBottom: c.includes("bottom") ? `1px solid ${GOLD}` : undefined, borderLeft: c.includes("left") ? `1px solid ${GOLD}` : undefined, borderRight: c.includes("right") ? `1px solid ${GOLD}` : undefined, opacity: 0.7 }} />
        ))}
        <p id={titleId} className="relative shrink-0 text-center font-semibold uppercase" style={{ fontSize: eyebrowSize, letterSpacing: "0.42em", color: GOLD, animation: "eventsRise 0.8s ease-out 0.15s both" }}>
          {content.eyebrow}
        </p>
        {content.title && (
          <h2 className="relative mx-auto mt-3 shrink-0 text-center text-white" style={{ fontSize: headlineSize, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-0.015em", maxWidth: "20ch", textShadow: "0 4px 30px rgba(0,0,0,0.5)", animation: "eventsRise 0.8s ease-out 0.28s both" }}>
            {content.title}
          </h2>
        )}
        <div className="relative mx-auto mt-4 h-px w-20 shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, animation: "eventsRise 0.8s ease-out 0.38s both" }} />
        {content.tagline && !narrowViewport && (
          <p className="relative mx-auto mt-3 shrink-0 text-center text-white/70" style={{ fontSize: bodySize + 1, animation: "eventsRise 0.8s ease-out 0.45s both" }}>{content.tagline}</p>
        )}

        {narrowViewport ? (
          /* Phone: auto-playing showcase, one item at a time */
          <div className="relative mt-4 flex min-h-0 flex-1 flex-col">
            <MobileShowcase blocks={content.blocks} gold={GOLD} />
          </div>
        ) : (
          <div className="relative mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain text-left" style={{ display: "grid", gap: blockGap, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoRows: "max-content", alignContent: "start", alignItems: "start", paddingRight: 4, contain: "layout paint", willChange: "scroll-position", scrollbarWidth: "thin", scrollbarColor: "rgba(231,201,138,0.4) transparent" } as CSSProperties}>
            {content.blocks.map((b, i) => (
              <GalleryCard key={b.title} block={b} index={i} gold={GOLD} titleSize={titleSize} bodySize={bodySize} pad={cardPad} />
            ))}
          </div>
        )}
        <div className="relative mt-5 flex shrink-0 justify-center" style={{ animation: "eventsRise 0.8s ease-out 0.9s both" }}>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="aradi-silver-lining border-0 px-8 py-3 font-semibold text-white uppercase transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e7c98a]"
            style={{ background: "linear-gradient(180deg, rgba(37,99,235,0.85), rgba(29,78,216,0.95))", fontSize: eyebrowSize, letterSpacing: "0.3em" }}
          >
            {content.closeLabel ?? "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ block, index, gold, titleSize, bodySize, pad, phone = false }: { block: { index?: string; title: string; body: string; icon?: string; image?: string; imageAlt?: string; media?: { type: "image" | "video"; src: string; label?: string }[] }; index: number; gold: string; titleSize: number; bodySize: number; pad: number; phone?: boolean }) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden ${phone ? "shrink-0 snap-center justify-end" : ""}`}
      style={{
        width: phone ? "min(80vw, 340px)" : undefined,
        minHeight: phone ? 300 : undefined,
        ...(phone ? {} : { minHeight: "max-content" }),
        padding: block.image ? 0 : pad,
        borderRadius: 14,
        background: "linear-gradient(160deg, rgba(37,99,235,0.2) 0%, rgba(10,15,31,0.75) 55%, rgba(10,15,31,0.85) 100%)",
        border: "1px solid rgba(231,201,138,0.32)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
        transition: "transform 320ms cubic-bezier(0.22,1,0.36,1), border-color 320ms, box-shadow 320ms",
        animation: `projCardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + index * 0.05}s both`,
        // Each card gets its own compositor layer so hover/scroll never re-rasterises its neighbours.
        willChange: "transform",
        transform: "translateZ(0)",
        contain: "paint",
      }}
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translateY(-4px) translateZ(0)"; el.style.borderColor = "rgba(231,201,138,0.7)"; el.style.boxShadow = "0 28px 60px rgba(0,0,0,0.5), 0 0 40px rgba(231,201,138,0.12), inset 0 1px 0 rgba(255,255,255,0.16)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = "translateZ(0)"; el.style.borderColor = "rgba(231,201,138,0.32)"; el.style.boxShadow = "0 18px 45px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)"; }}
    >
      {phone && <span aria-hidden className="pointer-events-none absolute" style={{ left: "50%", top: "22%", width: 260, height: 260, transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(231,201,138,0.22) 0%, rgba(37,99,235,0.12) 40%, transparent 70%)", filter: "blur(10px)" }} />}
      {phone && <span aria-hidden className="pointer-events-none absolute left-0 right-0" style={{ top: 0, height: 4, background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, opacity: 0.8 }} />}
      {block.image && (
        <span className="relative block w-full overflow-hidden" style={{ aspectRatio: "16 / 10" }} aria-hidden>
          {block.media?.length ? <CardMedia items={block.media} className="transition duration-700 group-hover:scale-105" /> : <img src={block.image} alt={block.imageAlt ?? ""} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
          <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,15,31,0) 45%, rgba(10,15,31,0.92) 100%)" }} />
          <span className="absolute left-0 right-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, opacity: 0.7 }} />
        </span>
      )}
      <span className="relative flex flex-col" style={{ padding: block.image ? `${Math.round(pad * 0.75)}px ${pad}px ${pad}px` : 0, marginTop: block.image ? -Math.round(pad * 1.1) : 0 }}>
        <span aria-hidden className="pointer-events-none absolute" style={{ right: pad * 0.6, top: block.image ? pad * 0.35 : pad * 0.5, fontSize: phone ? 44 : 38, fontWeight: 600, lineHeight: 1, color: "rgba(255,255,255,0.07)", fontVariantNumeric: "tabular-nums" }}>{block.index ?? String(index + 1).padStart(2, "0")}</span>
        <span className="relative flex items-center justify-center" style={{ width: phone ? 58 : 48, height: phone ? 58 : 48, borderRadius: 14, background: "linear-gradient(160deg, rgba(231,201,138,0.22), rgba(10,15,31,0.75))", border: "1px solid rgba(231,201,138,0.55)", boxShadow: "0 0 22px rgba(231,201,138,0.16)", color: gold }} aria-hidden>
          <ServiceIcon name={block.icon} size={phone ? 28 : 24} />
        </span>
        <h3 className="relative text-white" style={{ marginTop: phone ? 18 : 14, fontSize: titleSize, lineHeight: 1.18, fontWeight: 600, letterSpacing: "-0.005em", paddingRight: 36 }}>{block.title}</h3>
        <span aria-hidden className="relative mt-3 block h-px w-8" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
        <p className="relative mt-3 text-white/78" style={{ fontSize: bodySize, lineHeight: 1.55 }}>{block.body}</p>
      </span>
    </div>
  );
}

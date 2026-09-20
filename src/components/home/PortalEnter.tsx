"use client";
import type { RefObject } from "react";
import type { HallwayLayout } from "@/config/hallway";
import { COPY, SITE } from "@/config/site";
import { useVideoCover } from "@/hooks/useVideoCover";

export function PortalEnter({
  containerRef,
  visible,
  alignMode,
  layout,
  onEnter,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  alignMode: boolean;
  layout: HallwayLayout;
  onEnter: () => void;
}) {
  const { toScreen, cover } = useVideoCover(containerRef);
  if ((!visible && !alignMode) || cover.drawnW <= 0) return null;
  const b = layout.enterBtn;
  const pos = toScreen(b.x, b.y, 0.001, 0.001);
  const logo = b.logoSize * cover.drawnW;
  const label = Math.max(8, b.labelSize * cover.drawnH);
  const padX = b.padX * cover.drawnW;
  const padY = b.padY * cover.drawnH;
  const gap = b.gap * cover.drawnH;
  return (
    <button
      type="button"
      onClick={() => {
        if (!alignMode) onEnter();
      }}
      className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e7c98a]"
      style={{
        left: pos.left,
        top: pos.top,
        gap,
        outline: alignMode ? "2px solid #2563eb" : undefined,
        outlineOffset: 6,
      }}
      aria-label="Enter the platform"
    >
      <img
        src={SITE.brandIcon}
        alt={SITE.name}
        className="rounded-xl object-cover transition hover:scale-105"
        style={{ width: logo, height: logo }}
      />
      {b.showLabel && (
        <span
          className="aradi-gold-lining uppercase text-[#f7efe1]"
          style={{
            fontFamily: 'Poppins, Montserrat, sans-serif',
            fontSize: label,
            letterSpacing: `${b.letterSpacing}em`,
            padding: `${padY}px ${padX}px`,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
          }}
        >
          {COPY.hallway.enter}
        </span>
      )}
    </button>
  );
}

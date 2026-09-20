"use client";
import type { RefObject } from "react";
import type { GlowLayout } from "@/config/hallway";
import { useVideoCover, type FitMode } from "@/hooks/useVideoCover";

export function DoorGlow({
  containerRef,
  glow,
  visible,
  alignOutline = false,
  fitMode = "cover",
  fitPad = 0,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  glow: GlowLayout;
  visible: boolean;
  alignOutline?: boolean;
  fitMode?: FitMode;
  fitPad?: number;
}) {
  const { toScreen, cover } = useVideoCover(containerRef, 16 / 9, 0.5, 0.5, fitMode, fitPad);
  if (!visible || cover.drawnW <= 0) return null;
  const box = toScreen(glow.x, glow.y, glow.width, glow.height);
  const border = Math.max(1.5, glow.borderWidth * cover.drawnW);
  const i = glow.intensity;
  return (
    <div
      className="pointer-events-none absolute z-[25]"
      style={{
        left: box.left,
        top: box.top,
        width: Math.max(box.width, 8),
        height: Math.max(box.height, 8),
        borderRadius: glow.radius,
        border: `${border}px solid rgba(231,201,138,${0.55 * i})`,
        boxShadow: `
          0 0 ${12 * i}px rgba(231,201,138,${0.55 * i}),
          0 0 ${36 * i}px rgba(231,201,138,${0.35 * i}),
          0 0 ${64 * i}px rgba(231,201,138,${0.18 * i}),
          inset 0 0 ${28 * i}px rgba(231,201,138,${0.2 * i})
        `,
        animation: `doorGoldPulse ${glow.pulseDuration}s ease-in-out infinite`,
        outline: alignOutline ? "1px dashed rgba(255,255,255,0.35)" : undefined,
        outlineOffset: 4,
      }}
      aria-hidden
    />
  );
}

"use client";
import { useCallback, useLayoutEffect, useState, type RefObject } from "react";

export interface CoverBox {
  offsetX: number;
  offsetY: number;
  drawnW: number;
  drawnH: number;
}

export type FitMode = "cover" | "contain";

/**
 * Computes where a video with the given aspect ratio is actually drawn inside a container
 * (object-fit cover/contain), so overlays can be positioned in video-frame coordinates.
 */
export function useVideoCover(
  containerRef: RefObject<HTMLElement | null>,
  aspect = 16 / 9,
  anchorX = 0.5,
  anchorY = 0.5,
  fit: FitMode = "cover",
  pad = 0,
) {
  const [cover, setCover] = useState<CoverBox>({ offsetX: 0, offsetY: 0, drawnW: 0, drawnH: 0 });

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    const ratio = cw / ch;
    let w: number;
    let h: number;
    if (fit === "contain") {
      if (ratio > aspect) {
        h = ch;
        w = ch * aspect;
      } else {
        w = cw;
        h = cw / aspect;
      }
    } else if (ratio > aspect) {
      w = cw;
      h = cw / aspect;
    } else {
      h = ch;
      w = ch * aspect;
    }
    const p = Math.max(0, Math.min(0.4, pad));
    if (p > 0) {
      w *= 1 - p;
      h *= 1 - p;
    }
    const ox = (cw - w) * anchorX;
    const oy = (ch - h) * anchorY;
    setCover((prev) =>
      prev.offsetX === ox && prev.offsetY === oy && prev.drawnW === w && prev.drawnH === h
        ? prev
        : { offsetX: ox, offsetY: oy, drawnW: w, drawnH: h },
    );
  }, [containerRef, aspect, anchorX, anchorY, fit, pad]);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    const ro = new ResizeObserver(() => measure());
    if (el) ro.observe(el);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    const t1 = window.setTimeout(measure, 50);
    const t2 = window.setTimeout(measure, 250);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [containerRef, measure]);

  const toScreen = useCallback(
    (x: number, y: number, w: number, h: number) => ({
      left: cover.offsetX + x * cover.drawnW,
      top: cover.offsetY + y * cover.drawnH,
      width: w * cover.drawnW,
      height: h * cover.drawnH,
    }),
    [cover],
  );

  return { cover, toScreen };
}

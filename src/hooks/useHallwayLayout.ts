"use client";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_HALLWAY_LAYOUT,
  HALLWAY_STORAGE_KEY,
  loadHallwayLayout,
  type BeamLayout,
  type ContinueLayout,
  type EnterLayout,
  type FloorCardId,
  type FloorLayout,
  type FrameId,
  type FrameLayout,
  type GlowLayout,
  type HallwayLayout,
  type MobileFloorCardLayout,
  type BeamId,
} from "@/config/hallway";

export function useHallwayLayout() {
  const [layout, setLayout] = useState<HallwayLayout>(() => structuredClone(DEFAULT_HALLWAY_LAYOUT));

  useEffect(() => {
    setLayout(loadHallwayLayout());
  }, []);

  const persist = useCallback((next: HallwayLayout) => {
    setLayout(next);
    try {
      localStorage.setItem(HALLWAY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const patchFrame = useCallback(
    (id: FrameId, patch: Partial<FrameLayout>) =>
      persist({ ...layout, frames: { ...layout.frames, [id]: { ...layout.frames[id], ...patch } } }),
    [layout, persist],
  );
  const patchFloor = useCallback(
    (patch: Partial<FloorLayout>) => persist({ ...layout, floor: { ...layout.floor, ...patch } }),
    [layout, persist],
  );
  const patchDoorGlow = useCallback(
    (patch: Partial<GlowLayout>) => persist({ ...layout, doorGlow: { ...layout.doorGlow, ...patch } }),
    [layout, persist],
  );
  const patchPortalDoorGlow = useCallback(
    (patch: Partial<GlowLayout>) => persist({ ...layout, portalDoorGlow: { ...layout.portalDoorGlow, ...patch } }),
    [layout, persist],
  );
  const patchBeam = useCallback(
    (id: BeamId, patch: Partial<BeamLayout>) =>
      persist({ ...layout, beams: { ...layout.beams, [id]: { ...layout.beams[id], ...patch } } }),
    [layout, persist],
  );
  const patchContinue = useCallback(
    (patch: Partial<ContinueLayout>) => persist({ ...layout, continueBtn: { ...layout.continueBtn, ...patch } }),
    [layout, persist],
  );
  const patchEnter = useCallback(
    (patch: Partial<EnterLayout>) => persist({ ...layout, enterBtn: { ...layout.enterBtn, ...patch } }),
    [layout, persist],
  );
  const patchMobileFloorCard = useCallback(
    (id: FloorCardId, patch: Partial<MobileFloorCardLayout>) =>
      persist({
        ...layout,
        mobileFloorCards: { ...layout.mobileFloorCards, [id]: { ...layout.mobileFloorCards[id], ...patch } },
      }),
    [layout, persist],
  );
  const reset = useCallback(() => persist(structuredClone(DEFAULT_HALLWAY_LAYOUT)), [persist]);
  const copyConfig = useCallback(async () => {
    const text = `export const DEFAULT_HALLWAY_LAYOUT: HallwayLayout = ${JSON.stringify(layout, null, 2)};`;
    await navigator.clipboard.writeText(text);
  }, [layout]);

  return {
    layout,
    persist,
    patchFrame,
    patchFloor,
    patchDoorGlow,
    patchPortalDoorGlow,
    patchBeam,
    patchContinue,
    patchEnter,
    patchMobileFloorCard,
    reset,
    copyConfig,
  };
}

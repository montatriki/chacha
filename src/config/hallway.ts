import hallway from "@data/content/hallway.json";

export type FrameId = "offer" | "how" | "readyLeft" | "readyRight";
export type ProjectionId = "offer" | "how" | "clients" | "events" | "about";
/** Projections that render a wall panel with a light beam (events opens a full room instead). */
export type BeamId = "offer" | "how" | "clients";
export type FloorCardId = "offer" | "how";
export type Tone = "white" | "teal" | "champagne";

export interface FrameLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  gap: number;
  paddingX: number;
  paddingY: number;
  textAlign: "left" | "center" | "right";
  justify: "start" | "center" | "end" | "between";
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  skewX: number;
  skewY: number;
  hintSize: number;
  hintTracking: number;
  hintGap: number;
}

export interface FloorLayout {
  wash: number[];
  washOpacity: number;
  pulseDuration: number;
  lines: unknown[];
}

export interface GlowLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  borderWidth: number;
  intensity: number;
  pulseDuration: number;
  radius: number;
}

export interface BeamLayout {
  originX: number;
  originY: number;
  offsetX: number;
  offsetY: number;
  angleOffset: number;
  angle: number;
  useAngleOverride: boolean;
  spread: number;
  length: number;
  emitterScale: number;
  panelW: number;
  panelH: number;
  panelX: number;
  panelY: number;
}

export interface ContinueLayout {
  x: number;
  y: number;
  boxWidth: number;
  boxHeight: number;
  scale: number;
  fontSize: number;
  letterSpacing: number;
  padX: number;
  padY: number;
  borderOpacity: number;
  borderWidth: number;
  bgOpacity: number;
  radius: number;
  showArrow: boolean;
  arrowGap: number;
  arrowSize: number;
  rotateZ: number;
}

export interface EnterLayout {
  x: number;
  y: number;
  logoSize: number;
  gap: number;
  labelSize: number;
  letterSpacing: number;
  padX: number;
  padY: number;
  showLabel: boolean;
}

export interface MobileFloorCardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  perspective: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  skewX: number;
  skewY: number;
  originX: number;
  originY: number;
  hitX: number;
  hitY: number;
  hitWidth: number;
  hitHeight: number;
}

export interface HallwayLayout {
  frames: Record<FrameId, FrameLayout>;
  floor: FloorLayout;
  doorGlow: GlowLayout;
  portalDoorGlow: GlowLayout;
  beams: Record<BeamId, BeamLayout>;
  continueBtn: ContinueLayout;
  enterBtn: EnterLayout;
  mobileFloorCards: Record<FloorCardId, MobileFloorCardLayout>;
}

export interface FrameCopy {
  lines: { text: string; tone: Tone }[];
  hint?: string;
  projectionId?: ProjectionId;
}

export interface CardMedia {
  type: "image" | "video";
  src: string;
  label?: string;
  /** Still frame shown before the video plays (and instead of it when autoplay is blocked, e.g. iOS Low Power Mode). */
  poster?: string;
}

export interface ProjectionBlock {
  index?: string;
  title: string;
  body: string;
  /** Line-icon name rendered by ServiceIcon. */
  icon?: string;
  /** Optional photo shown as a banner on the card (e.g. a client's storefront). */
  image?: string;
  imageAlt?: string;
  /** Optional rotating media (photos / muted videos) shown in the banner, cycling automatically. */
  media?: CardMedia[];
  /** Optional detail sheet content (opened by clicking the card): longer text, bullet points, links. */
  description?: string;
  details?: string[];
  links?: { label: string; url: string }[];
  /** Small caption for the detail eyebrow (e.g. the sector); defaults to the panel eyebrow. */
  kicker?: string;
}

export interface ProjectionContent {
  id: ProjectionId;
  eyebrow: string;
  blocks: ProjectionBlock[];
  /** Optional headline shown under the eyebrow. */
  title?: string;
  /** Optional one-line tagline under the headline. */
  tagline?: string;
  /** Optional per-panel label for the close button (defaults to "Close"). */
  closeLabel?: string;
  /** Label of the "open detail" action on cards (defaults to "View"). */
  openLabel?: string;
  /** Reserved for future panel variants; present in content JSON. */
  layout?: string;
}

export const HALLWAY_STORAGE_KEY = hallway.storageKey;
export const DEFAULT_HALLWAY_LAYOUT = hallway.defaultLayout as HallwayLayout;
export const FRAME_COPY = hallway.frames as Record<FrameId, FrameCopy>;
export interface MobileCardCopy { title: string; subtitle: string; icon: "sparkles" | "users" | "calendar" | "info" }
export const MOBILE_CARDS = hallway.mobileCards as Record<FrameId, MobileCardCopy>;
export const PROJECTIONS = hallway.projections as Partial<Record<ProjectionId, ProjectionContent>>;

export const TONE_COLORS: Record<Tone, string> = {
  white: "#f7efe1",
  teal: "#e7c98a",
  champagne: "#d4b271",
};

export const JUSTIFY_MAP: Record<FrameLayout["justify"], string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
};

export function mergeHallwayLayout(raw: unknown): HallwayLayout {
  const base = structuredClone(DEFAULT_HALLWAY_LAYOUT);
  if (!raw || typeof raw !== "object") return base;
  const t = raw as Partial<HallwayLayout> & Record<string, unknown>;
  (Object.keys(base.frames) as FrameId[]).forEach((id) => {
    if (t.frames?.[id]) base.frames[id] = { ...base.frames[id], ...t.frames[id] };
  });
  if (t.floor) {
    base.floor = {
      ...base.floor,
      ...t.floor,
      wash: t.floor.wash ?? base.floor.wash,
      lines: t.floor.lines ?? base.floor.lines,
    };
  }
  if (t.doorGlow) base.doorGlow = { ...base.doorGlow, ...t.doorGlow };
  if (t.portalDoorGlow) base.portalDoorGlow = { ...base.portalDoorGlow, ...t.portalDoorGlow };
  if (t.beams) {
    base.beams = {
      offer: { ...base.beams.offer, ...t.beams.offer },
      how: { ...base.beams.how, ...t.beams.how },
      clients: { ...base.beams.clients, ...t.beams.clients },
    };
  }
  if (t.continueBtn) base.continueBtn = { ...base.continueBtn, ...t.continueBtn };
  if (t.enterBtn) base.enterBtn = { ...base.enterBtn, ...t.enterBtn };
  if (t.mobileFloorCards) {
    base.mobileFloorCards = {
      offer: { ...base.mobileFloorCards.offer, ...t.mobileFloorCards.offer },
      how: { ...base.mobileFloorCards.how, ...t.mobileFloorCards.how },
    };
  }
  return base;
}

export function loadHallwayLayout(): HallwayLayout {
  try {
    const raw = localStorage.getItem(HALLWAY_STORAGE_KEY);
    return raw ? mergeHallwayLayout(JSON.parse(raw)) : structuredClone(DEFAULT_HALLWAY_LAYOUT);
  } catch {
    return structuredClone(DEFAULT_HALLWAY_LAYOUT);
  }
}

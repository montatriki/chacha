import pitch from "@data/content/pitch.json";

export type PitchTone = "ivory" | "muted" | "gold" | "cyan" | "dark";
export type AnchorKey = "TL" | "TC" | "TR" | "ML" | "MR" | "BL" | "BC" | "BR";

export interface PitchLine {
  text: string;
  size?: number;
  weight?: number;
  tone?: PitchTone;
  uppercase?: boolean;
  tracking?: string;
}

export interface PitchKeyframe {
  time: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}

export interface PitchImage {
  src: string;
  width: number;
  alt?: string;
  opacity?: number;
}

export interface PitchNode {
  id: string;
  kind: "block" | "line";
  align?: "left" | "center" | "right";
  maxWidth?: number;
  staggerMs?: number;
  mobileKeep?: boolean;
  groupRotate?: number;
  tweakId?: string;
  keyframes: PitchKeyframe[];
  lines: PitchLine[];
  image?: PitchImage;
}

export interface NodeTweak {
  dx?: number;
  dy?: number;
  fontScale?: number;
  scale?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  curve?: number;
}

export interface PitchScene {
  id: string;
  start: number;
  end: number;
  side: "left" | "right" | "center";
  anchor: AnchorKey;
  eyebrow: string;
  headline: string;
  body: string;
  bodyParts?: string[];
  footer?: string;
}

export interface PitchChapter {
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface PausePoint {
  at: number;
  holdMs: number;
}

export const PITCH_FILM = pitch.film;
export const PITCH_STORAGE_KEY = pitch.storageKey;
export const PITCH_PLAYBACK_RATE = pitch.playbackRate;
export const SCENE_LEAD = pitch.sceneLead;
export const SCENE_TAIL = pitch.sceneTail;
export const BODY_REVEAL_END = pitch.bodyRevealEnd;
export const PAUSE_POINTS: PausePoint[] = pitch.pausePoints as PausePoint[];
export const PITCH_PALETTE: Record<PitchTone, string> = pitch.palette as Record<PitchTone, string>;
export const NODE_TWEAKS: Record<string, NodeTweak> = pitch.nodeTweaks;
export const PITCH_SCENES: PitchScene[] = pitch.scenes as PitchScene[];
export const PITCH_CHAPTERS: PitchChapter[] = pitch.chapters;
export const BRIDGE = pitch.bridge;

function frames(x: number, y: number, tIn: number, tHold: number, tOut: number, tFade = tOut - 0.35): PitchKeyframe[] {
  return [
    { time: tIn, x, y, scale: 0.97, opacity: 0 },
    { time: tHold, x, y, scale: 1, opacity: 1 },
    { time: tFade, x, y, scale: 1, opacity: 1 },
    { time: tOut, x, y: y - 4, scale: 0.98, opacity: 0 },
  ];
}

type Row = { id: string; x: number; y: number; text: string; size: number; weight: number; tone?: string; staggerMs?: number };

const listing = pitch.listing;
const jv = pitch.jointVenture;
const neg = pitch.negotiation;
const seller = pitch.seller;
const layers = pitch.layers;

const LISTING_NODES: PitchNode[] = [
  ...(listing.rows as Row[]).map((r) => ({
    id: r.id,
    kind: "line" as const,
    align: "center" as const,
    keyframes: frames(r.x, r.y, listing.timing.in, listing.timing.hold, listing.timing.out),
    lines: [
      {
        text: r.text,
        size: r.size,
        weight: r.weight,
        tone: r.tone as PitchTone,
        uppercase: r.id.startsWith("list-buy") || r.id.startsWith("list-jv") || r.id === "list-match-cap",
      },
    ],
    mobileKeep: r.id === "list-match",
  })),
  {
    id: listing.hero.id,
    kind: "block",
    align: "center",
    keyframes: frames(listing.hero.x, listing.hero.y, listing.timing.in, listing.timing.hold, listing.timing.out),
    lines: [],
    image: listing.hero.image,
  },
];

const JV_NODES: PitchNode[] = (jv.rows as Row[]).map((r) => ({
  id: r.id,
  kind: "line",
  align: "center",
  keyframes: frames(r.x, r.y, jv.timing.in, jv.timing.hold, jv.timing.out),
  lines: [
    {
      text: r.text,
      size: r.size,
      weight: r.weight,
      tone: r.tone as PitchTone,
      uppercase: ["jv-dl", "jv-ol", "jv-il", "jv-conf", "jv-btn"].includes(r.id),
      tracking: ["jv-dl", "jv-ol", "jv-il"].includes(r.id) ? "0.16em" : undefined,
    },
  ],
  mobileKeep: r.id === "jv-dv" || r.id === "jv-ov",
}));

const NEG_NODES: PitchNode[] = (neg.rows as Row[]).map((r) => ({
  id: r.id,
  kind: "line",
  align: "center",
  staggerMs: r.staggerMs,
  keyframes: frames(r.x, r.y, neg.timing.in, neg.timing.hold, neg.timing.out),
  lines: [
    {
      text: r.text,
      size: r.size,
      weight: r.weight,
      tone: r.tone as PitchTone,
      uppercase: r.id === "neg-badge" || r.id === "neg-status",
      tracking: r.id === "neg-badge" || r.id === "neg-status" ? "0.14em" : undefined,
    },
  ],
}));

const SELL_NODES: PitchNode[] = [
  ...seller.stats.map((s) => ({
    id: s.id,
    kind: "block" as const,
    align: "center" as const,
    mobileKeep: true,
    keyframes: frames(s.x, s.y, seller.timing.in, seller.timing.hold, seller.timing.out),
    lines: [
      { text: s.value, size: s.size, weight: s.weight, tone: s.tone as PitchTone },
      { text: s.label, size: 8, weight: 600, tone: "muted" as PitchTone, uppercase: true, tracking: "0.14em" },
    ],
  })),
  ...seller.rows.map((r) => ({
    id: r.id,
    kind: "line" as const,
    align: "center" as const,
    keyframes: frames(r.x, r.y, seller.timing.in, seller.timing.hold, seller.timing.out),
    lines: [{ text: r.text, size: r.size, weight: r.weight, tone: "ivory" as PitchTone, uppercase: r.id.endsWith("o") }],
  })),
  ...seller.views.map((v) => ({
    id: v.id,
    kind: "line" as const,
    align: "center" as const,
    keyframes: frames(v.x, v.y, seller.timing.in, seller.timing.hold, seller.timing.out),
    lines: [{ text: seller.viewLabel, size: 9, weight: 600, tone: "gold" as PitchTone, uppercase: true, tracking: "0.16em" }],
  })),
];

const LAYER_NODES: PitchNode[] = layers.rows.map((r) => ({
  id: r.id,
  kind: "line",
  align: "left",
  keyframes: frames(r.x, r.y, layers.timing.in, layers.timing.hold, layers.timing.out),
  lines: [{ text: r.text, size: 10, weight: 600, tone: "muted", uppercase: true, tracking: "0.18em" }],
}));

export const BASE_NODES: PitchNode[] = pitch.baseNodes as PitchNode[];
export const GENERATED_NODES: PitchNode[] = [...LISTING_NODES, ...JV_NODES, ...NEG_NODES, ...SELL_NODES, ...LAYER_NODES];
export const PITCH_NODES: PitchNode[] = [...BASE_NODES, ...GENERATED_NODES];

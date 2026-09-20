import {
  CONCEPT_LABELS,
  OVERLAY_COLORS,
  computeFeasibility,
  fmtAedM,
  fmtInt,
  fmtPct,
  fmtSqft,
  shortBedrooms,
  type ConceptData,
} from "@/config/concept";

export type OverlayAnchor = "center" | "left" | "right" | "left-bottom" | "center-bottom";
export type OverlayTier = "detail" | "wide";
/** [start, fadeIn, end, fadeOut] in seconds */
export type OverlayWindow = [number, number, number, number];

export type MotionPath = { keys: [number, number, number][]; dx?: number; dy?: number };
export type OverlayPos = { x: number; y: number } | MotionPath;

export interface OverlayItem {
  id: string;
  pos: OverlayPos;
  anchor: OverlayAnchor;
  window: OverlayWindow;
  tier: OverlayTier;
  text: string | ((time: number) => string);
  size: [number, number];
  color: string;
  weight?: number;
  tracking?: string;
  uppercase?: boolean;
  onLight?: boolean;
  maxWidthPx?: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut = (n: number) => 1 - Math.pow(1 - n, 3);

export function windowOpacity(time: number, [start, fadeIn, end, fadeOut]: OverlayWindow) {
  if (time <= start || time >= end) return 0;
  const a = fadeIn > 0 ? clamp01((time - start) / fadeIn) : 1;
  const b = fadeOut > 0 ? clamp01((end - time) / fadeOut) : 1;
  return Math.min(easeOut(a), easeOut(b));
}

export function resolvePos(pos: OverlayPos, time: number): { x: number; y: number } {
  if (!("keys" in pos)) return pos;
  const { keys, dx = 0, dy = 0 } = pos;
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (time <= first[0]) return { x: first[1] + dx, y: first[2] + dy };
  if (time >= last[0]) return { x: last[1] + dx, y: last[2] + dy };
  for (let i = 1; i < keys.length; i++) {
    const [t, x, y] = keys[i];
    if (time > t) continue;
    const [pt, px, py] = keys[i - 1];
    const p = (time - pt) / (t - pt);
    return { x: px + (x - px) * p + dx, y: py + (y - py) * p + dy };
  }
  return { x: last[1] + dx, y: last[2] + dy };
}

const typed = (text: string, from: number, to: number, reduced: boolean) =>
  reduced
    ? () => text
    : (time: number) => {
        const p = clamp01((time - from) / (to - from));
        return text.slice(0, Math.round(p * text.length));
      };

const counted = (value: number, fmt: (n: number) => string, from: number, dur: number, reduced: boolean) =>
  reduced ? () => fmt(value) : (time: number) => fmt(value * easeOut(clamp01((time - from) / dur)));

// Frame-space layout constants (1280x720 concept film), taken from the original site.
const LISTING_X = 1147;
const LISTING_YS = [291, 357, 424, 490];
const LISTING_END: [number, number] = [4.05, 0.3];
const GAUGE_PATHS: MotionPath[] = [
  { keys: [[10.5, 349, 366], [12, 290, 358], [12.5, 242, 347], [12.8, 203, 338]] },
  { keys: [[10.5, 549, 404], [12, 501, 405], [12.5, 462, 396], [12.8, 430, 390]] },
  { keys: [[10.5, 748, 465], [12, 718, 473], [12.5, 691, 474], [12.8, 667, 475]] },
];
const SELECTED_PATH: MotionPath = { keys: [[15.5, 413, 532], [17.5, 400, 540]] };
const DASH_START = 18.45;
const DASH_END: [number, number] = [21, 0.35];
const METRIC_COUNT_START = 18.55;
const METRIC_COUNT_DUR = 0.85;
const BAR_YS = [363, 383, 422, 444.5, 466.5, 488.5];
const BAR_LABEL_X = 75;
const BAR_VALUE_X = 292;
const BAR_Y_SHIFT = 11;
const LEGEND_X = 288;
const LEGEND_YS = [166, 194, 223];
const METRIC_XS = [1030, 1160];
const METRIC_YS = [442, 501];
const BROCHURE_PATH: [number, number, number][] = [
  [26.7, 977, 289],
  [26.9, 925, 313.5],
  [27, 912, 315.5],
  [27.2, 896, 307.5],
  [27.4, 885, 300.5],
  [27.6, 878, 294],
  [27.8, 873, 290],
  [28, 871, 288],
  [28.2917, 870, 286.5],
];
const BROCHURE_LOCATION_DY = 12.5;
const BROCHURE_DESCRIPTOR_DY = 272.5;
const BROCHURE_WINDOW: OverlayWindow = [26.75, 0.75, 40, 0];

export function buildConceptOverlays(d: ConceptData, reducedMotion: boolean): OverlayItem[] {
  const f = computeFeasibility(d);
  const { ivory, muted, gold, dark } = OVERLAY_COLORS;
  const items: OverlayItem[] = [];

  [fmtSqft(d.plotAreaSqft), `${fmtInt(d.permittedGfaSqft)} GFA`, `${fmtInt(d.parkingGfaSqft)} PARKING`, fmtAedM(d.askingPriceAed)].forEach(
    (text, i) => {
      items.push({
        id: `listing-${i}`,
        pos: { x: LISTING_X, y: LISTING_YS[i] },
        anchor: "center",
        window: [1.8 + i * 0.1, 0.3, LISTING_END[0], LISTING_END[1]],
        tier: "detail",
        text,
        size: [10, 6.4],
        color: dark,
        weight: 600,
        tracking: "0.01em",
        onLight: true,
      });
    },
  );

  items.push({
    id: "brief",
    pos: { x: 332, y: 485 },
    anchor: "left",
    window: [4.45, 0.35, 7.55, 0.4],
    tier: "wide",
    text: typed(d.generatedBrief, 4.65, 6.25, reducedMotion),
    size: [11, 7],
    color: ivory,
    weight: 400,
    tracking: "0.005em",
    maxWidthPx: 620,
  });

  const chips = [d.designStyle.toUpperCase(), shortBedrooms(d.unitMixLabel), d.positioning.toUpperCase()];
  [367, 494, 622].forEach((x, i) => {
    items.push({
      id: `chip-${i}`,
      pos: { x, y: 528 },
      anchor: "center",
      window: [5.35 + i * 0.15, 0.35, 7.55, 0.4],
      tier: "detail",
      text: chips[i],
      size: [9, 5.8],
      color: ivory,
      weight: 500,
      tracking: "0.09em",
      uppercase: true,
    });
  });

  d.options.forEach((o, i) => {
    items.push({
      id: `gauge-${i}`,
      pos: GAUGE_PATHS[i],
      anchor: "center",
      window: [9.85 + i * 0.08, 0.35, 12.95, 0.35],
      tier: "detail",
      text: fmtPct(o.efficiency),
      size: [8, 5.1],
      color: o.recommended ? gold : ivory,
      weight: o.recommended ? 600 : 500,
      tracking: "0.01em",
    });
  });

  items.push({
    id: "selected-efficiency",
    pos: SELECTED_PATH,
    anchor: "center",
    window: [15.45, 0.4, 17.55, 0.3],
    tier: "detail",
    text: `${Math.round(d.efficiency)}%`,
    size: [11, 7],
    color: gold,
    weight: 600,
    tracking: "0.01em",
  });
  items.push({
    id: "selected-callout",
    pos: { x: 48, y: 516 },
    anchor: "left",
    window: [16.6, 0.45, 17.55, 0.3],
    tier: "detail",
    text: `NSA ${fmtSqft(d.nsaSqft)} · ${fmtPct(d.efficiency)} EFFICIENCY`,
    size: [10, 6.4],
    color: ivory,
    weight: 500,
    tracking: "0.1em",
    uppercase: true,
  });

  const heading = (id: string, x: number, text: string, delay: number): OverlayItem => ({
    id,
    pos: { x, y: 96 },
    anchor: "left",
    window: [DASH_START + delay, 0.35, DASH_END[0], DASH_END[1]],
    tier: "detail",
    text,
    size: [8.5, 5.4],
    color: muted,
    weight: 600,
    tracking: "0.16em",
    uppercase: true,
  });
  items.push(heading("left-heading", 72, CONCEPT_LABELS.leftHeading, 0));
  items.push(heading("right-heading", 974, CONCEPT_LABELS.rightHeading, 0.05));
  items.push({
    id: "right-caption",
    pos: { x: 974, y: 119 },
    anchor: "left",
    window: [DASH_START + 0.12, 0.35, DASH_END[0], DASH_END[1]],
    tier: "detail",
    text: CONCEPT_LABELS.rightCaption,
    size: [7.5, 4.8],
    color: muted,
    weight: 500,
    tracking: "0.14em",
    uppercase: true,
  });

  const mix: [string, number][] = [
    [CONCEPT_LABELS.unitMix[0], d.unitMix.oneBedroom],
    [CONCEPT_LABELS.unitMix[1], d.unitMix.twoBedroom],
    [CONCEPT_LABELS.unitMix[2], d.unitMix.threeBedroom],
  ];
  mix.forEach(([label, pct], i) => {
    items.push({
      id: `legend-${i}`,
      pos: { x: LEGEND_X, y: LEGEND_YS[i] },
      anchor: "left",
      window: [DASH_START + 0.18 + i * 0.07, 0.3, DASH_END[0], DASH_END[1]],
      tier: "detail",
      text: `${label} ${pct}%`,
      size: [8, 5.1],
      color: i === 0 ? ivory : muted,
      weight: 500,
      tracking: "0.04em",
    });
  });

  const bars: [string, string][] = [
    [CONCEPT_LABELS.bars[0], fmtInt(d.permittedGfaSqft)],
    [CONCEPT_LABELS.bars[1], fmtInt(d.nsaSqft)],
    [CONCEPT_LABELS.bars[2], fmtPct(d.efficiency)],
    [CONCEPT_LABELS.bars[3], fmtInt(d.totalUnits)],
    [CONCEPT_LABELS.bars[4], fmtInt(d.parkingSpaces)],
    [CONCEPT_LABELS.bars[5], fmtInt(d.floors)],
  ];
  bars.forEach(([label, value], i) => {
    const y = BAR_YS[i] - BAR_Y_SHIFT;
    const win: OverlayWindow = [DASH_START + 0.3 + i * 0.06, 0.3, DASH_END[0], DASH_END[1]];
    items.push({
      id: `bar-label-${i}`,
      pos: { x: BAR_LABEL_X, y },
      anchor: "left",
      window: win,
      tier: "detail",
      text: label,
      size: [7, 4.5],
      color: muted,
      weight: 500,
      tracking: "0.14em",
      uppercase: true,
    });
    items.push({
      id: `bar-value-${i}`,
      pos: { x: BAR_VALUE_X, y },
      anchor: "right",
      window: win,
      tier: "detail",
      text: value,
      size: [8, 5.1],
      color: ivory,
      weight: 600,
      tracking: "0.01em",
    });
  });

  const metrics: [string, number, (n: number) => string][] = [
    [CONCEPT_LABELS.metrics[0], f.totalDevelopmentCost, fmtAedM],
    [CONCEPT_LABELS.metrics[1], f.projectedRevenue, fmtAedM],
    [CONCEPT_LABELS.metrics[2], f.grossProfit, fmtAedM],
    [CONCEPT_LABELS.metrics[3], f.profitMargin, fmtPct],
  ];
  metrics.forEach(([label, value, fmt], i) => {
    const x = METRIC_XS[i % 2];
    const y = METRIC_YS[Math.floor(i / 2)];
    const win: OverlayWindow = [DASH_START + 0.1 + i * 0.05, 0.35, DASH_END[0], DASH_END[1]];
    items.push({
      id: `metric-label-${i}`,
      pos: { x, y: y - 9 },
      anchor: "center",
      window: win,
      tier: "wide",
      text: label,
      size: [7.5, 5.5],
      color: muted,
      weight: 500,
      tracking: "0.14em",
      uppercase: true,
    });
    items.push({
      id: `metric-value-${i}`,
      pos: { x, y: y + 5 },
      anchor: "center",
      window: win,
      tier: "wide",
      text: counted(value, fmt, METRIC_COUNT_START, METRIC_COUNT_DUR, reducedMotion),
      size: [12, 8],
      color: gold,
      weight: 600,
      tracking: "0.01em",
    });
  });

  items.push({
    id: "brochure-name",
    pos: { keys: BROCHURE_PATH, dy: -1 },
    anchor: "left-bottom",
    window: BROCHURE_WINDOW,
    tier: "wide",
    text: d.projectName.toUpperCase(),
    size: [16, 10],
    color: ivory,
    weight: 500,
    tracking: "0.05em",
    uppercase: true,
  });
  items.push({
    id: "brochure-location",
    pos: { keys: BROCHURE_PATH, dy: BROCHURE_LOCATION_DY },
    anchor: "left-bottom",
    window: [BROCHURE_WINDOW[0] + 0.15, 0.75, BROCHURE_WINDOW[2], 0],
    tier: "wide",
    text: d.locationName.toUpperCase(),
    size: [9, 6.5],
    color: gold,
    weight: 500,
    tracking: "0.18em",
    uppercase: true,
  });
  items.push({
    id: "brochure-descriptor",
    pos: { keys: BROCHURE_PATH, dx: 2, dy: BROCHURE_DESCRIPTOR_DY },
    anchor: "left-bottom",
    window: [BROCHURE_WINDOW[0] + 0.3, 0.75, BROCHURE_WINDOW[2], 0],
    tier: "detail",
    text: CONCEPT_LABELS.brochureDescriptor,
    size: [7.5, 4.8],
    color: muted,
    weight: 500,
    tracking: "0.14em",
    uppercase: true,
  });

  return items;
}

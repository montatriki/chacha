import concept from "@data/content/concept.json";

export interface ConceptOption {
  name: string;
  efficiency: number;
  recommended: boolean;
}

export interface ConceptData {
  plotAreaSqft: number;
  permittedGfaSqft: number;
  parkingGfaSqft: number;
  askingPriceAed: number;
  developmentType: string;
  designStyle: string;
  unitMixLabel: string;
  positioning: string;
  generatedBrief: string;
  options: ConceptOption[];
  selectedOption: string;
  nsaSqft: number;
  efficiency: number;
  buaSqft: number;
  unitMix: { oneBedroom: number; twoBedroom: number; threeBedroom: number };
  totalUnits: number;
  parkingSpaces: number;
  floors: number;
  constructionCostPerSqft: number;
  proposedSellingPricePerSqft: number;
  otherCostsAed: number;
  projectName: string;
  locationName: string;
}

export interface ConceptScene {
  id: string;
  window: [number, number, number, number];
  x: number;
  y: number;
  align: "left" | "center" | "right";
  widthPct: number;
  title: string;
  body: string;
  footer?: string;
}

export const CONCEPT_FILM = concept.film;
export const CONCEPT_PLAYBACK_RATE = concept.playbackRate;
export const CONCEPT_MIN_WIDTH_DETAIL = concept.minWidthDetail;
export const CONCEPT_MIN_WIDTH_WIDE = concept.minWidthWide;
export const CONCEPT_PALETTE = concept.palette;
export const CONCEPT_DATA: ConceptData = concept.data;
export const CONCEPT_LABELS = concept.labels;
export const CONCEPT_SCENES: ConceptScene[] = concept.scenes as ConceptScene[];

export const OVERLAY_VARS = {
  "--overlay-ivory": CONCEPT_PALETTE.ivory,
  "--overlay-muted": CONCEPT_PALETTE.muted,
  "--overlay-gold": CONCEPT_PALETTE.gold,
  "--overlay-dark": CONCEPT_PALETTE.dark,
} as Record<string, string>;

export const OVERLAY_COLORS = {
  ivory: "var(--overlay-ivory)",
  muted: "var(--overlay-muted)",
  gold: "var(--overlay-gold)",
  dark: "var(--overlay-dark)",
};

export function computeFeasibility(d: ConceptData) {
  const constructionCost = d.buaSqft * d.constructionCostPerSqft;
  const projectedRevenue = d.nsaSqft * d.proposedSellingPricePerSqft;
  const totalDevelopmentCost = d.askingPriceAed + constructionCost + d.otherCostsAed;
  const grossProfit = projectedRevenue - totalDevelopmentCost;
  const profitMargin = (grossProfit / projectedRevenue) * 100;
  return { constructionCost, projectedRevenue, totalDevelopmentCost, grossProfit, profitMargin };
}

const nf = new Intl.NumberFormat("en-US");
export const fmtInt = (n: number) => nf.format(Math.round(n));
export const fmtSqft = (n: number) => `${fmtInt(n)} SQ FT`;
export const fmtAedM = (n: number) => `AED ${(Math.round(n / 1e5) / 10).toFixed(1)}M`;
export const fmtPct = (n: number) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
export const shortBedrooms = (s: string) => s.toUpperCase().replace(/BEDROOM/g, "BR");

export function conceptTranscript(d: ConceptData) {
  const f = computeFeasibility(d);
  return [
    `ARADI concept study for ${d.projectName}, ${d.locationName}.`,
    `Listing: plot area ${fmtSqft(d.plotAreaSqft)}, permitted GFA ${fmtInt(d.permittedGfaSqft)}, parking GFA ${fmtInt(d.parkingGfaSqft)}, asking price ${fmtAedM(d.askingPriceAed)}.`,
    `Generated brief: ${d.generatedBrief}. ${d.developmentType}, ${d.designStyle}, ${d.unitMixLabel}, ${d.positioning} positioning.`,
    `Massing options: ${d.options.map((o) => `${o.name} at ${fmtPct(o.efficiency)} efficiency${o.recommended ? " (recommended)" : ""}`).join("; ")}.`,
    `Selected option ${d.selectedOption}: NSA ${fmtSqft(d.nsaSqft)} at ${fmtPct(d.efficiency)} efficiency, BUA ${fmtInt(d.buaSqft)} sq ft, ${d.totalUnits} units, ${d.parkingSpaces} parking spaces, ${d.floors} floors.`,
    `Unit mix: ${d.unitMix.oneBedroom}% one bedroom, ${d.unitMix.twoBedroom}% two bedroom, ${d.unitMix.threeBedroom}% three bedroom.`,
    `Feasibility: total development cost ${fmtAedM(f.totalDevelopmentCost)}, projected revenue ${fmtAedM(f.projectedRevenue)}, gross profit ${fmtAedM(f.grossProfit)}, margin ${fmtPct(f.profitMargin)}.`,
  ].join(" ");
}

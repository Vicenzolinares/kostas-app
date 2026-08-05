import type { SketchKind } from "@kostas/shared/schemas";

/**
 * The fixed dimension sets from the mockup deck (p4), and where each one's
 * numbered callout sits on its illustration.
 *
 * Definitions live here rather than in the database because they're
 * presentation: the stored row keeps only `key` and `value`, so re-wording
 * a note or nudging a callout doesn't require migrating measurements that
 * were taken months ago. `x`/`y` are percentages of the SVG viewBox so the
 * markers track the drawing at any size.
 */
export interface MeasurementDefinition {
  key: string;
  /** 1-based, matching the circled number on the sketch. */
  number: number;
  label: string;
  note: string;
  callout: { x: number; y: number };
}

export const SOFA_MEASUREMENTS: MeasurementDefinition[] = [
  {
    key: "overallWidth",
    number: 1,
    label: "Overall Width",
    note: "Arm to arm",
    callout: { x: 50, y: 8 },
  },
  {
    key: "overallDepth",
    number: 2,
    label: "Overall Depth",
    note: "Front to back",
    callout: { x: 88, y: 80 },
  },
  {
    key: "overallHeight",
    number: 3,
    label: "Overall Height",
    note: "Floor to top of back",
    callout: { x: 8, y: 50 },
  },
  {
    key: "seatWidth",
    number: 4,
    label: "Seat Width",
    note: "Inside arms",
    callout: { x: 50, y: 47 },
  },
  {
    key: "seatDepth",
    number: 5,
    label: "Seat Depth",
    note: "Back to front of seat",
    callout: { x: 62, y: 55 },
  },
  {
    key: "seatHeight",
    number: 6,
    label: "Seat Height",
    note: "Floor to top of seat",
    callout: { x: 34, y: 72 },
  },
  {
    key: "armWidth",
    number: 7,
    label: "Arm Width",
    note: "Each arm",
    callout: { x: 90, y: 45 },
  },
  {
    key: "legHeight",
    number: 8,
    label: "Leg Height",
    note: "Floor to bottom of frame",
    callout: { x: 50, y: 90 },
  },
  {
    key: "clearanceNeeded",
    number: 9,
    label: "Clearance Needed",
    note: "For delivery / hallways",
    callout: { x: 16, y: 90 },
  },
];

export const WINDOW_MEASUREMENTS: MeasurementDefinition[] = [
  {
    key: "windowWidth",
    number: 1,
    label: "Window Width",
    note: "Inside trim",
    callout: { x: 50, y: 33 },
  },
  {
    key: "windowHeight",
    number: 2,
    label: "Window Height",
    note: "Top of trim to sill",
    callout: { x: 66, y: 55 },
  },
  {
    key: "rodWidth",
    number: 3,
    label: "Rod Width",
    note: "End to end",
    callout: { x: 50, y: 8 },
  },
  {
    key: "rodHeight",
    number: 4,
    label: "Rod Height",
    note: "Floor to bottom of rod",
    callout: { x: 12, y: 45 },
  },
  {
    key: "curtainLength",
    number: 5,
    label: "Curtain Length",
    note: "Floor to bottom",
    callout: { x: 88, y: 60 },
  },
  {
    key: "stackBack",
    number: 6,
    label: "Stack Back (Each Side)",
    note: "When open",
    callout: { x: 22, y: 88 },
  },
  {
    key: "reveal",
    number: 7,
    label: "Reveal (Each Side)",
    note: "From trim to fabric",
    callout: { x: 74, y: 88 },
  },
];

export const SHEET_DEFINITIONS: Record<SketchKind, MeasurementDefinition[]> = {
  sofa: SOFA_MEASUREMENTS,
  window: WINDOW_MEASUREMENTS,
};

export const SHEET_TITLES: Record<SketchKind, string> = {
  sofa: "Sofa / Furniture Measurements",
  window: "Window Treatments Measurements",
};

const CM_PER_INCH = 2.54;

/**
 * Values are stored in inches; the deck's toggle only changes how they're
 * shown. Converting on display rather than on save means switching units
 * can never round-trip a measurement into a slightly different number.
 */
export function toDisplay(valueInches: number, unit: "in" | "cm"): number {
  const converted = unit === "cm" ? valueInches * CM_PER_INCH : valueInches;
  return Math.round(converted * 100) / 100;
}

/** Inverse of `toDisplay`, for values typed while the sheet is in centimetres. */
export function fromDisplay(value: number, unit: "in" | "cm"): number {
  const inches = unit === "cm" ? value / CM_PER_INCH : value;
  return Math.round(inches * 100) / 100;
}

import type { CalendarEventType } from "@kostas/shared/schemas";

/**
 * The deck (p10) shows a longer "My Calendars" list than this app actually
 * stores — Reminders, Holidays, Employee Off and a per-user "Other
 * Calendars" section are all categories `calendar_event_type` has no value
 * for. Rather than render checkboxes that filter nothing, the rail lists
 * exactly the six types the schema supports, styled with the deck's own
 * hues (sampled from its swatches) so the colour language still matches.
 */
export interface CalendarCategory {
  type: CalendarEventType;
  label: string;
  color: string;
}

const FALLBACK: CalendarCategory = { type: "other", label: "Reminders", color: "#e0674d" };

export const CALENDAR_CATEGORIES: readonly CalendarCategory[] = [
  { type: "measurement_appointment", label: "Measurements", color: "#22bcc8" },
  { type: "fabric_delivery", label: "Fabric Orders", color: "#46ac64" },
  { type: "production", label: "Work Orders", color: "#7918fa" },
  { type: "quality_check", label: "Quality Checks", color: "#fb9543" },
  { type: "delivery_installation", label: "Deliveries", color: "#c03ac0" },
  { type: "other", label: "Reminders", color: "#e0674d" },
];

const BY_TYPE = new Map(CALENDAR_CATEGORIES.map((c) => [c.type, c]));

export function categoryFor(type: CalendarEventType): CalendarCategory {
  return BY_TYPE.get(type) ?? FALLBACK;
}

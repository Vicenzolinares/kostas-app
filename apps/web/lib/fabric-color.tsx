/**
 * Fabric colour swatches.
 *
 * `fabric_inventory.color` is free text (a colour *name* like "Oatmeal"),
 * not a hex value — the mockup deck shows a colour chip next to every
 * fabric row, so something has to turn the name into a paintable colour.
 *
 * The map below is a lookup, not a guess. The first ten entries are the
 * exact hexes the demo seed already uses to render each fabric's swatch
 * PNG (packages/database/src/scripts/seed.ts), so the chip in a grid row
 * and the seeded photo of that fabric are the same colour by construction.
 * The rest are standard upholstery colour names.
 *
 * Names that aren't in the map deliberately return `null` and render as a
 * struck-through neutral chip rather than a made-up colour: inventing a
 * hue from a hash would look convincing and be wrong, and a buyer picking
 * fabric off a screen is exactly the person that would hurt. Adding a real
 * `color_hex` column is the fix if the name list ever stops covering the
 * catalog.
 */

const FABRIC_COLOR_HEX: Record<string, string> = {
  // Seeded catalog — hexes mirror packages/database/src/scripts/seed.ts.
  oatmeal: "#D9CDB8",
  emerald: "#1F6F5C",
  slate: "#5A6470",
  ivory: "#EDE6DA",
  cognac: "#8B4A2B",
  marineblue: "#26456E",
  champagne: "#E3D2A5",
  chalk: "#F2F0EA",
  terracotta: "#B4562F",
  indigo: "#2E3A64",

  // Common upholstery colour names beyond the seeded set.
  natural: "#E2D8C3",
  linen: "#E6DFD1",
  flax: "#D6C7A8",
  sand: "#D8C7AC",
  taupe: "#B3A395",
  greige: "#BFB5A8",
  bone: "#E8E2D5",
  cream: "#F1E9D8",
  white: "#F7F7F5",
  pearl: "#EDEAE3",
  dove: "#CFCBC4",
  fog: "#C4C3BF",
  ash: "#A9A8A4",
  pewter: "#8E8E8C",
  graphite: "#4A4A4D",
  charcoal: "#36363A",
  black: "#1B1B1D",
  ink: "#22242B",
  navy: "#1F2A44",
  midnight: "#1B2138",
  denim: "#3E5C82",
  cornflower: "#6E8FC4",
  sky: "#A9C4DE",
  teal: "#1F5F66",
  seafoam: "#AFCEC2",
  sage: "#A7B39A",
  olive: "#6E7248",
  moss: "#5A6B45",
  forest: "#2C4432",
  hunter: "#2F4A3C",
  mustard: "#C89B30",
  ochre: "#C08A2E",
  gold: "#C9A227",
  amber: "#C8801F",
  rust: "#A5502A",
  brick: "#96432F",
  paprika: "#B0472F",
  tomato: "#C24634",
  crimson: "#9E2B34",
  burgundy: "#6B2733",
  wine: "#5C2733",
  plum: "#5A3350",
  aubergine: "#4A2A44",
  lavender: "#B7ACD6",
  lilac: "#C3B4DA",
  violet: "#6A4FA3",
  blush: "#E3C3BC",
  rose: "#C98B8B",
  coral: "#D9705E",
  peach: "#E7B79A",
  camel: "#B78B58",
  caramel: "#A9713C",
  saddle: "#8A5A32",
  chocolate: "#4E342A",
  espresso: "#3A2A22",
  walnut: "#5B4033",
  chestnut: "#6B4130",
  mahogany: "#6A3529",
  tobacco: "#7A5230",
  honey: "#CBA059",
  wheat: "#DCC7A0",
  straw: "#D9C68C",
  celadon: "#B6C9B4",
  mint: "#BEDCC9",
  aqua: "#8FC5C4",
  turquoise: "#3E9C9B",
  cobalt: "#2B4C9B",
  royalblue: "#2E4FA8",
  steel: "#6B7A8C",
  stone: "#B8B2A7",
  putty: "#C9BEAC",
  mushroom: "#B2A395",
  clay: "#B58163",
  copper: "#A5643C",
  bronze: "#8A6A3C",
  silver: "#C6C7C9",
};

/** Normalises "Marine Blue" / "marine-blue" / "MARINE BLUE" to one key. */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Returns the hex for a fabric colour name, or `null` when the name isn't
 * one we hold a real value for. Never fabricates a colour.
 */
export function fabricColorHex(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = normalize(name);
  if (!key) return null;
  if (FABRIC_COLOR_HEX[key]) return FABRIC_COLOR_HEX[key];

  // "Marine Blue Heather" — fall back to the longest known name that the
  // value starts with, so modifiers don't drop the chip entirely.
  const prefix = Object.keys(FABRIC_COLOR_HEX)
    .filter((known) => key.startsWith(known) || key.endsWith(known))
    .sort((a, b) => b.length - a.length)[0];

  return prefix ? (FABRIC_COLOR_HEX[prefix] ?? null) : null;
}

export interface FabricSwatchProps {
  color: string | null | undefined;
  /** Rendered size in px. Grid rows use 14, detail panels 20+. */
  size?: number;
  className?: string;
}

/**
 * A square colour chip for a fabric colour name.
 *
 * Unknown names render as a muted chip with a diagonal strike — visibly
 * "no colour on file" rather than a plausible-looking wrong one. The
 * accessible name always carries the colour text, so the chip adds
 * information for sighted users without removing any for screen readers.
 */
export function FabricSwatch({
  color,
  size = 14,
  className,
}: FabricSwatchProps) {
  const hex = fabricColorHex(color);
  const label = color?.trim() ? color : "No colour recorded";

  return (
    <span
      role="img"
      aria-label={
        hex ? `Colour swatch: ${label}` : `${label} — no swatch colour on file`
      }
      title={hex ? label : `${label} — no swatch colour on file`}
      data-testid="fabric-swatch"
      data-color-hex={hex ?? ""}
      className={`inline-block shrink-0 rounded-[3px] border border-black/15 dark:border-white/20 ${
        hex ? "" : "bg-muted"
      } ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        ...(hex
          ? { backgroundColor: hex }
          : {
              // Diagonal strike = "unknown", not a colour claim.
              backgroundImage:
                "linear-gradient(135deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%)",
              color: "var(--muted-foreground)",
            }),
      }}
    />
  );
}

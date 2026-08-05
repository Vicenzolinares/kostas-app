import type { PhotoReference, PhotoSearch } from "@kostas/database/schema";
import type { PhotoMatchCandidate } from "@kostas/shared/schemas";

export type { PhotoReference, PhotoSearch, PhotoMatchCandidate };

export interface PhotoSearchWithMatches extends PhotoSearch {
  matches: PhotoMatchCandidate[];
}

/** One label/value row in the match card's detail list. */
export interface PhotoMatchDetailField {
  label: string;
  value: string | null;
}

/**
 * The catalog record a ranked candidate points at, resolved for display.
 * `null` on a candidate whose item/fabric row has since been deleted, or
 * on a reference photo linked to neither.
 */
export interface PhotoMatchDetail {
  kind: "item" | "fabric";
  /** SKU or fabric code. */
  code: string;
  title: string;
  /** Fabric colour *name* — see lib/fabric-color for the chip mapping. */
  colorName: string | null;
  /** Module the record lives in, for the "View" link. */
  href: string;
  fields: PhotoMatchDetailField[];
}

export interface EnrichedPhotoMatch extends PhotoMatchCandidate {
  detail: PhotoMatchDetail | null;
}

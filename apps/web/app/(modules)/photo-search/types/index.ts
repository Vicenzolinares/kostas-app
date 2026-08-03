import type { PhotoReference, PhotoSearch } from "@kostas/database/schema";
import type { PhotoMatchCandidate } from "@kostas/shared/schemas";

export type { PhotoReference, PhotoSearch, PhotoMatchCandidate };

export interface PhotoSearchWithMatches extends PhotoSearch {
  matches: PhotoMatchCandidate[];
}

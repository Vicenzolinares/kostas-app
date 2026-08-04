import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import type { PhotoMatchCandidate } from "@kostas/shared/schemas";
import { listPhotoReferences } from "@/app/(modules)/photo-search/api/queries";
import { STORAGE_ROOT_DIR } from "@/lib/storage";

/**
 * Local stand-in for AI photo matching, used when OPENAI_API_KEY is unset.
 *
 * This does NOT call a model and does not pretend to. It ranks the seeded
 * reference photos by average-colour distance in Lab-ish weighted RGB —
 * a real, explainable local computation. That matters for a demo: fabric
 * swatches genuinely do sort by colour, so uploading a photo of a green
 * chair surfaces the emerald mohair rather than a random row. A fabricated
 * score would look identical on screen but fall apart the moment anyone
 * uploads a second photo.
 *
 * The tradeoff is stated plainly in the UI: this is colour similarity, not
 * semantic understanding. Real embeddings (shape, texture, material) arrive
 * with the OpenAI provider — see packages/shared/src/ai-vision.
 */

const TOP_N = 4;
/** Above this, the UI treats the top hit as a match rather than a no-match. */
export const DEMO_MATCH_THRESHOLD = 0.8;

/** Perceptual-ish channel weights: the eye is most sensitive to green. */
const WEIGHT_R = 0.3;
const WEIGHT_G = 0.59;
const WEIGHT_B = 0.11;
/** Worst-case weighted distance, used to normalise into 0..1. */
const MAX_DISTANCE = Math.sqrt((WEIGHT_R + WEIGHT_G + WEIGHT_B) * 255 * 255);

type Rgb = [number, number, number];

/** Mean colour of an image, via a 1x1 resize — cheap and dependency-free. */
async function averageColor(image: Buffer): Promise<Rgb | null> {
  try {
    const { data } = await sharp(image)
      .removeAlpha()
      .resize(1, 1, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
  } catch {
    // Unreadable/corrupt reference file shouldn't fail the whole search.
    return null;
  }
}

function similarity(a: Rgb, b: Rgb): number {
  const distance = Math.sqrt(
    WEIGHT_R * (a[0] - b[0]) ** 2 +
      WEIGHT_G * (a[1] - b[1]) ** 2 +
      WEIGHT_B * (a[2] - b[2]) ** 2,
  );
  const score = 1 - distance / MAX_DISTANCE;
  // Clamp so a pathological input can't produce a score outside the
  // 0..1 range PhotoMatchCandidate declares.
  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
}

export interface DemoMatchResult {
  matches: PhotoMatchCandidate[];
  description: string;
}

/**
 * Ranks seeded reference photos against `image` by colour similarity.
 * Returns an empty list when no reference photos exist (fresh database),
 * which the caller surfaces as a no-match rather than an error.
 */
export async function findDemoMatches(image: Buffer): Promise<DemoMatchResult> {
  const uploadedColor = await averageColor(image);
  const references = await listPhotoReferences();

  if (!uploadedColor || references.length === 0) {
    return {
      matches: [],
      description:
        "Demo mode — no reference photos in the catalog to compare against yet.",
    };
  }

  const scored = await Promise.all(
    references.map(async (reference) => {
      let file: Buffer;
      try {
        file = await readFile(
          path.join(STORAGE_ROOT_DIR, reference.storageKey),
        );
      } catch {
        return null; // reference row without a file on disk — skip it
      }
      const color = await averageColor(file);
      if (!color) return null;

      return {
        referenceId: reference.id,
        label: reference.label,
        storageKey: reference.storageKey,
        itemId: reference.itemId,
        fabricId: reference.fabricId,
        similarity: similarity(uploadedColor, color),
      } satisfies PhotoMatchCandidate;
    }),
  );

  const matches = scored
    .filter((candidate): candidate is PhotoMatchCandidate => candidate !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_N);

  const [r, g, b] = uploadedColor;
  return {
    matches,
    description:
      `Demo mode — ranked by colour similarity (average RGB ${r}, ${g}, ${b}), ` +
      "not by AI. Connect OPENAI_API_KEY for true visual matching.",
  };
}

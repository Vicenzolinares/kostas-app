import "server-only";
import { cosineDistance, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  fabricInventory,
  itemsInventory,
  photoReferences,
  photoSearches,
} from "@kostas/database";
import type { PhotoMatchCandidate } from "@kostas/shared/schemas";
import type { EnrichedPhotoMatch, PhotoMatchDetail } from "../types";

const TOP_N_MATCHES = 5;

/**
 * pgvector cosine-similarity search: ranks photo_references by cosine
 * distance to the search embedding (`<=>` operator, via drizzle-orm's
 * cosineDistance helper) and returns the closest N as similarity scores
 * (1 - distance) for the manual-review UI's confidence display.
 */
export async function findSimilarPhotos(embedding: number[], limit = TOP_N_MATCHES): Promise<PhotoMatchCandidate[]> {
  const similarity = sql<number>`1 - (${cosineDistance(photoReferences.embedding, embedding)})`;

  const rows = await db
    .select({
      referenceId: photoReferences.id,
      label: photoReferences.label,
      storageKey: photoReferences.storageKey,
      itemId: photoReferences.itemId,
      fabricId: photoReferences.fabricId,
      similarity,
    })
    .from(photoReferences)
    .orderBy(desc(similarity))
    .limit(limit);

  return rows.map((row) => ({ ...row, similarity: Number(row.similarity) }));
}

export async function listPhotoReferences() {
  return db.select().from(photoReferences).orderBy(desc(photoReferences.createdAt));
}

/**
 * Attaches the catalog record behind each ranked candidate so the review
 * card can show what the user is actually confirming (SKU, bin location,
 * fabric code, colour) instead of a bare filename and a percentage.
 *
 * Only the fields that exist on `items_inventory` / `fabric_inventory` are
 * returned. The deck's match card also lists Project, Room and Work Order,
 * but a photo reference has no link to any of those — see the note in
 * components/match-review.tsx.
 */
export async function enrichMatches(
  matches: PhotoMatchCandidate[],
): Promise<EnrichedPhotoMatch[]> {
  const itemIds = [
    ...new Set(matches.map((m) => m.itemId).filter((id): id is string => !!id)),
  ];
  const fabricIds = [
    ...new Set(
      matches.map((m) => m.fabricId).filter((id): id is string => !!id),
    ),
  ];

  const [items, fabrics] = await Promise.all([
    itemIds.length
      ? db
          .select()
          .from(itemsInventory)
          .where(inArray(itemsInventory.id, itemIds))
      : Promise.resolve([]),
    fabricIds.length
      ? db
          .select()
          .from(fabricInventory)
          .where(inArray(fabricInventory.id, fabricIds))
      : Promise.resolve([]),
  ]);

  const itemsById = new Map(items.map((row) => [row.id, row]));
  const fabricsById = new Map(fabrics.map((row) => [row.id, row]));

  return matches.map((match) => {
    let detail: PhotoMatchDetail | null = null;

    const fabric = match.fabricId ? fabricsById.get(match.fabricId) : undefined;
    if (fabric) {
      detail = {
        kind: "fabric",
        code: fabric.fabricCode,
        title: fabric.name,
        colorName: fabric.color,
        href: "/fabric-inventory",
        fields: [
          { label: "Mill", value: fabric.mill },
          { label: "Pattern", value: fabric.pattern },
          { label: "Composition", value: fabric.composition },
          {
            label: "Yards in stock",
            value: fabric.yardsInStock ? `${fabric.yardsInStock} yd` : null,
          },
          { label: "Location", value: fabric.warehouseLocation },
        ].filter((field) => field.value != null && field.value !== ""),
      };
    }

    const item = match.itemId ? itemsById.get(match.itemId) : undefined;
    if (!detail && item) {
      detail = {
        kind: "item",
        code: item.sku,
        title: item.name,
        colorName: null,
        href: "/items-inventory",
        fields: [
          { label: "Category", value: item.category },
          { label: "On hand", value: `${item.quantity} ${item.unit}` },
          { label: "Location", value: item.binLocation },
        ].filter((field) => field.value != null && field.value !== ""),
      };
    }

    return { ...match, detail };
  });
}

export async function getPhotoSearchById(id: string) {
  return db.query.photoSearches.findFirst({ where: eq(photoSearches.id, id) });
}

export async function listPhotoSearches(limit = 50) {
  return db.select().from(photoSearches).orderBy(desc(photoSearches.createdAt)).limit(limit);
}

/**
 * Recent searches for the sidebar panel on deck p13. Left-joins the
 * confirmed reference so a confirmed row can name what it was matched to;
 * pending/no-match rows have nothing to name and say so.
 */
export async function listRecentPhotoSearches(limit = 6) {
  return db
    .select({
      id: photoSearches.id,
      storageKey: photoSearches.storageKey,
      status: photoSearches.status,
      confidenceScore: photoSearches.confidenceScore,
      createdAt: photoSearches.createdAt,
      matchedLabel: photoReferences.label,
    })
    .from(photoSearches)
    .leftJoin(
      photoReferences,
      eq(photoSearches.confirmedMatchId, photoReferences.id),
    )
    .orderBy(desc(photoSearches.createdAt))
    .limit(limit);
}

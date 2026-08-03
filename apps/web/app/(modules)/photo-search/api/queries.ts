import "server-only";
import { cosineDistance, desc, eq, sql } from "drizzle-orm";
import { db, photoReferences, photoSearches } from "@kostas/database";
import type { PhotoMatchCandidate } from "@kostas/shared/schemas";

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

export async function getPhotoSearchById(id: string) {
  return db.query.photoSearches.findFirst({ where: eq(photoSearches.id, id) });
}

export async function listPhotoSearches(limit = 50) {
  return db.select().from(photoSearches).orderBy(desc(photoSearches.createdAt)).limit(limit);
}

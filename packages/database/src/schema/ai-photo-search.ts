import { pgTable, uuid, text, timestamp, numeric, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { itemsInventory } from "./items-inventory";
import { fabricInventory } from "./fabric-inventory";

// Reference photos (of catalog items/fabrics) with a CLIP-style embedding
// for similarity search. `embedding` uses pgvector (see
// docker/docker-compose.yml — the postgres image must support the
// `vector` extension) and requires the OPENAI_API_KEY-backed
// AIVisionProvider (packages/shared/src/ai-vision) to populate.
export const photoReferences = pgTable("photo_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull(),
  itemId: uuid("item_id").references(() => itemsInventory.id, { onDelete: "cascade" }),
  fabricId: uuid("fabric_id").references(() => fabricInventory.id, { onDelete: "cascade" }),
  label: text("label"),
  // text-embedding-3-small / CLIP-class dimensionality; the OpenAI vision
  // provider embeds a generated description of the image at this size.
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PhotoReference = typeof photoReferences.$inferSelect;
export type NewPhotoReference = typeof photoReferences.$inferInsert;

export const photoSearchStatusEnum = ["pending", "matched", "no_match", "confirmed", "rejected"] as const;

// One row per uploaded search photo: upload -> Sharp optimize -> AI vision
// call -> pgvector similarity search -> confidence score -> manual
// review/save match. `topMatches` snapshots the ranked candidates returned
// at search time so the review UI doesn't need to re-run the query.
export const photoSearches = pgTable("photo_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull(),
  status: text("status", { enum: photoSearchStatusEnum }).notNull().default("pending"),
  embedding: vector("embedding", { dimensions: 1536 }),
  topMatches: text("top_matches"), // JSON-encoded PhotoMatchCandidate[]
  confirmedMatchId: uuid("confirmed_match_id").references((): typeof photoReferences.id => photoReferences.id, {
    onDelete: "set null",
  }),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PhotoSearch = typeof photoSearches.$inferSelect;
export type NewPhotoSearch = typeof photoSearches.$inferInsert;

export const photoReferencesRelations = relations(photoReferences, ({ one }) => ({
  item: one(itemsInventory, { fields: [photoReferences.itemId], references: [itemsInventory.id] }),
  fabric: one(fabricInventory, { fields: [photoReferences.fabricId], references: [fabricInventory.id] }),
}));

export const photoSearchesRelations = relations(photoSearches, ({ one }) => ({
  confirmedMatch: one(photoReferences, {
    fields: [photoSearches.confirmedMatchId],
    references: [photoReferences.id],
  }),
}));

export const AI_EMBEDDING_DIMENSIONS = 1536;

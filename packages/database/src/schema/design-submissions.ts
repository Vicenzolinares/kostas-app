import { pgTable, pgEnum, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { users } from "./users";

// Mirrors the states in apps/web/app/(modules)/designer-portal/machines/
// approval-machine.ts — kept in sync by hand since Postgres enums can't
// import a TS union. If you add a state there, add it here too.
export const designSubmissionStatusEnum = pgEnum("design_submission_status", [
  "draft",
  "submitted",
  "designer_review",
  "approved",
  "changes_requested",
  "production",
  "completed",
]);

export const designSubmissions = pgTable("design_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  submittedById: uuid("submitted_by_id").references(() => users.id, { onDelete: "set null" }),
  designerId: uuid("designer_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  status: designSubmissionStatusEnum("status").notNull().default("draft"),
  // File keys resolved through @kostas/shared's StorageProvider.getUrl().
  fileKeys: jsonb("file_keys").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DesignSubmission = typeof designSubmissions.$inferSelect;
export type NewDesignSubmission = typeof designSubmissions.$inferInsert;

// TipTap comments are stored as JSON (TipTap/ProseMirror doc), not raw HTML.
export const designComments = pgTable("design_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => designSubmissions.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  bodyJson: jsonb("body_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DesignComment = typeof designComments.$inferSelect;
export type NewDesignComment = typeof designComments.$inferInsert;

export const designSubmissionsRelations = relations(designSubmissions, ({ one, many }) => ({
  project: one(projects, {
    fields: [designSubmissions.projectId],
    references: [projects.id],
  }),
  submittedBy: one(users, {
    fields: [designSubmissions.submittedById],
    references: [users.id],
  }),
  designer: one(users, {
    fields: [designSubmissions.designerId],
    references: [users.id],
  }),
  comments: many(designComments),
}));

export const designCommentsRelations = relations(designComments, ({ one }) => ({
  submission: one(designSubmissions, {
    fields: [designComments.submissionId],
    references: [designSubmissions.id],
  }),
  author: one(users, {
    fields: [designComments.authorId],
    references: [users.id],
  }),
}));

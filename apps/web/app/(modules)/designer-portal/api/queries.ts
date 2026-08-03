import "server-only";
import { desc, eq } from "drizzle-orm";
import {
  db,
  designSubmissions,
  designComments,
  projects,
  users,
} from "@kostas/database";
import { alias } from "drizzle-orm/pg-core";
import type {
  DesignSubmissionListItem,
  DesignSubmissionWithComments,
} from "../types";

export async function listDesignSubmissions(): Promise<
  DesignSubmissionListItem[]
> {
  const rows = await db
    .select({ submission: designSubmissions, projectName: projects.name })
    .from(designSubmissions)
    .innerJoin(projects, eq(designSubmissions.projectId, projects.id))
    .orderBy(desc(designSubmissions.updatedAt));

  return rows.map((r) => ({ ...r.submission, projectName: r.projectName }));
}

export async function getDesignSubmission(
  id: string,
): Promise<DesignSubmissionWithComments | undefined> {
  const submittedBy = alias(users, "submitted_by");
  const designer = alias(users, "designer");

  const [row] = await db
    .select({
      submission: designSubmissions,
      projectName: projects.name,
      submittedByName: submittedBy.name,
      designerName: designer.name,
    })
    .from(designSubmissions)
    .innerJoin(projects, eq(designSubmissions.projectId, projects.id))
    .leftJoin(submittedBy, eq(designSubmissions.submittedById, submittedBy.id))
    .leftJoin(designer, eq(designSubmissions.designerId, designer.id))
    .where(eq(designSubmissions.id, id));

  if (!row) return undefined;

  const commentRows = await db
    .select({ comment: designComments, authorName: users.name })
    .from(designComments)
    .leftJoin(users, eq(designComments.authorId, users.id))
    .where(eq(designComments.submissionId, id))
    .orderBy(designComments.createdAt);

  return {
    ...row.submission,
    projectName: row.projectName,
    submittedByName: row.submittedByName,
    designerName: row.designerName,
    comments: commentRows.map((c) => ({
      ...c.comment,
      authorName: c.authorName,
    })),
  };
}

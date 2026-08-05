import "server-only";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  designSubmissions,
  designComments,
  projects,
  users,
} from "@kostas/database";
import type { DesignComment } from "@kostas/database/schema";
import type { DesignSubmissionListItem } from "../types";

/**
 * Queries backing the external Designer Portal.
 *
 * Every one of these is scoped by `designerId` at the database level rather
 * than filtered in the page. A design firm must never be able to see (or
 * act on) another firm's work, and the safest place to enforce that is the
 * query itself — a component that forgets a filter is a data leak, whereas
 * a query that requires the id can't be called without one.
 */

export interface PortalProject extends DesignSubmissionListItem {
  clientName: string;
  dueDate: Date | null;
}

/** Everything assigned to this designer, newest activity first. */
export async function listPortalProjects(
  designerId: string,
): Promise<PortalProject[]> {
  const rows = await db
    .select({
      submission: designSubmissions,
      projectName: projects.name,
      clientName: projects.clientName,
      dueDate: projects.dueDate,
    })
    .from(designSubmissions)
    .innerJoin(projects, eq(designSubmissions.projectId, projects.id))
    .where(eq(designSubmissions.designerId, designerId))
    .orderBy(desc(designSubmissions.updatedAt));

  return rows.map((row) => ({
    ...row.submission,
    projectName: row.projectName,
    clientName: row.clientName,
    dueDate: row.dueDate,
  }));
}

/**
 * The subset actually waiting on this designer's decision. `designer_review`
 * is the only state the approval machine accepts APPROVE / REQUEST_CHANGES
 * from, so it's also the only state the portal offers those buttons in.
 */
export async function listPortalApprovals(
  designerId: string,
): Promise<PortalProject[]> {
  const all = await listPortalProjects(designerId);
  return all.filter((submission) => submission.status === "designer_review");
}

export interface PortalSubmissionDetail extends PortalProject {
  submittedByName: string | null;
  // Full comment rows: the portal reuses the office CommentList component,
  // which expects the whole DesignComment shape.
  comments: (DesignComment & { authorName: string | null })[];
}

/**
 * A single submission, or `undefined` when it isn't this designer's — the
 * caller renders notFound() either way, so a wrong id and someone else's id
 * are indistinguishable from outside.
 */
export async function getPortalSubmission(
  id: string,
  designerId: string,
): Promise<PortalSubmissionDetail | undefined> {
  const [row] = await db
    .select({
      submission: designSubmissions,
      projectName: projects.name,
      clientName: projects.clientName,
      dueDate: projects.dueDate,
      submittedByName: users.name,
    })
    .from(designSubmissions)
    .innerJoin(projects, eq(designSubmissions.projectId, projects.id))
    .leftJoin(users, eq(designSubmissions.submittedById, users.id))
    .where(
      and(
        eq(designSubmissions.id, id),
        eq(designSubmissions.designerId, designerId),
      ),
    );

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
    clientName: row.clientName,
    dueDate: row.dueDate,
    submittedByName: row.submittedByName,
    comments: commentRows.map((c) => ({
      ...c.comment,
      authorName: c.authorName,
    })),
  };
}

/** Recent activity across this designer's projects, for the side rail. */
export async function listPortalUpdates(
  designerId: string,
  limit = 5,
): Promise<{ id: string; title: string; projectName: string; at: Date }[]> {
  const projectsForDesigner = await listPortalProjects(designerId);
  return projectsForDesigner.slice(0, limit).map((submission) => ({
    id: submission.id,
    title: submission.title,
    projectName: submission.projectName,
    at: submission.updatedAt,
  }));
}

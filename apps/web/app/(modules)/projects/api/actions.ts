"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, projects } from "@kostas/database";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@kostas/shared/schemas";
import { requireWriteAccess } from "@/lib/action-auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// Projects are office work: sales owns the client relationship and creates
// the job, managers and admins oversee it. Shop floor reads projects via
// work orders and the department board, and never edits them here.
const WRITE_ROLES = ["admin", "manager", "sales"] as const;

export async function createProjectAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const raw = Object.fromEntries(formData.entries());
  const parsed = createProjectSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { dueDate, budget, clientEmail, clientPhone, description, ...rest } =
    parsed.data;

  await db.insert(projects).values({
    ...rest,
    dueDate: dueDate ?? null,
    budget: budget != null ? String(budget) : null,
    clientEmail: clientEmail || null,
    clientPhone: clientPhone || null,
    description: description || null,
  });

  revalidatePath("/projects");
  return { success: true };
}

export async function updateProjectAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateProjectSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const {
    id,
    dueDate,
    budget,
    clientEmail,
    clientPhone,
    description,
    ...rest
  } = parsed.data;

  await db
    .update(projects)
    .set({
      ...rest,
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(budget !== undefined
        ? { budget: budget != null ? String(budget) : null }
        : {}),
      ...(clientEmail !== undefined
        ? { clientEmail: clientEmail || null }
        : {}),
      ...(clientPhone !== undefined
        ? { clientPhone: clientPhone || null }
        : {}),
      ...(description !== undefined
        ? { description: description || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const denied = await requireWriteAccess(WRITE_ROLES);
  if (denied) return denied;

  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/projects");
  return { success: true };
}

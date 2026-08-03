"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, calendarEvents } from "@kostas/database";
import { createCalendarEventSchema, updateCalendarEventSchema, moveCalendarEventSchema } from "@kostas/shared/schemas";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

async function requireAuth(): Promise<ActionResult | null> {
  try {
    await authProvider.requireRole([]);
    return null;
  } catch (err) {
    if (err instanceof AuthError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong." };
  }
}

export async function createCalendarEventAction(input: unknown): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = createCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { rrule, location, notes, projectId, workOrderId, assignedToId, ...rest } = parsed.data;

  await db.insert(calendarEvents).values({
    ...rest,
    rrule: rrule || null,
    location: location || null,
    notes: notes || null,
    projectId: projectId || null,
    workOrderId: workOrderId || null,
    assignedToId: assignedToId || null,
  });

  revalidatePath("/calendar");
  return { success: true };
}

export async function updateCalendarEventAction(input: unknown): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = updateCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, rrule, location, notes, projectId, workOrderId, assignedToId, ...rest } = parsed.data;

  await db
    .update(calendarEvents)
    .set({
      ...rest,
      ...(rrule !== undefined ? { rrule: rrule || null } : {}),
      ...(location !== undefined ? { location: location || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(projectId !== undefined ? { projectId: projectId || null } : {}),
      ...(workOrderId !== undefined ? { workOrderId: workOrderId || null } : {}),
      ...(assignedToId !== undefined ? { assignedToId: assignedToId || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(calendarEvents.id, id));

  revalidatePath("/calendar");
  return { success: true };
}

/** Persists a FullCalendar drag/resize interaction (eventDrop/eventResize). */
export async function moveCalendarEventAction(input: unknown): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = moveCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, start, end, allDay } = parsed.data;
  await db
    .update(calendarEvents)
    .set({ start, end, ...(allDay !== undefined ? { allDay } : {}), updatedAt: new Date() })
    .where(eq(calendarEvents.id, id));

  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteCalendarEventAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  revalidatePath("/calendar");
  return { success: true };
}

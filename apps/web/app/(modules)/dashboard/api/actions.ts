"use server";

import {
  db,
  dashboardLayouts,
  type DashboardWidgetLayout,
} from "@kostas/database";
import { authProvider } from "@/lib/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function saveDashboardLayoutAction(
  layout: DashboardWidgetLayout[],
): Promise<ActionResult> {
  const session = await authProvider.getSession();
  if (!session) {
    return { success: false, error: "You must be signed in." };
  }

  await db
    .insert(dashboardLayouts)
    .values({ userId: session.user.id, layout, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: dashboardLayouts.userId,
      set: { layout, updatedAt: new Date() },
    });

  return { success: true };
}

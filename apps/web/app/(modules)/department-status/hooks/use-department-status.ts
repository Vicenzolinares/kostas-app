"use client";

import { useRealtimeQuery } from "@kostas/realtime/react";
import type { DepartmentStatusBoard } from "../types";

async function fetchDepartmentStatus(): Promise<DepartmentStatusBoard> {
  const res = await fetch("/api/department-status");
  if (!res.ok) throw new Error("Failed to load department status.");
  return res.json();
}

/**
 * Polls `/api/department-status` every 5s via the RealtimeProvider
 * abstraction (packages/realtime). Swapping to Supabase Realtime later only
 * means changing the provider passed to <RealtimeProviderRoot> in
 * apps/web/app/providers.tsx — this hook (and every consumer of it) is
 * unaffected.
 */
export function useDepartmentStatus() {
  return useRealtimeQuery({
    queryKey: ["department-status"],
    queryFn: fetchDepartmentStatus,
    intervalMs: 5000,
  });
}

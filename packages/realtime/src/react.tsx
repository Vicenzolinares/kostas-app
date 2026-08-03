"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { RealtimeProvider } from "./types";
import { DEFAULT_REALTIME_INTERVAL_MS } from "./types";
import { PollingRealtimeProvider } from "./providers/polling";

const RealtimeContext = createContext<RealtimeProvider | null>(null);

export interface RealtimeProviderRootProps {
  provider?: RealtimeProvider;
  children: ReactNode;
}

/**
 * Puts a RealtimeProvider on context so `useRealtimeQuery` can report which
 * transport is active (useful for a "live" vs "polling" indicator in the
 * UI). Defaults to the polling provider — swap the `provider` prop for a
 * Supabase-Realtime-backed one later without touching any call sites.
 */
export function RealtimeProviderRoot({ provider, children }: RealtimeProviderRootProps) {
  const value = useMemo(() => provider ?? new PollingRealtimeProvider(), [provider]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeProvider(): RealtimeProvider {
  const ctx = useContext(RealtimeContext);
  return ctx ?? DEFAULT_PROVIDER;
}

// Fallback so `useRealtimeQuery` works even if a screen is rendered without
// <RealtimeProviderRoot> mounted (e.g. isolated component tests).
const DEFAULT_PROVIDER = new PollingRealtimeProvider();

export interface UseRealtimeQueryOptions<T> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  /** Refetch cadence in milliseconds. Defaults to 5s. */
  intervalMs?: number;
  enabled?: boolean;
}

// UseQueryResult<T> is a discriminated union (its shape varies by status),
// so this is a mapped intersection rather than `extends` (which requires a
// plain object type).
export type UseRealtimeQueryResult<T> = UseQueryResult<T> & {
  /** Which transport is delivering updates, e.g. "polling". */
  transport: string;
};

/**
 * The hook module consumers actually use. Today this is a thin wrapper
 * around TanStack Query's `refetchInterval` (the "polling" transport). When
 * a push-based provider (Supabase Realtime) is introduced, this hook is the
 * only place that needs to branch on `provider.transport` — screens that
 * call `useRealtimeQuery` do not change.
 */
export function useRealtimeQuery<T>({
  queryKey,
  queryFn,
  intervalMs = DEFAULT_REALTIME_INTERVAL_MS,
  enabled = true,
}: UseRealtimeQueryOptions<T>): UseRealtimeQueryResult<T> {
  const provider = useRealtimeProvider();

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval: provider.transport === "polling" ? intervalMs : false,
    refetchIntervalInBackground: false,
  });

  return { ...query, transport: provider.transport };
}

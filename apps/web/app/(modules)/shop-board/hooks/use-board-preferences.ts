"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Client-only state for the shop board: the room a TV is pointed at, the
 * language it shows, and its wall clock.
 *
 * All three read from sources that live outside React (localStorage, the
 * URL, the system clock), so they go through `useSyncExternalStore` rather
 * than a mount effect that calls setState. Besides satisfying the compiler's
 * no-setState-in-effect rule, it removes the extra render pass each of those
 * effects used to cause on every board — which matters on a device that
 * repaints all day.
 */

const listeners = new Set<() => void>();

/** Notifies same-tab subscribers; `storage` only fires for other tabs. */
function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribeToStorage(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Reads a localStorage value, falling back when absent or unrecognised. */
export function useStoredPreference<T extends string>(
  storageKey: string,
  isValid: (value: string) => value is T,
  fallback: T,
): readonly [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(storageKey),
    () => null, // server render: nothing stored yet
  );

  const set = useCallback(
    (next: T) => {
      window.localStorage.setItem(storageKey, next);
      emit();
    },
    [storageKey],
  );

  return [raw !== null && isValid(raw) ? raw : fallback, set] as const;
}

/**
 * Which room this screen shows.
 *
 * `?department=` is how a TV is deployed, so it decides the room on load.
 * But the dropdown has to win once someone actually uses it — otherwise the
 * URL would silently snap the selection back, which is exactly the bug the
 * e2e test caught. Choosing a room therefore rewrites the query string
 * (via replaceState, so no navigation and no history entry) and the choice
 * is persisted for the next boot.
 */
export function useDepartmentSelection(
  storageKey: string,
): readonly [string | null, (next: string) => void] {
  const selected = useSyncExternalStore(
    subscribeToStorage,
    () =>
      new URLSearchParams(window.location.search).get("department") ??
      window.localStorage.getItem(storageKey),
    () => null,
  );

  const choose = useCallback(
    (next: string) => {
      window.localStorage.setItem(storageKey, next);
      const url = new URL(window.location.href);
      url.searchParams.set("department", next);
      window.history.replaceState(null, "", url);
      emit();
    },
    [storageKey],
  );

  return [selected, choose] as const;
}

const CLOCK_INTERVAL_MS = 30_000;

function subscribeToClock(onChange: () => void): () => void {
  const timer = setInterval(onChange, CLOCK_INTERVAL_MS);
  return () => clearInterval(timer);
}

/**
 * Wall clock, bucketed to the tick interval so the snapshot is a stable
 * primitive — returning `Date.now()` directly would change on every read
 * and re-render forever. Precision is a whole interval, which is ample for
 * an HH:MM display.
 */
export function useWallClock(): Date | null {
  const bucket = useSyncExternalStore(
    subscribeToClock,
    () => Math.floor(Date.now() / CLOCK_INTERVAL_MS),
    () => null,
  );
  return bucket === null ? null : new Date(bucket * CLOCK_INTERVAL_MS);
}

/**
 * Abstraction over "how do we get live updates for a channel of data."
 * The `polling` provider (TanStack Query `refetchInterval`) is the only
 * implementation today. A future `supabase` provider backed by Supabase
 * Realtime (Postgres logical replication over WebSockets) is meant to be a
 * drop-in swap — consumers only ever depend on this interface, never on
 * `setInterval`/`refetchInterval` directly. See docs/TECH_STACK.md.
 */
export interface RealtimeSubscribeOptions<T> {
  /** Stable cache/channel key, e.g. ["department-status"] or ["shop-board", boardId]. */
  channel: readonly unknown[];
  /** Pull the current snapshot for this channel. */
  fetch: () => Promise<T>;
  /** Called with each new snapshot (including the first). */
  onData: (data: T) => void;
  /** Called if a fetch fails. Subscription keeps retrying. */
  onError?: (error: unknown) => void;
  /**
   * Suggested refresh interval in milliseconds. Providers may treat this as
   * a hint (e.g. a push-based provider might ignore it once connected).
   */
  intervalMs?: number;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface RealtimeProvider {
  /** Subscribe to a channel; returns a handle to stop receiving updates. */
  subscribe<T>(options: RealtimeSubscribeOptions<T>): RealtimeSubscription;
  /** Human-readable identifier for the active transport, e.g. "polling" | "supabase". */
  readonly transport: string;
}

export const DEFAULT_REALTIME_INTERVAL_MS = 5000;

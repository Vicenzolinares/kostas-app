import type {
  RealtimeProvider,
  RealtimeSubscribeOptions,
  RealtimeSubscription,
} from "../types";
import { DEFAULT_REALTIME_INTERVAL_MS } from "../types";

/**
 * Plain (non-React) polling implementation: a `setInterval` loop that
 * re-fetches and pushes results to `onData`. Used outside of React (or as
 * the primitive the `useRealtimeQuery` hook wraps with TanStack Query's own
 * `refetchInterval`, which supersedes this once inside a component).
 */
export class PollingRealtimeProvider implements RealtimeProvider {
  readonly transport = "polling";

  subscribe<T>({
    fetch,
    onData,
    onError,
    intervalMs = DEFAULT_REALTIME_INTERVAL_MS,
  }: RealtimeSubscribeOptions<T>): RealtimeSubscription {
    let cancelled = false;

    const tick = async () => {
      try {
        const data = await fetch();
        if (!cancelled) onData(data);
      } catch (error) {
        if (!cancelled) onError?.(error);
      }
    };

    void tick();
    const handle = setInterval(() => void tick(), intervalMs);

    return {
      unsubscribe: () => {
        cancelled = true;
        clearInterval(handle);
      },
    };
  }
}

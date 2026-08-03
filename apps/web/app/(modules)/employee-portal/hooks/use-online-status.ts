"use client";

import { useEffect, useState } from "react";

/** Tracks navigator.onLine, updated via the browser's online/offline events. */
export function useOnlineStatus(): boolean {
  // Lazy initializer (not a setState call inside the effect) so this never
  // triggers the extra render an effect-driven setState would — the value
  // is correct from the very first client render onward. Defaults to
  // `true` during SSR/hydration since `navigator` isn't defined there.
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

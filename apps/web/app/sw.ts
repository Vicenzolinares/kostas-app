/// <reference lib="webworker" />
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Precache manifest is injected at the `self.__SW_MANIFEST` placeholder by
// the esbuild-based Route Handler in app/serwist/[path]/route.ts — not a
// webpack plugin, which is what makes this Turbopack-compatible (see
// next.config.ts for why @serwist/next's `withSerwist` doesn't work here).
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

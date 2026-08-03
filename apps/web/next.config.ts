import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSerwist } from "@serwist/turbopack";

// next.config.ts is loaded as ESM here, so `__dirname` isn't available —
// derive it from import.meta.url instead.
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Cache Components (stable PPR model) replaces the old `revalidate` /
  // `unstable_cache` patterns. Data/UI opt in explicitly via `'use cache'`.
  // See docs/TECH_STACK.md for how this app uses it (sparingly — most
  // pages here are per-user dynamic data and stay outside the cache).
  cacheComponents: true,
  turbopack: {
    // Monorepo root (two levels up from apps/web) so Turbopack resolves
    // the workspace lockfile correctly instead of inferring apps/web (or
    // worse, apps/) as the root.
    root: path.join(currentDir, "..", ".."),
    // react-pdf's dependency pdfjs-dist optionally resolves `canvas` (a
    // native Node module, irrelevant in the browser). Webpack builds alias
    // it away via `config.resolve.alias`; Turbopack's equivalent is this
    // resolveAlias — see react-pdf's README "Next.js" section.
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
};

// `@serwist/next`'s `withSerwist` is webpack-only (it registers a webpack
// plugin) and is incompatible with Turbopack, which this app requires. For
// module 15 (Employee Portal PWA) we use `@serwist/turbopack` instead: the
// service worker is built by a Route Handler
// (app/serwist/[path]/route.ts) via esbuild rather than a bundler plugin,
// so `withSerwist` here only needs to mark `esbuild`/`esbuild-wasm` as
// server-external packages.
export default withSerwist(nextConfig);

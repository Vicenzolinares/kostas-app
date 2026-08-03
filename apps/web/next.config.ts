import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Cache Components (stable PPR model) replaces the old `revalidate` /
  // `unstable_cache` patterns. Data/UI opt in explicitly via `'use cache'`.
  // See docs/TECH_STACK.md for how this app uses it (sparingly — most
  // pages here are per-user dynamic data and stay outside the cache).
  cacheComponents: true,
  turbopack: {
    // Monorepo root so Turbopack resolves the workspace lockfile correctly
    // instead of inferring apps/web as the root.
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;

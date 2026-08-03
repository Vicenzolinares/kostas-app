import { createSerwistRoute } from "@serwist/turbopack";
import path from "node:path";

// Builds and serves the module 15 (Employee Portal) service worker + its
// precache manifest via esbuild at request time, instead of a webpack
// plugin — see next.config.ts and app/sw.ts for why (Turbopack has no
// webpack-plugin hook yet). Deterministic output file names are required
// here: generateStaticParams and every GET share one in-memory build.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: path.join(process.cwd(), "app/sw.ts"),
    globDirectory: path.join(process.cwd(), ".next"),
    useNativeEsbuild: true,
  });

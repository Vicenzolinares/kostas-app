import type { MetadataRoute } from "next";

// Next's built-in manifest file convention — resolves to
// /manifest.webmanifest automatically. Module 15 (Employee Portal) is the
// only part of this app meant to be "installed" as a PWA (shop-floor
// phones/tablets), so the manifest points its start_url there.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kostas ERP — Employee Portal",
    short_name: "Kostas Employee",
    description: "Clock in/out and log task updates from the shop floor.",
    start_url: "/employee-portal",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [{ src: "/next.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

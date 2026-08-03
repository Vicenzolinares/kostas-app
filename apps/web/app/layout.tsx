import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SerwistProvider } from "@serwist/turbopack/react";
import { Providers } from "./providers";
import "./globals.css";

// Using the `geist` package (font files bundled locally) instead of
// next/font/google's Geist export: the latter fetches from
// fonts.googleapis.com at build time, which fails in offline/air-gapped
// environments (this sandbox included) and adds an avoidable external
// dependency to production builds.

export const metadata: Metadata = {
  title: "Kostas ERP",
  description: "Upholstery & furniture manufacturing ERP",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        {/* Only module 15 (Employee Portal) needs offline support, but the
            service worker registration is cheap and app-shell-wide is the
            simplest place for it — see app/sw.ts for the actual caching
            strategy (network-only outside production, so this is a no-op
            in local dev). */}
        <SerwistProvider swUrl="/serwist/sw.js">
          <Providers>{children}</Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}

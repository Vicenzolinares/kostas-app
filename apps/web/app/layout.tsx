import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

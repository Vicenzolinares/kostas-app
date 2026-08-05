"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tab link for the portal header. Client-side because it reads the current
 * pathname to mark the active tab; the layout wraps it in Suspense since
 * `usePathname` is a runtime API under Cache Components.
 */
export function PortalNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Exact match: /portal must not stay active while on /portal/approvals.
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

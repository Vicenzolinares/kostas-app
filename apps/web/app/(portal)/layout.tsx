import { Suspense } from "react";
import Link from "next/link";
import { authProvider } from "@/lib/auth";
import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@kostas/ui";
import { PortalNavLink } from "@/app/(modules)/designer-portal/components/portal-nav-link";

/**
 * Chrome for the external Designer Portal.
 *
 * Deliberately its own route group, not a variant of `(app)`: an outside
 * design firm must never see the office shell — the sidebar there lists
 * finance, emails, inventory and every other internal module. Keeping the
 * two layouts separate means a portal page cannot accidentally inherit
 * office navigation, and the "Designer Portal" label makes it obvious to
 * the person looking at it which side of the wall they're on.
 *
 * Access is enforced in proxy.ts, not here.
 */

async function PortalIdentity() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const initials = session.user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Need Help?
      </span>
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-medium sm:inline">
          {session.user.name}
        </span>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/portal" className="leading-none">
              <p className="text-lg font-bold tracking-[0.2em]">KOSTAS</p>
              <p className="text-[9px] tracking-[0.3em] text-muted-foreground">
                UPHOLSTERY
              </p>
            </Link>
            <span className="border-l border-border pl-4 text-lg font-semibold">
              Designer Portal
            </span>
          </div>
          <Suspense fallback={<div className="h-8 w-32" />}>
            <PortalIdentity />
          </Suspense>
        </div>

        <nav
          className="mx-auto flex max-w-7xl gap-6 px-6"
          aria-label="Designer portal"
        >
          <PortalNavLink href="/portal">My Projects</PortalNavLink>
          <PortalNavLink href="/portal/approvals">My Approvals</PortalNavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {children}
      </main>
    </div>
  );
}

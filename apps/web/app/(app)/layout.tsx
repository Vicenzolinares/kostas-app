import { Suspense } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { NavLink } from "@/components/nav-link";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-4 md:flex md:flex-col md:gap-1">
        <div className="mb-4 px-2">
          <p className="text-lg font-semibold">Kostas ERP</p>
        </div>
        {/* NavLink reads the current pathname (a runtime API) to
            highlight the active route, so it must render inside
            Suspense under Cache Components. */}
        <Suspense
          fallback={NAV_ITEMS.map((item) => (
            <span
              key={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
            >
              {item.label}
            </span>
          ))}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </Suspense>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <p className="text-sm text-muted-foreground md:hidden">Kostas ERP</p>
          <div className="ml-auto">
            <Suspense fallback={<div className="h-8 w-24" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

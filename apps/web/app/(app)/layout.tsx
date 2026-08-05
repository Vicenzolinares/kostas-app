import { Suspense } from "react";
import { SidebarNav, SidebarNavFallback } from "@/components/sidebar-nav";
import { SidebarPanels } from "@/components/sidebar-panels";
import { AppHeader } from "@/components/app-header";
import { KostasLogo, KostasMonogram } from "@/components/kostas-logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-card p-4 md:flex">
        <div className="mb-5 px-2">
          <KostasLogo />
        </div>
        {/* Two runtime reads live in here — NavLink's pathname and the
            session the link list is filtered by — so it must render inside
            Suspense under Cache Components. */}
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNav />
        </Suspense>
        {/* Mailbox status + Quick Create, as the deck pins them below the
            nav. Its own boundary so the session/mailbox reads it does can't
            delay the nav links above it. */}
        <Suspense fallback={null}>
          <SidebarPanels />
        </Suspense>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-6">
          <KostasMonogram className="h-7 w-7 text-foreground md:hidden" />
          <Suspense fallback={<div className="h-8 flex-1" />}>
            <AppHeader />
          </Suspense>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

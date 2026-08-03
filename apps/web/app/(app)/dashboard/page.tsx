import { Suspense } from "react";
import {
  getDashboardKpis,
  getProjectsByStatus,
  getDashboardLayout,
} from "@/app/(modules)/dashboard/api/queries";
import { KpiCards } from "@/app/(modules)/dashboard/components/kpi-cards";
import { ProjectsByStatusChart } from "@/app/(modules)/dashboard/components/projects-by-status-chart";
import {
  DashboardGrid,
  type DashboardWidgetDef,
} from "@/app/(modules)/dashboard/components/dashboard-grid";
import { authProvider } from "@/lib/auth";

async function DashboardSection() {
  const session = await authProvider.getSession();
  const [kpis, statusBreakdown, layout] = await Promise.all([
    getDashboardKpis(),
    getProjectsByStatus(),
    session ? getDashboardLayout(session.user.id) : Promise.resolve(null),
  ]);

  const widgets: DashboardWidgetDef[] = [
    {
      id: "kpis",
      title: "Key metrics",
      defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
      content: <KpiCards {...kpis} />,
    },
    {
      id: "projects-by-status",
      title: "Projects by status",
      defaultLayout: { x: 0, y: 2, w: 6, h: 4 },
      content: <ProjectsByStatusChart data={statusBreakdown} />,
    },
  ];

  return <DashboardGrid widgets={widgets} initialLayout={layout} />;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Drag and resize widgets to customize your layout — it&apos;s saved per
          user.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        }
      >
        <DashboardSection />
      </Suspense>
    </div>
  );
}

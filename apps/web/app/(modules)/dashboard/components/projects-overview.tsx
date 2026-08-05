import Link from "next/link";
import { Panel, PanelEmpty } from "./panel";
import { ProjectStatusPill } from "./status-pill";
import type { ProjectOverviewRow } from "../api/queries";

const dateLabel = (date: Date | null) =>
  date
    ? date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

/** Row 2, left column of the deck: the wide Projects Overview table. */
export function ProjectsOverview({ rows }: { rows: ProjectOverviewRow[] }) {
  return (
    <Panel
      title="Projects Overview"
      action={{ label: "View All Projects", href: "/projects" }}
      data-testid="dashboard-projects-overview"
    >
      {rows.length === 0 ? (
        <PanelEmpty>No active projects.</PanelEmpty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                <th className="rounded-l-md px-3 py-2 text-left font-medium">
                  Project
                </th>
                <th className="px-3 py-2 text-left font-medium">Client</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Work Orders</th>
                <th className="rounded-r-md px-3 py-2 text-left font-medium">
                  Install Date
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/projects/${row.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.clientName}
                  </td>
                  <td className="px-3 py-2.5">
                    <ProjectStatusPill status={row.status} />
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                    {row.workOrdersDone} / {row.workOrdersTotal}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {dateLabel(row.installDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

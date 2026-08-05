import { Suspense } from "react";
import { authProvider } from "@/lib/auth";
import {
  listPortalProjects,
  listPortalUpdates,
} from "@/app/(modules)/designer-portal/api/portal-queries";
import { PortalProjectCard } from "@/app/(modules)/designer-portal/components/portal-project-card";

async function MyProjects() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const projects = await listPortalProjects(session.user.id);

  if (projects.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No projects have been shared with you yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <PortalProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

async function RecentUpdates() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const updates = await listPortalUpdates(session.user.id);

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold">Recent Updates</h2>
      {updates.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing recent.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {updates.map((update) => (
            <li key={update.id} className="text-sm">
              <p className="text-xs text-muted-foreground">
                {new Date(update.at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="leading-snug">{update.title}</p>
              <p className="text-xs text-muted-foreground">
                {update.projectName}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PortalProjectsPage() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold">My Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Projects Kostas Upholstery has shared with you for review.
        </p>
        <div className="mt-5">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Loading projects…</p>
            }
          >
            <MyProjects />
          </Suspense>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-80">
        <Suspense fallback={<div className="h-40" />}>
          <RecentUpdates />
        </Suspense>
      </aside>
    </div>
  );
}

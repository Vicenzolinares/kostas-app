import { Suspense } from "react";
import { authProvider } from "@/lib/auth";
import { listPortalApprovals } from "@/app/(modules)/designer-portal/api/portal-queries";
import { PortalProjectCard } from "@/app/(modules)/designer-portal/components/portal-project-card";

async function MyApprovals() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const approvals = await listPortalApprovals(session.user.id);

  if (approvals.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nothing is waiting on you right now.
      </p>
    );
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="approvals-grid"
    >
      {approvals.map((project) => (
        <PortalProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

export default function PortalApprovalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">My Approvals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Waiting on your decision before production can continue.
      </p>
      <div className="mt-5">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading approvals…</p>
          }
        >
          <MyApprovals />
        </Suspense>
      </div>
    </div>
  );
}

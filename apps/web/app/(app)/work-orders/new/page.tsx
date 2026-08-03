import { Suspense } from "react";
import { WizardShell } from "@/app/(modules)/work-orders/components/wizard-shell";
import {
  listProjectOptions,
  listFabricOptions,
  listAssigneeOptions,
} from "@/app/(modules)/work-orders/api/options";

async function WizardSection() {
  const [projects, fabrics, assignees] = await Promise.all([
    listProjectOptions(),
    listFabricOptions(),
    listAssigneeOptions(),
  ]);
  return <WizardShell projects={projects} fabrics={fabrics} assignees={assignees} />;
}

export default function NewWorkOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New work order</h1>
        <p className="text-sm text-muted-foreground">
          Walk through the steps to generate a new work order for production.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <WizardSection />
      </Suspense>
    </div>
  );
}

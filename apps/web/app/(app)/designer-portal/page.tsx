import { Suspense } from "react";
import { listDesignSubmissions } from "@/app/(modules)/designer-portal/api/queries";
import { SubmissionsTable } from "@/app/(modules)/designer-portal/components/submissions-table";

async function SubmissionsTableSection() {
  const submissions = await listDesignSubmissions();
  return <SubmissionsTable submissions={submissions} />;
}

export default function DesignerPortalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Designer Portal</h1>
        <p className="text-sm text-muted-foreground">
          Design submissions and the approval workflow.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading submissions…</p>
        }
      >
        <SubmissionsTableSection />
      </Suspense>
    </div>
  );
}

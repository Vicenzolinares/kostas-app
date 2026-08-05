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
        <h1 className="text-2xl font-semibold">
          Client &amp; Designer Projects
        </h1>
        <p className="text-sm text-muted-foreground">
          Office view of every design submission and where it sits in the
          approval workflow. External designers see only their own work, in the{" "}
          <span className="font-medium">Designer Portal</span>.
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

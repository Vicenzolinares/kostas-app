import { Suspense } from "react";
import {
  listMeasurements,
  listProjectsForSelect,
} from "@/app/(modules)/client-measurements/api/queries";
import { MeasurementsList } from "@/app/(modules)/client-measurements/components/measurements-list";
import { MeasurementFormDialog } from "@/app/(modules)/client-measurements/components/measurement-form-dialog";

async function MeasurementsSection({ projectId }: { projectId?: string }) {
  const [measurements, projects] = await Promise.all([
    listMeasurements(projectId),
    listProjectsForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <MeasurementFormDialog
          projects={projects}
          defaultProjectId={projectId}
        />
      </div>
      <MeasurementsList measurements={measurements} />
    </div>
  );
}

export default async function ClientMeasurementsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Client Measurements</h1>
        <p className="text-sm text-muted-foreground">
          Sketch furniture dimensions and attach reference photos per project.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading measurements…</p>
        }
      >
        <MeasurementsSection projectId={projectId} />
      </Suspense>
    </div>
  );
}

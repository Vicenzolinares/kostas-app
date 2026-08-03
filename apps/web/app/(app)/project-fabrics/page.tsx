import { Suspense } from "react";
import {
  listProjectFabrics,
  listProjectAndFabricOptions,
} from "@/app/(modules)/project-fabrics/api/queries";
import { ProjectFabricsGrid } from "@/app/(modules)/project-fabrics/components/project-fabrics-grid";
import { ProjectFabricFormDialog } from "@/app/(modules)/project-fabrics/components/project-fabric-form-dialog";
import { ProjectFabricStatusPipeline } from "@/app/(modules)/project-fabrics/components/status-pipeline";

async function ProjectFabricsSection() {
  const [rows, { projectOptions, fabricOptions }] = await Promise.all([
    listProjectFabrics(),
    listProjectAndFabricOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ProjectFabricFormDialog
          projectOptions={projectOptions}
          fabricOptions={fabricOptions}
        />
      </div>
      <ProjectFabricsGrid rows={rows} />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Pipeline overview</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No fabrics linked to projects yet.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{row.project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.fabric.name} · {row.yardsRequired} yd
                </p>
              </div>
              <ProjectFabricStatusPipeline status={row.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ProjectFabricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Project Fabrics</h1>
        <p className="text-sm text-muted-foreground">
          Link fabrics to projects and track them through the cutting pipeline.
        </p>
      </div>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <ProjectFabricsSection />
      </Suspense>
    </div>
  );
}

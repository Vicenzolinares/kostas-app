import { Suspense } from "react";
import { listProjects } from "@/app/(modules)/projects/api/queries";
import { ProjectsTable } from "@/app/(modules)/projects/components/projects-table";

async function ProjectsTableSection() {
  const projects = await listProjects();
  return <ProjectsTable projects={projects} />;
}

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Track leads through to completed installs.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading projects…</p>}>
        <ProjectsTableSection />
      </Suspense>
    </div>
  );
}

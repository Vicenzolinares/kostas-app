import { Suspense } from "react";
import { listProjectsForView } from "@/app/(modules)/project-view/api/queries";
import { ProjectPicker } from "@/app/(modules)/project-view/components/project-picker";

async function ProjectPickerSection() {
  const projects = await listProjectsForView();
  return <ProjectPicker projects={projects} />;
}

export default function ProjectViewIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Project View</h1>
        <p className="text-sm text-muted-foreground">
          Adaptive project view — accordion on desktop, swipeable cards on mobile.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading projects…</p>}>
        <ProjectPickerSection />
      </Suspense>
    </div>
  );
}

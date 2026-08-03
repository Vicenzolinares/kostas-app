import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProjectViewData } from "@/app/(modules)/project-view/api/queries";
import { AdaptiveProjectView } from "@/app/(modules)/project-view/components/adaptive-project-view";

async function ProjectViewSection({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectViewData(id);
  if (!project) notFound();
  return <AdaptiveProjectView project={project} />;
}

export default function ProjectViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading project…</p>
      }
    >
      <ProjectViewSection params={params} />
    </Suspense>
  );
}

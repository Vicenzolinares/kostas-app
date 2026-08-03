import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProjectViewData } from "@/app/(modules)/project-view/api/queries";
import { AdaptiveProjectView } from "@/app/(modules)/project-view/components/adaptive-project-view";

async function ProjectViewSection({ id }: { id: string }) {
  const project = await getProjectViewData(id);
  if (!project) notFound();
  return <AdaptiveProjectView project={project} />;
}

export default async function ProjectViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading project…</p>}>
      <ProjectViewSection id={id} />
    </Suspense>
  );
}

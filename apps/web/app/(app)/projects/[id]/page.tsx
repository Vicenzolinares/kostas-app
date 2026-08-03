import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kostas/ui";
import { getProjectById } from "@/app/(modules)/projects/api/queries";
import { ProjectStatusTimeline } from "@/app/(modules)/projects/components/status-timeline";
import { ProjectFormDialog } from "@/app/(modules)/projects/components/project-form-dialog";

async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.clientName}</p>
        </div>
        <ProjectFormDialog
          project={project}
          trigger={<Button variant="outline">Edit</Button>}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectStatusTimeline status={project.status} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Client measurements ({project.clientMeasurements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {project.clientMeasurements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No measurements recorded yet.
              </p>
            ) : (
              project.clientMeasurements.map((m) => (
                <p key={m.id} className="text-sm">
                  {m.furniturePiece}
                </p>
              ))
            )}
            <Link
              href={`/client-measurements?projectId=${project.id}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Manage measurements →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Project fabrics ({project.projectFabrics.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {project.projectFabrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fabrics linked yet.
              </p>
            ) : (
              project.projectFabrics.map((pf) => (
                <p key={pf.id} className="text-sm">
                  {pf.fabric.name} — {pf.yardsRequired} yd ({pf.status})
                </p>
              ))
            )}
            <Link
              href={`/project-fabrics?projectId=${project.id}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Manage fabrics →
            </Link>
          </CardContent>
        </Card>
      </div>

      {project.description ? (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function ProjectDetailPage({
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
      <ProjectDetail params={params} />
    </Suspense>
  );
}

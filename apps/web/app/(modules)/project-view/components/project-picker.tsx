import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { ProjectStatusBadge } from "@/app/(modules)/projects/components/status-badge";
import type { Project } from "@kostas/database/schema";

export function ProjectPicker({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/project-view/${project.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {project.name}
                <ProjectStatusBadge status={project.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{project.clientName}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

import { ProjectStatusBadge } from "@/app/(modules)/projects/components/status-badge";
import type { ProjectViewData } from "../types";

/**
 * Section definitions shared by both the desktop accordion and mobile card
 * slider — same data, two presentations chosen by CSS breakpoint (not JS
 * device detection, so there's no SSR/client render mismatch).
 */
export const PROJECT_VIEW_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    render: (project: ProjectViewData) => (
      <div className="flex flex-col gap-2">
        <p>
          <span className="font-medium">Client:</span> {project.clientName}
        </p>
        <p className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <ProjectStatusBadge status={project.status} />
        </p>
        {project.dueDate ? (
          <p>
            <span className="font-medium">Due:</span>{" "}
            {new Date(project.dueDate).toLocaleDateString()}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "measurements",
    title: "Client Measurements",
    render: (project: ProjectViewData) =>
      project.clientMeasurements.length === 0 ? (
        <p className="text-muted-foreground">No measurements recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {project.clientMeasurements.map((m) => (
            <li key={m.id}>{m.furniturePiece}</li>
          ))}
        </ul>
      ),
  },
  {
    id: "fabrics",
    title: "Fabrics",
    render: (project: ProjectViewData) =>
      project.projectFabrics.length === 0 ? (
        <p className="text-muted-foreground">No fabrics linked yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {project.projectFabrics.map((pf) => (
            <li key={pf.id}>
              {pf.fabric.name} — {pf.yardsRequired} yd ({pf.status})
            </li>
          ))}
        </ul>
      ),
  },
  {
    id: "description",
    title: "Description",
    render: (project: ProjectViewData) => (
      <p className="whitespace-pre-wrap">{project.description || "No description."}</p>
    ),
  },
];

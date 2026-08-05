import Image from "next/image";
import Link from "next/link";
import type { DesignSubmissionStatus } from "@kostas/shared/schemas";
import type { PortalProject } from "../api/portal-queries";

/**
 * Status wording from the designer's point of view.
 *
 * The office calls the review state `designer_review`; to the designer it
 * reads as "Awaiting Your Approval", which is the only state where they're
 * actually the blocker. Same rows, same enum — this only changes the label,
 * so nothing here can drift from the workflow the machine enforces.
 */
const PORTAL_STATUS: Record<
  DesignSubmissionStatus,
  { label: string; tone: string }
> = {
  draft: { label: "In Design", tone: "bg-violet-100 text-violet-700" },
  submitted: { label: "Submitted", tone: "bg-sky-100 text-sky-700" },
  designer_review: {
    label: "Awaiting Your Approval",
    tone: "bg-amber-100 text-amber-800",
  },
  changes_requested: {
    label: "Changes Requested",
    tone: "bg-red-100 text-red-700",
  },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-700" },
  production: { label: "In Production", tone: "bg-sky-100 text-sky-700" },
  completed: { label: "Completed", tone: "bg-slate-100 text-slate-600" },
};

export function PortalStatusBadge({
  status,
}: {
  status: DesignSubmissionStatus;
}) {
  const { label, tone } = PORTAL_STATUS[status];
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

export function PortalProjectCard({ project }: { project: PortalProject }) {
  // fileKeys doubles as the card's preview; a submission can legitimately
  // have none yet (a fresh draft), so fall back to a neutral panel.
  const preview = project.fileKeys[0];

  return (
    <Link
      href={`/portal/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-md"
      data-testid="portal-project-card"
    >
      <div className="relative aspect-[4/3] w-full bg-muted">
        {preview ? (
          <Image
            src={`/api/storage/${preview}`}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No preview yet
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-semibold leading-tight group-hover:text-indigo-600">
            {project.projectName}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {project.title}
          </p>
        </div>

        <PortalStatusBadge status={project.status} />

        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="text-muted-foreground">
            {project.dueDate
              ? `Due: ${new Date(project.dueDate).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}`
              : "No due date"}
          </span>
          <span className="font-medium text-indigo-600">View Project →</span>
        </div>
      </div>
    </Link>
  );
}

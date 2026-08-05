import type { ProjectStatus, WorkOrderStatus } from "@kostas/shared/schemas";

/**
 * The deck draws every status as a soft tinted pill (pale blue for work in
 * production, amber while something is waiting on materials, grey for a
 * quote). The shared `Badge` variants are solid fills, which read far
 * heavier at this density, so the dashboard uses its own pill rather than
 * restyling a component three other modules render.
 */
const PROJECT_PILL: Record<ProjectStatus, { label: string; tone: Tone }> = {
  lead: { label: "Lead", tone: "grey" },
  quoted: { label: "Estimate", tone: "grey" },
  approved: { label: "Approved", tone: "violet" },
  in_progress: { label: "In Production", tone: "blue" },
  quality_check: { label: "Quality Check", tone: "violet" },
  ready_for_delivery: { label: "Ready to Install", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

const WORK_ORDER_PILL: Record<WorkOrderStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "grey" },
  pending_approval: { label: "Pending Approval", tone: "amber" },
  approved: { label: "Approved", tone: "violet" },
  in_production: { label: "In Progress", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

type Tone = "grey" | "blue" | "amber" | "violet" | "green" | "red";

const TONES: Record<Tone, string> = {
  grey: "bg-muted text-muted-foreground",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  violet: "bg-accent text-accent-foreground",
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[0.7rem] font-medium ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  return <Pill {...PROJECT_PILL[status]} />;
}

export function WorkOrderStatusPill({ status }: { status: WorkOrderStatus }) {
  return <Pill {...WORK_ORDER_PILL[status]} />;
}

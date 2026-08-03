import { Badge } from "@kostas/ui";
import type { ProjectStatus } from "@kostas/shared/schemas";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  lead: "Lead",
  quoted: "Quoted",
  approved: "Approved",
  in_progress: "In Progress",
  quality_check: "Quality Check",
  ready_for_delivery: "Ready for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "destructive" | "outline"> = {
  lead: "outline",
  quoted: "secondary",
  approved: "secondary",
  in_progress: "default",
  quality_check: "default",
  ready_for_delivery: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const PROJECT_STATUS_LABEL = STATUS_LABEL;

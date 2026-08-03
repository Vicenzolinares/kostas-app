import { Badge } from "@kostas/ui";
import type { WorkOrderStatus, WorkOrderType } from "@kostas/shared/schemas";

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_production: "In Production",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<WorkOrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_approval: "secondary",
  approved: "secondary",
  in_production: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const WORK_ORDER_STATUS_LABEL = STATUS_LABEL;

export const WORK_ORDER_TYPE_LABEL: Record<WorkOrderType, string> = {
  reupholstery: "Reupholstery",
  custom_build: "Custom Build",
  repair: "Repair",
  cushion_only: "Cushion Only",
  frame_only: "Frame Only",
};

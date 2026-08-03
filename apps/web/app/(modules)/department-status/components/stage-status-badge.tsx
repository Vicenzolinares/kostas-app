import { Badge } from "@kostas/ui";
import type { ProductionStageStatus } from "@kostas/shared/schemas";

const STATUS_LABEL: Record<ProductionStageStatus, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_VARIANT: Record<ProductionStageStatus, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "outline",
  in_progress: "default",
  blocked: "destructive",
  done: "secondary",
};

export function StageStatusBadge({ status }: { status: ProductionStageStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const STAGE_STATUS_LABEL = STATUS_LABEL;

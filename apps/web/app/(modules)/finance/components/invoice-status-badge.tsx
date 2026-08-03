import { Badge } from "@kostas/ui";
import type { InvoiceStatus } from "@kostas/shared/schemas";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
  void: "Void",
};

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  paid: "default",
  partially_paid: "secondary",
  overdue: "destructive",
  void: "destructive",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const INVOICE_STATUS_LABEL = STATUS_LABEL;

import type { WorkOrder, WorkOrderFabric } from "@kostas/database/schema";

export type { WorkOrder, WorkOrderFabric };

export interface WorkOrderListItem extends WorkOrder {
  project: { id: string; name: string; clientName: string } | null;
  assignedTo: { id: string; name: string } | null;
}

export interface WorkOrderWithRelations extends WorkOrderListItem {
  fabrics: (WorkOrderFabric & { fabric: { id: string; name: string; fabricCode: string } })[];
}

export interface ProjectOption {
  id: string;
  name: string;
  clientName: string;
}

export interface FabricOption {
  id: string;
  name: string;
  fabricCode: string;
  yardsInStock: string;
}

export interface AssigneeOption {
  id: string;
  name: string;
  role: string;
}

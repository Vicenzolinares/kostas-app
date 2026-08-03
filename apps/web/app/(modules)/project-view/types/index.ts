import type { Project, ClientMeasurement, ProjectFabric, FabricInventory } from "@kostas/database/schema";

export interface ProjectViewData extends Project {
  clientMeasurements: ClientMeasurement[];
  projectFabrics: (ProjectFabric & { fabric: FabricInventory })[];
}

export interface ProjectViewSection {
  id: string;
  title: string;
}

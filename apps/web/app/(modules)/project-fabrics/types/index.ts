import type {
  ProjectFabric,
  Project,
  FabricInventory,
} from "@kostas/database/schema";

export interface ProjectFabricWithRelations extends ProjectFabric {
  project: Project;
  fabric: FabricInventory;
}

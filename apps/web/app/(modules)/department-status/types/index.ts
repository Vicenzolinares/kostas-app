import type { Department, ProductionStage } from "@kostas/database/schema";

export type { Department, ProductionStage };

export interface DepartmentSnapshot {
  department: Department;
  stages: (ProductionStage & { projectName: string; clientName: string })[];
  counts: {
    queued: number;
    in_progress: number;
    blocked: number;
    done: number;
  };
  utilizationPct: number;
}

export interface DepartmentStatusBoard {
  departments: DepartmentSnapshot[];
  generatedAt: string;
}

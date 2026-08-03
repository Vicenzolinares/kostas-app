import { create } from "zustand";
import type { WorkOrderType, WorkOrderSpecifications } from "@kostas/shared/schemas";

export const WIZARD_STEPS = [
  "type",
  "project",
  "specifications",
  "fabric",
  "assignments",
  "review",
] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export interface WizardFabricLine {
  fabricId: string;
  yardsAllocated: number;
  cutNotes?: string;
}

interface WorkOrderWizardState {
  stepIndex: number;
  type: WorkOrderType | null;
  projectId: string | null;
  specifications: WorkOrderSpecifications;
  fabrics: WizardFabricLine[];
  assignedToId: string | null;
  dueDate: Date | null;
  setType: (type: WorkOrderType) => void;
  setProjectId: (projectId: string) => void;
  setSpecifications: (specifications: WorkOrderSpecifications) => void;
  setFabrics: (fabrics: WizardFabricLine[]) => void;
  setAssignments: (assignedToId: string | null, dueDate: Date | null) => void;
  goToStep: (step: WizardStep) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const initialState = {
  stepIndex: 0,
  type: null as WorkOrderType | null,
  projectId: null as string | null,
  specifications: { furniturePieces: [], measurementReferenceIds: [] } as WorkOrderSpecifications,
  fabrics: [] as WizardFabricLine[],
  assignedToId: null as string | null,
  dueDate: null as Date | null,
};

export const useWorkOrderWizard = create<WorkOrderWizardState>((set, get) => ({
  ...initialState,
  setType: (type) => set({ type }),
  setProjectId: (projectId) => set({ projectId }),
  setSpecifications: (specifications) => set({ specifications }),
  setFabrics: (fabrics) => set({ fabrics }),
  setAssignments: (assignedToId, dueDate) => set({ assignedToId, dueDate }),
  goToStep: (step) => set({ stepIndex: WIZARD_STEPS.indexOf(step) }),
  next: () => set({ stepIndex: Math.min(get().stepIndex + 1, WIZARD_STEPS.length - 1) }),
  back: () => set({ stepIndex: Math.max(get().stepIndex - 1, 0) }),
  reset: () => set(initialState),
}));

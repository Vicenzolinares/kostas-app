import { create } from "zustand";
import type { ProjectStatus } from "@kostas/shared/schemas";

interface ProjectFiltersState {
  search: string;
  status: ProjectStatus | "all";
  setSearch: (search: string) => void;
  setStatus: (status: ProjectStatus | "all") => void;
  reset: () => void;
}

export const useProjectFilters = create<ProjectFiltersState>((set) => ({
  search: "",
  status: "all",
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  reset: () => set({ search: "", status: "all" }),
}));

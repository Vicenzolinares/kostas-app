import { create } from "zustand";

interface WorkOrderFiltersState {
  search: string;
  setSearch: (search: string) => void;
}

export const useWorkOrderFilters = create<WorkOrderFiltersState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),
}));

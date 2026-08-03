import { create } from "zustand";

interface HardwareFiltersState {
  search: string;
  category: string | "all";
  lowStockOnly: boolean;
  setSearch: (search: string) => void;
  setCategory: (category: string | "all") => void;
  setLowStockOnly: (value: boolean) => void;
  reset: () => void;
}

export const useHardwareFilters = create<HardwareFiltersState>((set) => ({
  search: "",
  category: "all",
  lowStockOnly: false,
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setLowStockOnly: (lowStockOnly) => set({ lowStockOnly }),
  reset: () => set({ search: "", category: "all", lowStockOnly: false }),
}));

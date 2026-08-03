import { create } from "zustand";
import type { CalendarEventType } from "@kostas/shared/schemas";

interface CalendarFiltersState {
  typeFilter: CalendarEventType | "all";
  setTypeFilter: (type: CalendarEventType | "all") => void;
}

export const useCalendarFilters = create<CalendarFiltersState>((set) => ({
  typeFilter: "all",
  setTypeFilter: (typeFilter) => set({ typeFilter }),
}));

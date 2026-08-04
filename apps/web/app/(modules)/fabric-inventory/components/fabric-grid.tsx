"use client";

import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  NumberEditorModule,
  ValidationModule,
  themeQuartz,
  type ColDef,
  type CellValueChangedEvent,
} from "ag-grid-community";
import { updateFabricStockAction } from "../api/actions";
import type { FabricInventory } from "../types";

// AG Grid Community only — Enterprise (pivot/tree-data/range-selection)
// is intentionally out of scope; see docs/TECH_STACK.md.
//
// Styling goes through v33's Theming API (the `theme` grid option below),
// NOT the v32 CSS files. Importing `styles/ag-grid.css` +
// `styles/ag-theme-quartz.css` alongside it throws "AG Grid: error #239"
// and produces broken styling, because the CSS themes and the Theming API
// both try to own the same variables. Don't re-add those imports or the
// `ag-theme-quartz` wrapper class — pass a theme object here instead.
// NumberEditorModule is required because the `yardsInStock` column below
// is `editable: true` with a numeric value — AG Grid v33's default
// number cell editor lives in its own module and must be registered
// explicitly, or editing throws "AG Grid: error #200".
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  NumberEditorModule,
  ValidationModule,
]);

interface FabricRow extends Omit<
  FabricInventory,
  "widthInches" | "costPerYard" | "yardsInStock" | "yardsReserved"
> {
  widthInches: number | null;
  costPerYard: number | null;
  yardsInStock: number;
  yardsReserved: number;
}

export function FabricGrid({ fabrics }: { fabrics: FabricInventory[] }) {
  const gridRef = useRef<AgGridReact<FabricRow>>(null);

  const rowData = useMemo<FabricRow[]>(
    () =>
      fabrics.map((fabric) => ({
        ...fabric,
        widthInches:
          fabric.widthInches != null ? Number(fabric.widthInches) : null,
        costPerYard:
          fabric.costPerYard != null ? Number(fabric.costPerYard) : null,
        yardsInStock: Number(fabric.yardsInStock),
        yardsReserved: Number(fabric.yardsReserved),
      })),
    [fabrics],
  );

  const columnDefs = useMemo<ColDef<FabricRow>[]>(
    () => [
      {
        field: "fabricCode",
        headerName: "Code",
        filter: "agTextColumnFilter",
        pinned: "left",
        width: 130,
      },
      {
        field: "name",
        headerName: "Name",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 160,
      },
      {
        field: "mill",
        headerName: "Mill",
        filter: "agTextColumnFilter",
        width: 160,
      },
      { field: "color", headerName: "Color", width: 120 },
      { field: "pattern", headerName: "Pattern", width: 120 },
      {
        field: "widthInches",
        headerName: "Width (in)",
        filter: "agNumberColumnFilter",
        width: 120,
      },
      {
        field: "costPerYard",
        headerName: "Cost/yd",
        filter: "agNumberColumnFilter",
        width: 110,
        valueFormatter: (p) =>
          p.value != null ? `$${Number(p.value).toFixed(2)}` : "—",
      },
      {
        field: "yardsInStock",
        headerName: "In stock (yd)",
        filter: "agNumberColumnFilter",
        editable: true,
        width: 130,
      },
      {
        field: "yardsReserved",
        headerName: "Reserved (yd)",
        filter: "agNumberColumnFilter",
        width: 140,
      },
      { field: "warehouseLocation", headerName: "Location", width: 120 },
    ],
    [],
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<FabricRow>) => {
      if (event.colDef.field === "yardsInStock" && event.data) {
        void updateFabricStockAction(event.data.id, event.data.yardsInStock);
      }
    },
    [],
  );

  return (
    <div className="h-[520px] w-full" data-testid="fabric-grid">
      <AgGridReact<FabricRow>
        ref={gridRef}
        theme={themeQuartz}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true }}
        onCellValueChanged={onCellValueChanged}
        animateRows
        rowBuffer={20}
      />
    </div>
  );
}

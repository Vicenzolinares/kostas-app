"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextFilterModule,
  ValidationModule,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { projectFabricStatusValues } from "@kostas/shared/schemas";
import { updateProjectFabricStatusAction } from "../api/actions";
import { PROJECT_FABRIC_STATUS_LABEL } from "./status-pipeline";
import type { ProjectFabricWithRelations } from "../types";

// Styling goes through v33's Theming API (the `theme` grid option below),
// not the v32 CSS files — see the note in fabric-inventory's fabric-grid.tsx.
// Importing `styles/ag-grid.css` here throws "AG Grid: error #239".
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  ValidationModule,
]);

interface ProjectFabricRow {
  id: string;
  projectName: string;
  fabricName: string;
  fabricCode: string;
  yardsRequired: number;
  status: string;
}

function StatusCellRenderer(params: ICellRendererParams<ProjectFabricRow>) {
  const value = params.value as string;
  return (
    <select
      className="h-7 rounded-md border border-input bg-background px-1 text-xs"
      defaultValue={value}
      onChange={(e) => {
        if (params.data)
          void updateProjectFabricStatusAction(params.data.id, e.target.value);
      }}
    >
      {projectFabricStatusValues.map((status) => (
        <option key={status} value={status}>
          {PROJECT_FABRIC_STATUS_LABEL[status]}
        </option>
      ))}
    </select>
  );
}

export function ProjectFabricsGrid({
  rows,
}: {
  rows: ProjectFabricWithRelations[];
}) {
  const rowData = useMemo<ProjectFabricRow[]>(
    () =>
      rows.map((row) => ({
        id: row.id,
        projectName: row.project.name,
        fabricName: row.fabric.name,
        fabricCode: row.fabric.fabricCode,
        yardsRequired: Number(row.yardsRequired),
        status: row.status,
      })),
    [rows],
  );

  const columnDefs = useMemo<ColDef<ProjectFabricRow>[]>(
    () => [
      {
        field: "projectName",
        headerName: "Project",
        filter: "agTextColumnFilter",
        flex: 1,
      },
      { field: "fabricCode", headerName: "Fabric code", width: 130 },
      {
        field: "fabricName",
        headerName: "Fabric",
        filter: "agTextColumnFilter",
        flex: 1,
      },
      { field: "yardsRequired", headerName: "Yards", width: 100 },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        cellRenderer: StatusCellRenderer,
      },
    ],
    [],
  );

  return (
    <div className="h-[480px] w-full" data-testid="project-fabrics-grid">
      <AgGridReact<ProjectFabricRow>
        theme={themeQuartz}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true }}
        animateRows
      />
    </div>
  );
}

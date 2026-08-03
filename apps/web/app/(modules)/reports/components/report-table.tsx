"use client";

import { useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@kostas/ui";
import type { ReportResult, ReportRow } from "../types";

export function ReportTable({ report }: { report: ReportResult }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      { accessorKey: "label", header: "Label" },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }) => row.original.value.toLocaleString(),
      },
      {
        accessorKey: "secondary",
        header: "Note",
        cell: ({ row }) => row.original.secondary ?? "",
      },
    ],
    [],
  );

  const table = useReactTable({
    data: report.rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className="font-semibold">
            <TableCell>{report.totalLabel}</TableCell>
            <TableCell>{report.total.toLocaleString()}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@kostas/ui";
import type { Transaction } from "../types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  succeeded: "default",
  failed: "destructive",
  canceled: "outline",
};

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "occurredAt",
        header: "Date",
        cell: ({ row }) => new Date(row.original.occurredAt).toLocaleDateString(),
      },
      { accessorKey: "type", header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.type}</span> },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => `$${Number(row.original.amount).toFixed(2)} ${row.original.currency.toUpperCase()}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"} className="capitalize">
            {row.original.status}
          </Badge>
        ),
      },
      { accessorKey: "description", header: "Description", cell: ({ row }) => row.original.description ?? "—" },
    ],
    [],
  );

  const table = useReactTable({ data: transactions, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-testid="transaction-row">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                No transactions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

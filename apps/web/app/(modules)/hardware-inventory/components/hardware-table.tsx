"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Input,
} from "@kostas/ui";
import { useHardwareFilters } from "../hooks/use-hardware-filters";
import { StockBadge } from "./stock-badge";
import { HardwareFormDialog } from "./hardware-form-dialog";
import { deleteHardwareAction } from "../api/actions";
import type { HardwareInventory } from "../types";

export function HardwareTable({ items }: { items: HardwareInventory[] }) {
  const { search, lowStockOnly, setSearch, setLowStockOnly } = useHardwareFilters();
  const [pending, startTransition] = useTransition();
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        item.name.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        (item.barcode ?? "").toLowerCase().includes(term);
      const matchesStock = !lowStockOnly || item.quantity <= item.reorderThreshold;
      return matchesSearch && matchesStock;
    });
  }, [items, search, lowStockOnly]);

  const columns = useMemo<ColumnDef<HardwareInventory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Item",
        cell: ({ row }) => (
          <Link href={`/hardware-inventory/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category ?? "—" },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => `${row.original.quantity} ${row.original.unit}`,
      },
      { accessorKey: "binLocation", header: "Bin", cell: ({ row }) => row.original.binLocation ?? "—" },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => <StockBadge item={row.original} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <HardwareFormDialog
              item={row.original}
              trigger={
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (confirm(`Delete "${row.original.name}"?`)) {
                    await deleteHardwareAction(row.original.id);
                  }
                })
              }
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [pending],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name, SKU, or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search hardware"
        />
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          Low stock only
        </Button>
        <div className="ml-auto flex gap-2">
          <Link href="/hardware-inventory/scan">
            <Button variant="outline">Scan</Button>
          </Link>
          <HardwareFormDialog trigger={<Button>New item</Button>} />
        </div>
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? "cursor-pointer select-none" : undefined}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-testid="hardware-row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No hardware items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

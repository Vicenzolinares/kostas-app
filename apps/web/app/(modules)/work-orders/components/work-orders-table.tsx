"use client";

import { useMemo } from "react";
import Link from "next/link";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Input } from "@kostas/ui";
import { WorkOrderStatusBadge, WORK_ORDER_TYPE_LABEL } from "./status-badge";
import { useWorkOrderFilters } from "../hooks/use-work-order-filters";
import type { WorkOrderWithRelations } from "../types";

export function WorkOrdersTable({ workOrders }: { workOrders: WorkOrderWithRelations[] }) {
  const { search, setSearch } = useWorkOrderFilters();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return workOrders;
    return workOrders.filter(
      (wo) =>
        wo.orderNumber.toLowerCase().includes(term) ||
        (wo.project?.name ?? "").toLowerCase().includes(term) ||
        (wo.project?.clientName ?? "").toLowerCase().includes(term),
    );
  }, [workOrders, search]);

  const columns = useMemo<ColumnDef<WorkOrderWithRelations>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => (
          <Link href={`/work-orders/${row.original.id}`} className="font-medium hover:underline">
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        id: "project",
        header: "Project",
        cell: ({ row }) => row.original.project?.name ?? "—",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => WORK_ORDER_TYPE_LABEL[row.original.type],
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <WorkOrderStatusBadge status={row.original.status} />,
      },
      {
        id: "assignedTo",
        header: "Assigned to",
        cell: ({ row }) => row.original.assignedTo?.name ?? "Unassigned",
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        cell: ({ row }) => (row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : "—"),
      },
    ],
    [],
  );

  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by order # or project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search work orders"
        />
        <div className="ml-auto">
          <Link href="/work-orders/new">
            <Button>New work order</Button>
          </Link>
        </div>
      </div>
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
                <TableRow key={row.id} data-testid="work-order-row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No work orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

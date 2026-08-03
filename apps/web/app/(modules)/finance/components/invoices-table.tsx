"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Input } from "@kostas/ui";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import type { Invoice } from "../types";

export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.clientName.toLowerCase().includes(term),
    );
  }, [invoices, search]);

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
        cell: ({ row }) => (
          <Link href={`/finance/invoices/${row.original.id}`} className="font-medium hover:underline">
            {row.original.invoiceNumber}
          </Link>
        ),
      },
      { accessorKey: "clientName", header: "Client" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => `$${Number(row.original.total).toFixed(2)}`,
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
          placeholder="Search by invoice # or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search invoices"
        />
        <div className="ml-auto">
          <Link href="/finance/invoices/new">
            <Button>New invoice</Button>
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
                <TableRow key={row.id} data-testid="invoice-row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

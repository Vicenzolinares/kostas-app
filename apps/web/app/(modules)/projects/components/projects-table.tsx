"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kostas/ui";
import { projectStatusValues } from "@kostas/shared/schemas";
import { useProjectFilters } from "../hooks/use-project-filters";
import { ProjectStatusBadge, PROJECT_STATUS_LABEL } from "./status-badge";
import { ProjectFormDialog } from "./project-form-dialog";
import { deleteProjectAction } from "../api/actions";
import type { Project } from "../types";

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const { search, status, setSearch, setStatus } = useProjectFilters();
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = status === "all" || project.status === status;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        project.name.toLowerCase().includes(term) ||
        project.clientName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [projects, search, status]);

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Project",
        cell: ({ row }) => (
          <Link href={`/projects/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: "clientName", header: "Client" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        cell: ({ row }) =>
          row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : "—",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <ProjectFormDialog
              project={row.original}
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
                  if (confirm(`Delete project "${row.original.name}"?`)) {
                    await deleteProjectAction(row.original.id);
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
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by project or client name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search projects"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {projectStatusValues.map((value) => (
              <SelectItem key={value} value={value}>
                {PROJECT_STATUS_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <ProjectFormDialog trigger={<Button>New project</Button>} />
        </div>
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-testid="project-row">
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
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

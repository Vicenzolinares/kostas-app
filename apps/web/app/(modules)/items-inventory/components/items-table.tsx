"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Input,
  Button,
} from "@kostas/ui";
import {
  reorderItemsAction,
  updateItemQuantityAction,
  deleteItemAction,
} from "../api/actions";
import type { ItemInventory } from "../types";

function SortableRow({
  item,
  children,
}: {
  item: ItemInventory;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      data-testid="item-row"
    >
      <TableCell className="w-8">
        <button
          type="button"
          className="cursor-grab text-muted-foreground"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

export function ItemsTable({
  items: initialItems,
}: {
  items: ItemInventory[];
}) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const columns = useMemo<ColumnDef<ItemInventory>[]>(
    () => [
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => row.original.category ?? "—",
      },
      {
        accessorKey: "binLocation",
        header: "Bin",
        cell: ({ row }) => row.original.binLocation ?? "—",
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              defaultValue={row.original.quantity}
              className="h-8 w-20"
              onBlur={(e) => {
                const value = Number(e.target.value);
                if (Number.isFinite(value) && value !== row.original.quantity) {
                  startTransition(async () => {
                    await updateItemQuantityAction(row.original.id, value);
                  });
                }
              }}
            />
            {row.original.quantity <= row.original.reorderThreshold ? (
              <Badge variant="destructive">Low</Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Delete "${row.original.name}"?`)) {
                setItems((prev) =>
                  prev.filter((i) => i.id !== row.original.id),
                );
                startTransition(async () => {
                  await deleteItemAction(row.original.id);
                });
              }
            }}
          >
            Delete
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(async () => {
        await reorderItemsAction({
          items: next.map((item, index) => ({ id: item.id, sortOrder: index })),
        });
      });
      return next;
    });
  }

  return (
    <div className="rounded-md border border-border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-8" />
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <SortableRow key={row.id} item={row.original}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </SortableRow>
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}

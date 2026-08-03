"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@kostas/ui";
import { createHardwareSchema, type CreateHardwareInput } from "@kostas/shared/schemas";
import { createHardwareAction, updateHardwareAction } from "../api/actions";
import type { HardwareInventory } from "../types";

interface HardwareFormDialogProps {
  item?: HardwareInventory;
  trigger: React.ReactNode;
}

export function HardwareFormDialog({ item, trigger }: HardwareFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateHardwareInput>({
    resolver: zodResolver(createHardwareSchema),
    defaultValues: item
      ? {
          sku: item.sku,
          barcode: item.barcode ?? "",
          name: item.name,
          category: item.category ?? "",
          quantity: item.quantity,
          unit: item.unit,
          binLocation: item.binLocation ?? "",
          reorderThreshold: item.reorderThreshold,
          supplier: item.supplier ?? "",
          costPerUnit: item.costPerUnit ? Number(item.costPerUnit) : null,
        }
      : { quantity: 0, unit: "ea", reorderThreshold: 0 },
  });

  function onSubmit(values: CreateHardwareInput) {
    setServerError(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      formData.set(key, String(value));
    });
    if (isEdit && item) {
      formData.set("id", item.id);
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateHardwareAction({ success: false }, formData)
        : await createHardwareAction({ success: false }, formData);

      if (result.success) {
        setOpen(false);
        reset();
      } else {
        setServerError(result.error ?? "Please check the form for errors.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit hardware item" : "New hardware item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
              {errors.sku ? <p className="text-xs text-destructive">{errors.sku.message}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...register("barcode")} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register("category")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="binLocation">Bin location</Label>
              <Input id="binLocation" {...register("binLocation")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register("quantity")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" {...register("unit")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reorderThreshold">Reorder threshold</Label>
              <Input id="reorderThreshold" type="number" {...register("reorderThreshold")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="costPerUnit">Cost per unit ($)</Label>
              <Input id="costPerUnit" type="number" step="0.01" {...register("costPerUnit")} />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" {...register("supplier")} />
            </div>
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

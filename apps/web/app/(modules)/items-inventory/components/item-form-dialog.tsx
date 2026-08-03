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
import { createItemSchema, type CreateItemInput } from "@kostas/shared/schemas";
import { createItemAction } from "../api/actions";

export function ItemFormDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      unit: "ea",
      quantity: 0,
      reorderThreshold: 0,
      sortOrder: 0,
    },
  });

  function onSubmit(values: CreateItemInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createItemAction(values);
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
      <DialogTrigger asChild>
        <Button>New item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New inventory item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
              {errors.sku ? (
                <p className="text-xs text-destructive">{errors.sku.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register("category")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="binLocation">Bin location</Label>
              <Input
                id="binLocation"
                placeholder="e.g. A1-01"
                {...register("binLocation")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" {...register("quantity")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reorderThreshold">Reorder threshold</Label>
              <Input
                id="reorderThreshold"
                type="number"
                {...register("reorderThreshold")}
              />
            </div>
          </div>
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

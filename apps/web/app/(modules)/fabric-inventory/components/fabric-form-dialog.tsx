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
import {
  createFabricSchema,
  type CreateFabricInput,
} from "@kostas/shared/schemas";
import { createFabricAction } from "../api/actions";

export function FabricFormDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFabricInput>({
    resolver: zodResolver(createFabricSchema),
    defaultValues: { yardsInStock: 0, yardsReserved: 0 },
  });

  function onSubmit(values: CreateFabricInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createFabricAction(values);
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
        <Button>New fabric</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New fabric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fabricCode">Fabric code</Label>
              <Input id="fabricCode" {...register("fabricCode")} />
              {errors.fabricCode ? (
                <p className="text-xs text-destructive">
                  {errors.fabricCode.message}
                </p>
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
              <Label htmlFor="mill">Mill</Label>
              <Input id="mill" {...register("mill")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" {...register("color")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="widthInches">Width (in)</Label>
              <Input
                id="widthInches"
                type="number"
                step="0.01"
                {...register("widthInches")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="costPerYard">Cost per yard ($)</Label>
              <Input
                id="costPerYard"
                type="number"
                step="0.01"
                {...register("costPerYard")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="yardsInStock">Yards in stock</Label>
              <Input
                id="yardsInStock"
                type="number"
                step="0.01"
                {...register("yardsInStock")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="warehouseLocation">Warehouse location</Label>
              <Input
                id="warehouseLocation"
                {...register("warehouseLocation")}
              />
            </div>
          </div>
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create fabric"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

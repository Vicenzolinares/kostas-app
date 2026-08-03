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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kostas/ui";
import {
  createProjectFabricSchema,
  type CreateProjectFabricInput,
} from "@kostas/shared/schemas";
import { createProjectFabricAction } from "../api/actions";

interface Option {
  id: string;
  name: string;
}

export function ProjectFabricFormDialog({
  projectOptions,
  fabricOptions,
}: {
  projectOptions: Option[];
  fabricOptions: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFabricInput>({
    resolver: zodResolver(createProjectFabricSchema),
    defaultValues: { status: "draft" },
  });

  const projectId = watch("projectId");
  const fabricId = watch("fabricId");

  function onSubmit(values: CreateProjectFabricInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createProjectFabricAction(values);
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
        <Button
          disabled={projectOptions.length === 0 || fabricOptions.length === 0}
        >
          Link fabric
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link fabric to project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectId">Project</Label>
            <Select
              value={projectId}
              onValueChange={(value) => setValue("projectId", value)}
            >
              <SelectTrigger id="projectId">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectId ? (
              <p className="text-xs text-destructive">
                {errors.projectId.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fabricId">Fabric</Label>
            <Select
              value={fabricId}
              onValueChange={(value) => setValue("fabricId", value)}
            >
              <SelectTrigger id="fabricId">
                <SelectValue placeholder="Select a fabric" />
              </SelectTrigger>
              <SelectContent>
                {fabricOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fabricId ? (
              <p className="text-xs text-destructive">
                {errors.fabricId.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="yardsRequired">Yards required</Label>
            <Input
              id="yardsRequired"
              type="number"
              step="0.01"
              {...register("yardsRequired")}
            />
            {errors.yardsRequired ? (
              <p className="text-xs text-destructive">
                {errors.yardsRequired.message}
              </p>
            ) : null}
          </div>
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Link fabric"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Textarea,
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
import { createProjectSchema, type CreateProjectInput, projectStatusValues } from "@kostas/shared/schemas";
import { createProjectAction, updateProjectAction } from "../api/actions";
import { PROJECT_STATUS_LABEL } from "./status-badge";
import type { Project } from "../types";

interface ProjectFormDialogProps {
  project?: Project;
  trigger: React.ReactNode;
}

export function ProjectFormDialog({ project, trigger }: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(project);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: project
      ? {
          name: project.name,
          clientName: project.clientName,
          clientEmail: project.clientEmail ?? "",
          clientPhone: project.clientPhone ?? "",
          status: project.status,
          description: project.description ?? "",
          budget: project.budget ? Number(project.budget) : null,
          dueDate: project.dueDate ?? undefined,
        }
      : { status: "lead" },
  });

  const status = watch("status");

  function onSubmit(values: CreateProjectInput) {
    setServerError(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      formData.set(key, value instanceof Date ? value.toISOString() : String(value));
    });

    if (isEdit && project) {
      formData.set("id", project.id);
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateProjectAction({ success: false }, formData)
        : await createProjectAction({ success: false }, formData);

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
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientName">Client name</Label>
              <Input id="clientName" {...register("clientName")} />
              {errors.clientName ? (
                <p className="text-xs text-destructive">{errors.clientName.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientEmail">Client email</Label>
              <Input id="clientEmail" type="email" {...register("clientEmail")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientPhone">Client phone</Label>
              <Input id="clientPhone" {...register("clientPhone")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setValue("status", value as CreateProjectInput["status"])}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PROJECT_STATUS_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input id="budget" type="number" step="0.01" {...register("budget")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

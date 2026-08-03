"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
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
import {
  createClientMeasurementSchema,
  type CreateClientMeasurementInput,
} from "@kostas/shared/schemas";
import { createMeasurementAction } from "../api/actions";

// react-konva pulls in konva's Node build during SSR, which requires the
// optional native `canvas` package we don't install (we only ever draw
// in the browser). Load the canvas editor client-side only.
const MeasurementCanvasEditor = dynamic(
  () =>
    import("./measurement-canvas").then((mod) => mod.MeasurementCanvasEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-[640px] items-center justify-center rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
        Loading canvas…
      </div>
    ),
  },
);

interface ProjectOption {
  id: string;
  name: string;
  clientName: string;
}

const EMPTY_CANVAS: CreateClientMeasurementInput["canvasData"] = {
  width: 640,
  height: 420,
  points: [],
  lines: [],
};

export function MeasurementFormDialog({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateClientMeasurementInput>({
    resolver: zodResolver(createClientMeasurementSchema),
    defaultValues: {
      projectId: defaultProjectId ?? projects[0]?.id ?? "",
      furniturePiece: "",
      notes: "",
      canvasData: EMPTY_CANVAS,
    },
  });

  const projectId = watch("projectId");

  function onSubmit(values: CreateClientMeasurementInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createMeasurementAction(values);
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
        <Button>New measurement</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New client measurement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
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
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} — {project.clientName}
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
              <Label htmlFor="furniturePiece">Furniture piece</Label>
              <Input
                id="furniturePiece"
                placeholder="e.g. 3-seat sofa"
                {...register("furniturePiece")}
              />
              {errors.furniturePiece ? (
                <p className="text-xs text-destructive">
                  {errors.furniturePiece.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Sketch</Label>
            <Controller
              control={control}
              name="canvasData"
              render={({ field }) => (
                <MeasurementCanvasEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending || !projectId}>
              {pending ? "Saving…" : "Save measurement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

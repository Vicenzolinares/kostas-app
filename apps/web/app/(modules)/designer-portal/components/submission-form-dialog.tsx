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
  createDesignSubmissionSchema,
  type CreateDesignSubmissionInput,
} from "@kostas/shared/schemas";
import { createDesignSubmissionAction } from "../api/actions";

interface SubmissionFormDialogProps {
  projectId: string;
  trigger: React.ReactNode;
}

export function SubmissionFormDialog({
  projectId,
  trigger,
}: SubmissionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDesignSubmissionInput>({
    resolver: zodResolver(createDesignSubmissionSchema),
    defaultValues: { projectId, title: "", fileKeys: [] },
  });

  function onSubmit(values: CreateDesignSubmissionInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createDesignSubmissionAction(values);
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
          <DialogTitle>New design submission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            ) : null}
          </div>
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Create submission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

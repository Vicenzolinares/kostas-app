"use client";

import { useEffect, useState, useTransition } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kostas/ui";
import {
  createCalendarEventSchema,
  calendarEventTypeValues,
  type CreateCalendarEventInput,
} from "@kostas/shared/schemas";
import { createCalendarEventAction, updateCalendarEventAction, deleteCalendarEventAction } from "../api/actions";

const TYPE_LABEL: Record<string, string> = {
  measurement_appointment: "Measurement Appointment",
  fabric_delivery: "Fabric Delivery",
  production: "Production",
  quality_check: "Quality Check",
  delivery_installation: "Delivery / Installation",
  other: "Other",
};

export interface EventFormDialogState {
  mode: "create" | "edit";
  id?: string;
  defaults?: Partial<CreateCalendarEventInput>;
}

interface EventFormDialogProps {
  state: EventFormDialogState | null;
  onClose: () => void;
}

function toLocalInputValue(date?: Date) {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventFormDialog({ state, onClose }: EventFormDialogProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCalendarEventInput>({
    resolver: zodResolver(createCalendarEventSchema),
    defaultValues: { type: "other", allDay: false },
  });

  useEffect(() => {
    if (!state) return;
    reset({
      title: state.defaults?.title ?? "",
      type: state.defaults?.type ?? "other",
      start: state.defaults?.start,
      end: state.defaults?.end,
      allDay: state.defaults?.allDay ?? false,
      rrule: state.defaults?.rrule ?? "",
      location: state.defaults?.location ?? "",
      notes: state.defaults?.notes ?? "",
    });
    setError(null);
  }, [state, reset]);

  const type = watch("type");

  function onSubmit(values: CreateCalendarEventInput) {
    setError(null);
    startTransition(async () => {
      const result =
        state?.mode === "edit" && state.id
          ? await updateCalendarEventAction({ id: state.id, ...values })
          : await createCalendarEventAction(values);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Please check the form for errors.");
      }
    });
  }

  function handleDelete() {
    if (!state?.id) return;
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      await deleteCalendarEventAction(state.id!);
      onClose();
    });
  }

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="datetime-local"
                defaultValue={toLocalInputValue(state?.defaults?.start)}
                onChange={(e) => setValue("start", new Date(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="datetime-local"
                defaultValue={toLocalInputValue(state?.defaults?.end)}
                onChange={(e) => setValue("end", new Date(e.target.value))}
              />
              {errors.end ? <p className="text-xs text-destructive">{errors.end.message}</p> : null}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setValue("type", value as CreateCalendarEventInput["type"])}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendarEventTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TYPE_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rrule">Recurrence (RRULE, optional)</Label>
            <Input id="rrule" placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR" {...register("rrule")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {state?.mode === "edit" ? (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={pending}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : state?.mode === "edit" ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

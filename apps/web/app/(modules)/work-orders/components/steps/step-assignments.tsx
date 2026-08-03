"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kostas/ui";
import { wizardStepAssignmentsSchema, type WizardStepAssignments } from "@kostas/shared/schemas";
import { useWorkOrderWizard } from "../../hooks/use-work-order-wizard";
import type { AssigneeOption } from "../../types";

export function StepAssignments({ assignees }: { assignees: AssigneeOption[] }) {
  const { assignedToId, dueDate, setAssignments, next, back } = useWorkOrderWizard();

  const {
    handleSubmit,
    setValue,
    watch,
    register,
  } = useForm<WizardStepAssignments>({
    resolver: zodResolver(wizardStepAssignmentsSchema),
    defaultValues: {
      assignedToId: assignedToId ?? undefined,
      dueDate: dueDate ?? undefined,
    },
  });

  const selectedAssignee = watch("assignedToId");

  function onSubmit(values: WizardStepAssignments) {
    setAssignments(values.assignedToId ?? null, values.dueDate ?? null);
    next();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assignedToId">Assign to</Label>
            <Select
              value={selectedAssignee ?? undefined}
              onValueChange={(value) => setValue("assignedToId", value)}
            >
              <SelectTrigger id="assignedToId">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {assignees.map((assignee) => (
                  <SelectItem key={assignee.id} value={assignee.id}>
                    {assignee.name} ({assignee.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

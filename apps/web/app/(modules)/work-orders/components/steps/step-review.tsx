"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@kostas/ui";
import { useWorkOrderWizard } from "../../hooks/use-work-order-wizard";
import { WORK_ORDER_TYPE_LABEL } from "../status-badge";
import { createWorkOrderAction } from "../../api/actions";
import type { AssigneeOption, FabricOption, ProjectOption } from "../../types";

interface StepReviewProps {
  projects: ProjectOption[];
  fabrics: FabricOption[];
  assignees: AssigneeOption[];
}

export function StepReview({ projects, fabrics, assignees }: StepReviewProps) {
  const router = useRouter();
  const { type, projectId, specifications, fabrics: selectedFabrics, assignedToId, dueDate, back, reset } =
    useWorkOrderWizard();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const assignee = assignees.find((a) => a.id === assignedToId);

  function onSubmit() {
    if (!type || !projectId) {
      setError("Missing required fields — go back and complete all steps.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createWorkOrderAction({
        type,
        projectId,
        specifications,
        fabrics: selectedFabrics,
        assignedToId,
        dueDate,
      });

      if (result.success && result.workOrderId) {
        reset();
        router.push(`/work-orders/${result.workOrderId}`);
      } else {
        setError(result.error ?? "Please check the wizard steps for errors.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div>
          <h3 className="font-medium">Type</h3>
          <p className="text-sm text-muted-foreground">{type ? WORK_ORDER_TYPE_LABEL[type] : "—"}</p>
        </div>
        <div>
          <h3 className="font-medium">Project</h3>
          <p className="text-sm text-muted-foreground">
            {project ? `${project.name} — ${project.clientName}` : "—"}
          </p>
        </div>
        <div>
          <h3 className="font-medium">Specifications</h3>
          <p className="text-sm text-muted-foreground">
            {specifications.furniturePieces?.join(", ") || "No furniture pieces listed"}
          </p>
        </div>
        <div>
          <h3 className="font-medium">Fabrics</h3>
          {selectedFabrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">None selected</p>
          ) : (
            <ul className="text-sm text-muted-foreground">
              {selectedFabrics.map((line, index) => {
                const fabric = fabrics.find((f) => f.id === line.fabricId);
                return <li key={index}>{fabric?.name} — {line.yardsAllocated} yd</li>;
              })}
            </ul>
          )}
        </div>
        <div>
          <h3 className="font-medium">Assignment</h3>
          <p className="text-sm text-muted-foreground">
            {assignee?.name ?? "Unassigned"} {dueDate ? `— due ${new Date(dueDate).toLocaleDateString()}` : ""}
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={back}>
            Back
          </Button>
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending ? "Creating…" : "Generate work order"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

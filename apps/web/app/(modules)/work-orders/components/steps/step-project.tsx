"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kostas/ui";
import { wizardStepProjectSchema, type WizardStepProject } from "@kostas/shared/schemas";
import { useWorkOrderWizard } from "../../hooks/use-work-order-wizard";
import type { ProjectOption } from "../../types";

export function StepProject({ projects }: { projects: ProjectOption[] }) {
  const { projectId, setProjectId, next, back } = useWorkOrderWizard();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WizardStepProject>({
    resolver: zodResolver(wizardStepProjectSchema),
    defaultValues: { projectId: projectId ?? undefined },
  });

  const selected = watch("projectId");

  function onSubmit(values: WizardStepProject) {
    setProjectId(values.projectId);
    next();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectId">Project</Label>
            <Select value={selected} onValueChange={(value) => setValue("projectId", value)}>
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
              <p className="text-xs text-destructive">{errors.projectId.message}</p>
            ) : null}
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

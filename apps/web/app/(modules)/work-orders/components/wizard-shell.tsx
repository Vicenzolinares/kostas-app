"use client";

import { cn } from "@kostas/ui";
import { WIZARD_STEPS, useWorkOrderWizard, type WizardStep } from "../hooks/use-work-order-wizard";
import { StepType } from "./steps/step-type";
import { StepProject } from "./steps/step-project";
import { StepSpecifications } from "./steps/step-specifications";
import { StepFabric } from "./steps/step-fabric";
import { StepAssignments } from "./steps/step-assignments";
import { StepReview } from "./steps/step-review";
import type { ProjectOption, FabricOption, AssigneeOption } from "../types";

const STEP_LABEL: Record<WizardStep, string> = {
  type: "Choose Type",
  project: "Project",
  specifications: "Specifications",
  fabric: "Fabric",
  assignments: "Assignments",
  review: "Review",
};

interface WizardShellProps {
  projects: ProjectOption[];
  fabrics: FabricOption[];
  assignees: AssigneeOption[];
}

export function WizardShell({ projects, fabrics, assignees }: WizardShellProps) {
  const { stepIndex, goToStep } = useWorkOrderWizard();
  const currentStep = WIZARD_STEPS[stepIndex];

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {WIZARD_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => index <= stepIndex && goToStep(step)}
              disabled={index > stepIndex}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                index === stepIndex
                  ? "bg-primary text-primary-foreground"
                  : index < stepIndex
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}. {STEP_LABEL[step]}
            </button>
            {index < WIZARD_STEPS.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </li>
        ))}
      </ol>

      <div>
        {currentStep === "type" ? <StepType /> : null}
        {currentStep === "project" ? <StepProject projects={projects} /> : null}
        {currentStep === "specifications" ? <StepSpecifications /> : null}
        {currentStep === "fabric" ? <StepFabric fabrics={fabrics} /> : null}
        {currentStep === "assignments" ? <StepAssignments assignees={assignees} /> : null}
        {currentStep === "review" ? (
          <StepReview projects={projects} fabrics={fabrics} assignees={assignees} />
        ) : null}
      </div>
    </div>
  );
}

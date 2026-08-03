import { cn } from "@kostas/ui";
import { projectStatusValues, type ProjectStatus } from "@kostas/shared/schemas";
import { PROJECT_STATUS_LABEL } from "./status-badge";

// "cancelled" is a terminal off-ramp, not a step on the happy-path timeline.
const TIMELINE_STEPS = projectStatusValues.filter((s) => s !== "cancelled");

export function ProjectStatusTimeline({ status }: { status: ProjectStatus }) {
  if (status === "cancelled") {
    return <p className="text-sm text-destructive">This project was cancelled.</p>;
  }

  const currentIndex = TIMELINE_STEPS.indexOf(status);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {TIMELINE_STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 items-center rounded-full px-3 text-xs font-medium",
                active && "bg-primary text-primary-foreground",
                done && !active && "bg-secondary text-secondary-foreground",
                !done && !active && "border border-border text-muted-foreground",
              )}
            >
              {PROJECT_STATUS_LABEL[step]}
            </span>
            {index < TIMELINE_STEPS.length - 1 ? (
              <span className="h-px w-4 bg-border" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

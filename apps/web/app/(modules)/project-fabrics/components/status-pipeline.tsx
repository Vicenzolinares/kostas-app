import { cn } from "@kostas/ui";
import {
  projectFabricStatusValues,
  type ProjectFabricStatus,
} from "@kostas/shared/schemas";

const STATUS_LABEL: Record<ProjectFabricStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  received: "Received",
  cut: "Cut",
  installed: "Installed",
};

export function ProjectFabricStatusPipeline({
  status,
}: {
  status: ProjectFabricStatus;
}) {
  const currentIndex = projectFabricStatusValues.indexOf(status);

  return (
    <ol className="flex items-center gap-1">
      {projectFabricStatusValues.map((step, index) => (
        <li
          key={step}
          className={cn(
            "flex h-5 items-center rounded-full px-2 text-[10px] font-medium",
            index === currentIndex && "bg-primary text-primary-foreground",
            index < currentIndex && "bg-secondary text-secondary-foreground",
            index > currentIndex &&
              "border border-border text-muted-foreground",
          )}
        >
          {STATUS_LABEL[step]}
        </li>
      ))}
    </ol>
  );
}

export const PROJECT_FABRIC_STATUS_LABEL = STATUS_LABEL;

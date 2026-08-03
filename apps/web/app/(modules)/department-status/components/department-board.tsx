"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { useDepartmentStatus } from "../hooks/use-department-status";
import { UtilizationChart } from "./utilization-chart";
import { StageStatusBadge } from "./stage-status-badge";

export function DepartmentBoard() {
  const { data, isLoading, isError, dataUpdatedAt, transport } = useDepartmentStatus();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading department status…</p>;
  }
  if (isError || !data) {
    return <p className="text-sm text-destructive">Failed to load department status.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Live via {transport} · updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilization by department</CardTitle>
        </CardHeader>
        <CardContent>
          <UtilizationChart departments={data.departments} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.departments.map((snapshot) => (
          <Card key={snapshot.department.id} data-testid="department-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {snapshot.department.name}
                <span className="text-sm font-normal text-muted-foreground">
                  {snapshot.utilizationPct}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {snapshot.stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active work.</p>
              ) : (
                snapshot.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{stage.projectName}</p>
                      <p className="text-xs text-muted-foreground">{stage.clientName}</p>
                    </div>
                    <StageStatusBadge status={stage.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

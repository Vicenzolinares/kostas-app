"use client";

import { Button, Card, CardContent } from "@kostas/ui";
import { workOrderTypeValues } from "@kostas/shared/schemas";
import { useWorkOrderWizard } from "../../hooks/use-work-order-wizard";
import { WORK_ORDER_TYPE_LABEL } from "../status-badge";

export function StepType() {
  const { type, setType, next } = useWorkOrderWizard();

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="text-sm text-muted-foreground">What kind of work order is this?</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {workOrderTypeValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-md border p-4 text-left text-sm font-medium transition-colors ${
                type === value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              {WORK_ORDER_TYPE_LABEL[value]}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="button" disabled={!type} onClick={next}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

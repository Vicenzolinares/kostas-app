"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kostas/ui";
import { deleteMeasurementAction } from "../api/actions";
import { PhotoDropzone } from "./photo-dropzone";
import type { ClientMeasurement } from "../types";

interface MeasurementWithProject extends ClientMeasurement {
  project: { name: string; clientName: string };
}

export function MeasurementsList({
  measurements,
}: {
  measurements: MeasurementWithProject[];
}) {
  const [pending, startTransition] = useTransition();

  if (measurements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No measurements recorded yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {measurements.map((measurement) => (
        <Card key={measurement.id} data-testid="measurement-card">
          <CardHeader>
            <CardTitle className="text-base">
              {measurement.furniturePiece}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {measurement.project.name} — {measurement.project.clientName}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {measurement.notes ? (
              <p className="text-sm">{measurement.notes}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {(measurement.sheets ?? []).reduce(
                (total, sheet) =>
                  total + sheet.entries.filter((e) => e.value != null).length,
                0,
              )}{" "}
              dimensions recorded · {measurement.canvasData.lines.length}{" "}
              freehand lines
            </p>
            <Link
              href={`/client-measurements/${measurement.id}`}
              className="text-sm font-medium text-primary hover:underline"
              data-testid="open-measurement"
            >
              Open measurement sheet →
            </Link>
            <PhotoDropzone measurementId={measurement.id} />
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (confirm("Delete this measurement?")) {
                    await deleteMeasurementAction(measurement.id);
                  }
                })
              }
            >
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

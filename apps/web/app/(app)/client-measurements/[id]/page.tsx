import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import type { MeasurementSheet, SketchKind } from "@kostas/shared/schemas";
import { getMeasurementById } from "@/app/(modules)/client-measurements/api/queries";
import { MeasurementSheetCard } from "@/app/(modules)/client-measurements/components/measurement-sheet";
import { PhotoDropzone } from "@/app/(modules)/client-measurements/components/photo-dropzone";
import { SHEET_DEFINITIONS } from "@/app/(modules)/client-measurements/lib/sheet-definitions";

/**
 * Both sheets always render, even on a record that has never been filled
 * in — the deck shows Sofa and Window Treatments as a standard pair, and a
 * blank sheet is the thing you're meant to walk into the house with.
 */
function withDefaults(stored: MeasurementSheet[]): MeasurementSheet[] {
  return (["sofa", "window"] as SketchKind[]).map(
    (kind) =>
      stored.find((sheet) => sheet.kind === kind) ?? {
        kind,
        unit: "in" as const,
        entries: SHEET_DEFINITIONS[kind].map((definition) => ({
          key: definition.key,
          value: null,
        })),
      },
  );
}

async function MeasurementDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const measurement = await getMeasurementById(id);
  if (!measurement) notFound();

  const sheets = withDefaults(measurement.sheets ?? []);
  const recorded = sheets.reduce(
    (total, sheet) =>
      total + sheet.entries.filter((e) => e.value != null).length,
    0,
  );
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="mb-1 text-xs text-muted-foreground">
            <Link href="/projects" className="hover:underline">
              Projects
            </Link>
            {" › "}
            <Link
              href={`/projects/${measurement.projectId}`}
              className="hover:underline"
            >
              {measurement.project.name}
            </Link>
            {" › Measurements"}
          </nav>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {measurement.furniturePiece}
            </h1>
            <Badge variant="outline">
              {recorded > 0 ? "In Progress" : "Not Started"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Client: {measurement.project.clientName} · Updated{" "}
            {dateFmt.format(measurement.updatedAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Room Photos</CardTitle>
              <p className="text-xs text-muted-foreground">
                Upload clear photos of the space.
              </p>
            </CardHeader>
            <CardContent>
              <PhotoDropzone measurementId={measurement.id} />
            </CardContent>
          </Card>

          {sheets.map((sheet) => (
            <MeasurementSheetCard
              key={sheet.kind}
              measurementId={measurement.id}
              sheet={sheet}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Measurement Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Piece" value={measurement.furniturePiece} />
              <Row label="Project" value={measurement.project.name} />
              <Row label="Client" value={measurement.project.clientName} />
              {measurement.notes ? (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{measurement.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Measurement Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {sheets.map((sheet) => (
                <Row
                  key={sheet.kind}
                  label={
                    sheet.kind === "sofa"
                      ? "Sofa / Furniture"
                      : "Window Treatments"
                  }
                  value={`${sheet.entries.filter((e) => e.value != null).length} of ${
                    SHEET_DEFINITIONS[sheet.kind].length
                  }`}
                />
              ))}
              <Row
                label="Freehand sketch"
                value={`${measurement.canvasData.lines.length} dimension lines`}
              />
              <Row
                label="Last Updated"
                value={dateFmt.format(measurement.updatedAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sync to Project</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="text-xs text-muted-foreground">
                This record is linked to the project and visible to everyone on
                it.
              </p>
              <Link
                href={`/projects/${measurement.projectId}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open {measurement.project.name} →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function MeasurementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params is passed through rather than awaited here: awaiting it above the
  // Suspense boundary fails the Cache Components build, the same pattern as
  // projects/[id] and designer-portal/[id].
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading measurement…</p>
      }
    >
      <MeasurementDetail params={params} />
    </Suspense>
  );
}

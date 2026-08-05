"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@kostas/ui";
import type {
  MeasurementSheet,
  MeasurementUnit,
  SketchKind,
} from "@kostas/shared/schemas";
import { SofaSketch, WindowSketch } from "./sketch-illustrations";
import {
  SHEET_DEFINITIONS,
  SHEET_TITLES,
  toDisplay,
  fromDisplay,
} from "../lib/sheet-definitions";
import { saveMeasurementSheetsAction } from "../api/actions";

const SKETCHES: Record<SketchKind, () => React.JSX.Element> = {
  sofa: SofaSketch,
  window: WindowSketch,
};

/**
 * One illustrated measurement sheet: the sketch with numbered callouts on
 * the left, the dimension table on the right, as the deck lays it out.
 *
 * The two halves share the same numbering, so a callout on the drawing and
 * a row in the table are the same measurement — hovering or focusing either
 * highlights both, which is the only way to tell which "8" on a sofa is the
 * leg height without counting.
 */
export function MeasurementSheetCard({
  measurementId,
  sheet,
}: {
  measurementId: string;
  sheet: MeasurementSheet;
}) {
  const definitions = SHEET_DEFINITIONS[sheet.kind];
  const Sketch = SKETCHES[sheet.kind];

  const [unit, setUnit] = useState<MeasurementUnit>(sheet.unit);
  const [showDimensions, setShowDimensions] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(sheet.entries.map((entry) => [entry.key, entry.value])),
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const filled = useMemo(
    () => definitions.filter((d) => values[d.key] != null).length,
    [definitions, values],
  );

  function save() {
    startTransition(async () => {
      const result = await saveMeasurementSheetsAction({
        id: measurementId,
        sheets: [
          {
            kind: sheet.kind,
            unit,
            entries: definitions.map((definition) => ({
              key: definition.key,
              value: values[definition.key] ?? null,
            })),
          },
        ],
      });
      if (result.success) setSavedAt(new Date());
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">
            {SHEET_TITLES[sheet.kind]}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {filled} of {definitions.length} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDimensions((value) => !value)}
            aria-pressed={showDimensions}
            className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {showDimensions ? "Hide dimensions" : "Show dimensions"}
          </button>
          {/* Beside the sketch, not buried in settings: the deck puts the
              unit switch where the numbers are being read. */}
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(["in", "cm"] as MeasurementUnit[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUnit(option)}
                aria-pressed={unit === option}
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  unit === option
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {option === "in" ? "inches (in)" : "cm"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            className="w-full"
            role="img"
            aria-label={`${SHEET_TITLES[sheet.kind]} diagram`}
          >
            <Sketch />
            {showDimensions
              ? definitions.map((definition) => {
                  const isActive = active === definition.key;
                  return (
                    <g
                      key={definition.key}
                      onMouseEnter={() => setActive(definition.key)}
                      onMouseLeave={() => setActive(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={definition.callout.x}
                        cy={definition.callout.y}
                        r={isActive ? 4.2 : 3.4}
                        className={
                          isActive
                            ? "fill-primary stroke-primary"
                            : "fill-primary/85 stroke-primary/85"
                        }
                        strokeWidth={0.5}
                      />
                      <text
                        x={definition.callout.x}
                        y={definition.callout.y + 1.5}
                        textAnchor="middle"
                        className="fill-primary-foreground"
                        style={{ fontSize: 4, fontWeight: 600 }}
                      >
                        {definition.number}
                      </text>
                    </g>
                  );
                })
              : null}
          </svg>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-8 pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Measurement</th>
                <th className="pb-2 font-medium">Value ({unit})</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((definition) => {
                const stored = values[definition.key];
                const isActive = active === definition.key;
                return (
                  <tr
                    key={definition.key}
                    onMouseEnter={() => setActive(definition.key)}
                    onMouseLeave={() => setActive(null)}
                    className={`border-b border-border/60 last:border-0 ${
                      isActive ? "bg-accent/50" : ""
                    }`}
                  >
                    <td className="py-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
                        {definition.number}
                      </span>
                    </td>
                    <td className="py-1.5">{definition.label}</td>
                    <td className="py-1.5">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.25"
                        aria-label={`${definition.label} in ${unit}`}
                        value={stored == null ? "" : toDisplay(stored, unit)}
                        onFocus={() => setActive(definition.key)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          setValues((current) => ({
                            ...current,
                            [definition.key]:
                              raw === ""
                                ? null
                                : fromDisplay(Number(raw), unit),
                          }));
                        }}
                        className="h-7 w-24"
                      />
                    </td>
                    <td className="py-1.5 text-xs text-muted-foreground">
                      {definition.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 flex items-center gap-3">
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save measurements"}
            </Button>
            {savedAt ? (
              <span className="text-xs text-muted-foreground">
                Saved {savedAt.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

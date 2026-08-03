"use client";

import { useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Line,
  Circle,
  Text,
  Image as KonvaImage,
} from "react-konva";
import type Konva from "konva";
import { Button } from "@kostas/ui";
import type { MeasurementCanvas } from "../types";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 420;
const SNAP_GRID = 20;

function snap(value: number): number {
  return Math.round(value / SNAP_GRID) * SNAP_GRID;
}

interface MeasurementCanvasEditorProps {
  value: MeasurementCanvas;
  onChange: (value: MeasurementCanvas) => void;
  backgroundImage?: HTMLImageElement;
}

/**
 * A furniture-sketch canvas: click to drop point markers, drag to
 * reposition (snapped to a grid), and lines connect the last two
 * points into a labeled dimension. Export renders the stage to a PNG
 * data URL for the reference photo / spec sheet.
 */
export function MeasurementCanvasEditor({
  value,
  onChange,
  backgroundImage,
}: MeasurementCanvasEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [pendingLabel, setPendingLabel] = useState("");

  const points = value.points;
  const lines = value.lines;

  function addPoint(x: number, y: number) {
    const id = crypto.randomUUID();
    onChange({
      ...value,
      points: [
        ...points,
        { id, x: snap(x), y: snap(y), label: pendingLabel || undefined },
      ],
    });
    setPendingLabel("");
  }

  function movePoint(id: string, x: number, y: number) {
    onChange({
      ...value,
      points: points.map((p) =>
        p.id === id ? { ...p, x: snap(x), y: snap(y) } : p,
      ),
    });
  }

  function connectLastTwoPoints() {
    if (points.length < 2) return;
    const [a, b] = points.slice(-2);
    if (!a || !b) return;
    const distancePx = Math.hypot(b.x - a.x, b.y - a.y);
    const inches = Math.round((distancePx / SNAP_GRID) * 10) / 10; // 1 grid unit ~= 1"
    onChange({
      ...value,
      lines: [
        ...lines,
        {
          id: crypto.randomUUID(),
          points: [a.x, a.y, b.x, b.y],
          label: `${inches}"`,
          valueInches: inches,
        },
      ],
    });
  }

  function clearAll() {
    onChange({ ...value, points: [], lines: [] });
  }

  function exportAsImage(): string | undefined {
    return stageRef.current?.toDataURL({ pixelRatio: 2 });
  }

  const canConnect = points.length >= 2;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={pendingLabel}
          onChange={(e) => setPendingLabel(e.target.value)}
          placeholder="Label for next point (optional)"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canConnect}
          onClick={connectLastTwoPoints}
        >
          Connect last 2 points
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const dataUrl = exportAsImage();
            if (!dataUrl) return;
            const link = document.createElement("a");
            link.download = "measurement-sketch.png";
            link.href = dataUrl;
            link.click();
          }}
        >
          Export as image
        </Button>
      </div>

      <div
        className="w-fit overflow-hidden rounded-md border border-border bg-muted/30"
        data-testid="measurement-canvas"
      >
        <Stage
          ref={stageRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onDblClick={(e) => {
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos) addPoint(pos.x, pos.y);
          }}
        >
          <Layer>
            {backgroundImage ? (
              <KonvaImage
                image={backgroundImage}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                opacity={0.6}
              />
            ) : null}

            {lines.map((line) => (
              <MeasurementLine
                key={line.id}
                points={line.points}
                label={line.label}
              />
            ))}

            {points.map((point) => (
              <MeasurementPoint
                key={point.id}
                x={point.x}
                y={point.y}
                label={point.label}
                onDragMove={(x, y) => movePoint(point.id, x, y)}
              />
            ))}
          </Layer>
        </Stage>
      </div>
      <p className="text-xs text-muted-foreground">
        Double-click the canvas to drop a labeled point (snaps to a {SNAP_GRID}
        px grid). Drag points to reposition. Select two points, then
        &quot;Connect last 2 points&quot; to add a dimension line.
      </p>
    </div>
  );
}

function MeasurementPoint({
  x,
  y,
  label,
  onDragMove,
}: {
  x: number;
  y: number;
  label?: string;
  onDragMove: (x: number, y: number) => void;
}) {
  return (
    <>
      <Circle
        x={x}
        y={y}
        radius={6}
        fill="#18181b"
        draggable
        dragBoundFunc={(pos) => ({ x: snap(pos.x), y: snap(pos.y) })}
        onDragMove={(e) => onDragMove(e.target.x(), e.target.y())}
      />
      {label ? (
        <Text x={x + 8} y={y - 16} text={label} fontSize={12} fill="#18181b" />
      ) : null}
    </>
  );
}

function MeasurementLine({
  points,
  label,
}: {
  points: number[];
  label?: string;
}) {
  const midX = useMemo(
    () => ((points[0] ?? 0) + (points[2] ?? 0)) / 2,
    [points],
  );
  const midY = useMemo(
    () => ((points[1] ?? 0) + (points[3] ?? 0)) / 2,
    [points],
  );

  return (
    <>
      <Line points={points} stroke="#71717a" strokeWidth={2} dash={[6, 4]} />
      {label ? (
        <Text
          x={midX}
          y={midY - 14}
          text={label}
          fontSize={12}
          fill="#3f3f46"
        />
      ) : null}
    </>
  );
}

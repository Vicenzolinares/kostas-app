"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { GridStack, type GridStackWidget } from "gridstack";
import "gridstack/dist/gridstack.css";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kostas/ui";
import { saveDashboardLayoutAction } from "../api/actions";
import type { DashboardWidgetLayout } from "@kostas/database/schema";

export interface DashboardWidgetDef {
  id: string;
  title: string;
  // A pre-rendered element, not a render function: Server Components can
  // pass JSX across the server/client boundary, but not plain functions.
  content: React.ReactNode;
  defaultLayout: { x: number; y: number; w: number; h: number };
}

const DEFAULT_ORDER = (
  widgets: DashboardWidgetDef[],
): DashboardWidgetLayout[] =>
  widgets.map((widget) => ({
    id: widget.id,
    widget: widget.id,
    ...widget.defaultLayout,
  }));

export function DashboardGrid({
  widgets,
  initialLayout,
}: {
  widgets: DashboardWidgetDef[];
  initialLayout: DashboardWidgetLayout[] | null;
}) {
  const gridElRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridStack | null>(null);
  const [mountedIds, setMountedIds] = useState<string[]>([]);
  // Portal target elements, keyed by widget id. Populated via callback
  // refs (a commit-phase effect), never read during render itself, since
  // reading ref.current inside render is unsafe.
  const [portalContainers, setPortalContainers] = useState<
    Record<string, HTMLDivElement>
  >({});
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const layout =
    initialLayout && initialLayout.length > 0
      ? initialLayout
      : DEFAULT_ORDER(widgets);

  useEffect(() => {
    if (!gridElRef.current) return;

    const grid = GridStack.init(
      {
        column: 12,
        cellHeight: 80,
        margin: 8,
        float: true,
      },
      gridElRef.current,
    );
    gridRef.current = grid;

    const widgetOptions: GridStackWidget[] = layout
      .filter((entry) => widgets.some((w) => w.id === entry.widget))
      .map((entry) => ({
        id: entry.widget,
        x: entry.x,
        y: entry.y,
        w: entry.w,
        h: entry.h,
        content: "",
      }));

    grid.load(widgetOptions);
    setMountedIds(widgetOptions.map((w) => String(w.id)));

    return () => {
      grid.destroy(false);
      gridRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialize GridStack once on mount
  }, []);

  function handleSaveLayout() {
    const grid = gridRef.current;
    if (!grid) return;

    const savedWidgets = grid.save(false) as GridStackWidget[];
    const nextLayout: DashboardWidgetLayout[] = savedWidgets
      .filter(
        (node): node is GridStackWidget & { id: string } =>
          typeof node.id === "string",
      )
      .map((node) => ({
        id: node.id,
        widget: node.id,
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 4,
        h: node.h ?? 3,
      }));

    startTransition(async () => {
      const result = await saveDashboardLayoutAction(nextLayout);
      if (result.success) setSavedAt(new Date());
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag widget headers to move, corners to resize.
        </p>
        <div className="flex items-center gap-2">
          {savedAt ? (
            <span className="text-xs text-muted-foreground">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={handleSaveLayout}
          >
            {pending ? "Saving…" : "Save layout"}
          </Button>
        </div>
      </div>
      <div className="grid-stack" ref={gridElRef} data-testid="dashboard-grid">
        {mountedIds.map((id) => {
          const widget = widgets.find((w) => w.id === id);
          if (!widget) return null;
          return (
            <div key={id} className="grid-stack-item" gs-id={id}>
              <div
                className="grid-stack-item-content"
                ref={(el) => {
                  setPortalContainers((prev) => {
                    if (el) {
                      if (prev[id] === el) return prev;
                      return { ...prev, [id]: el };
                    }
                    if (!(id in prev)) return prev;
                    const rest = { ...prev };
                    delete rest[id];
                    return rest;
                  });
                }}
              />
              {portalContainers[id]
                ? createPortal(
                    <Card className="h-full overflow-auto">
                      <CardHeader className="cursor-move pb-2">
                        <CardTitle className="text-sm">
                          {widget.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>{widget.content}</CardContent>
                    </Card>,
                    portalContainers[id],
                  )
                : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

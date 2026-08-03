"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
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
  // Portal target elements, keyed by widget id. Populated via callback
  // refs (a commit-phase effect), never read during render itself, since
  // reading ref.current inside render is unsafe.
  const [portalContainers, setPortalContainers] = useState<
    Record<string, HTMLDivElement>
  >({});
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // A single stable ref callback (identity never changes across renders,
  // since it has no dependencies) shared by every widget. An inline arrow
  // function passed as `ref` would be a new identity every render, making
  // React tear down and re-attach the ref on every render; since the ref
  // body calls setState, that produced an infinite render loop ("Maximum
  // update depth exceeded"). The widget id is read from the DOM node's
  // own `data-widget-id` attribute (set below) rather than captured via a
  // per-id closure, since memoizing one callback per id would mean
  // reading a ref during render to look it up — refs may only be
  // accessed outside of render. React 19 ref callbacks may return a
  // cleanup function (called on unmount instead of invoking the callback
  // again with `null`), which lets this stay a single stable function
  // while still capturing `id` correctly for its own cleanup.
  const handlePortalRef = useCallback((el: HTMLDivElement | null) => {
    const id = el?.dataset.widgetId;
    if (!el || !id) return;
    setPortalContainers((prev) =>
      prev[id] === el ? prev : { ...prev, [id]: el },
    );
    return () => {
      setPortalContainers((prev) => {
        if (!(id in prev)) return prev;
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
    };
  }, []);

  // The set of widgets to render, in their saved (or default) grid
  // position, computed synchronously from props so React renders the
  // `.grid-stack-item` DOM nodes up front.
  const mountedWidgets = useMemo(() => {
    const layout =
      initialLayout && initialLayout.length > 0
        ? initialLayout
        : DEFAULT_ORDER(widgets);

    return layout
      .filter((entry) => widgets.some((w) => w.id === entry.widget))
      .map((entry) => ({
        id: entry.widget,
        x: entry.x,
        y: entry.y,
        w: entry.w,
        h: entry.h,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compute once from the initial props, matching the one-time GridStack.init() below
  }, []);

  useEffect(() => {
    if (!gridElRef.current) return;

    // GridStack.init() auto-discovers `.grid-stack-item` children already
    // in the DOM (via their gs-x/gs-y/gs-w/gs-h attributes) and adopts
    // them — it does not create new nodes. Previously this called
    // grid.load(widgetOptions) with placeholder content, which made
    // GridStack synthesize its *own* `.grid-stack-item` elements
    // alongside the ones React was independently rendering from
    // `mountedWidgets`, leaving two competing copies of every widget in
    // the DOM (one correctly sized by GridStack, one inert/collapsed) and
    // the portaled card content mounted into the wrong one.
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

    return () => {
      grid.destroy(false);
      gridRef.current = null;
    };
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
        {mountedWidgets.map(({ id, x, y, w, h }) => {
          const widget = widgets.find((widget) => widget.id === id);
          if (!widget) return null;
          return (
            <div
              key={id}
              className="grid-stack-item"
              gs-id={id}
              gs-x={x}
              gs-y={y}
              gs-w={w}
              gs-h={h}
            >
              <div
                className="grid-stack-item-content"
                data-widget-id={id}
                ref={handlePortalRef}
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

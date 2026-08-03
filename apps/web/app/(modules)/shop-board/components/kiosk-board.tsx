"use client";

import { useEffect, useRef, useState } from "react";
import { FixedSizeList } from "react-window";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "@kostas/ui";
import { useDepartmentStatus } from "@/app/(modules)/department-status/hooks/use-department-status";
import { useFullscreen } from "../hooks/use-fullscreen";
import { flattenStageRows, StageRow } from "./stage-row";

const ROW_HEIGHT = 64;

/**
 * Live kiosk/TV display for the shop floor. Reuses module 13's
 * useDepartmentStatus hook (built on the shared RealtimeProvider,
 * packages/realtime) for its 5s auto-refresh — no separate polling logic
 * here. react-window virtualizes the row list so this scales to hundreds
 * of in-flight production stages without re-rendering the whole board on
 * every refresh.
 */
export function KioskBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(containerRef);
  const { data, isLoading, isError, dataUpdatedAt } = useDepartmentStatus();

  const rows = data ? flattenStageRows(data.departments) : [];

  return (
    <div
      ref={containerRef}
      className="flex h-screen flex-col bg-background text-foreground"
      data-testid="kiosk-board"
    >
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold">Shop Floor — Live Status</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={toggle}>
            {isFullscreen ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </Button>
        </div>
      </header>

      {isError ? (
        <p className="p-6 text-destructive">Failed to load shop status.</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-muted-foreground">
          No active production stages.
        </p>
      ) : (
        <div className="flex-1">
          <AutoSizedList rows={rows} />
        </div>
      )}
    </div>
  );
}

// react-window's FixedSizeList needs an explicit pixel height; a simple
// full-flex wrapper plus window resize listener keeps it filling the
// remaining viewport on a kiosk display of any size.
function AutoSizedList({
  rows,
}: {
  rows: ReturnType<typeof flattenStageRows>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const height = useViewportHeight(wrapperRef);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      {height > 0 ? (
        <FixedSizeList
          height={height}
          width="100%"
          itemCount={rows.length}
          itemSize={ROW_HEIGHT}
          itemData={rows}
        >
          {StageRow}
        </FixedSizeList>
      ) : null}
    </div>
  );
}

function useViewportHeight(ref: React.RefObject<HTMLDivElement | null>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}

"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { useOfflineQueueStore } from "../store/offline-queue";

export function ClockPanel() {
  const enqueue = useOfflineQueueStore((s) => s.enqueue);
  const queue = useOfflineQueueStore((s) => s.queue);
  const [clockedIn, setClockedIn] = useState(false);

  function handleClock() {
    enqueue({
      type: clockedIn ? "clock_out" : "clock_in",
      payload: {},
      occurredAt: new Date(),
    });
    setClockedIn(!clockedIn);
  }

  const pendingClockActions = queue.filter(
    (a) => a.type === "clock_in" || a.type === "clock_out",
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time clock</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          type="button"
          size="lg"
          onClick={handleClock}
          className="w-full"
        >
          {clockedIn ? "Clock out" : "Clock in"}
        </Button>
        {pendingClockActions > 0 ? (
          <p className="text-xs text-muted-foreground">
            {pendingClockActions} clock event
            {pendingClockActions === 1 ? "" : "s"} queued locally.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

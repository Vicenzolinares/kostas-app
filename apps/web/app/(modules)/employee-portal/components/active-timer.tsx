"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@kostas/ui";
import { label, type Language } from "@/lib/i18n";
import { useOfflineQueueStore } from "../store/offline-queue";
import type { EmployeeDashboard } from "../types";

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * The deck's running clock.
 *
 * `openSince` comes from the server's paired clock log, so a reload — or a
 * different tablet — shows the same elapsed time rather than restarting at
 * zero, which is what the previous local-state-only clock panel did.
 *
 * Clock events still go through the offline queue rather than straight to a
 * Server Action: clocking out is exactly the moment the shop's wifi is
 * least reliable, and losing that event costs someone their hours.
 */
export function ActiveTimer({
  data,
  lang,
}: {
  data: EmployeeDashboard;
  lang: Language;
}) {
  const router = useRouter();
  const enqueue = useOfflineQueueStore((state) => state.enqueue);

  // The clock ticks off a `now` in state rather than an elapsed counter, and
  // seeds it from the server's own timestamp so the first client render
  // matches what was sent down — a fresh Date.now() here would differ by the
  // request's flight time and trip a hydration mismatch.
  const [now, setNow] = useState(() => new Date(data.now).getTime());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Optimistic override: the offline queue flushes asynchronously, so the
  // button can't wait for the server to agree before flipping. It's keyed by
  // the server value it was applied over and dropped during render once the
  // server catches up, rather than synced across in an effect.
  const serverKey = data.openSince ? String(data.openSince) : "none";
  const [override, setOverride] = useState<{
    over: string;
    value: Date | null;
  } | null>(null);
  if (override && override.over !== serverKey) setOverride(null);

  const openSince = override
    ? override.value
    : data.openSince
      ? new Date(data.openSince)
      : null;

  function clock(type: "clock_in" | "clock_out") {
    enqueue({ type, payload: {}, occurredAt: new Date() });
    setOverride({
      over: serverKey,
      value: type === "clock_in" ? new Date() : null,
    });
    // Re-read the server's own pairing once the queue has had a moment to
    // flush, so the displayed total reconciles with what was persisted.
    setTimeout(() => router.refresh(), 1500);
  }

  const active = openSince !== null;
  const elapsed = openSince ? Math.max(0, now - openSince.getTime()) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {active ? label("inProgress", lang) : label("notClockedIn", lang)}
        </span>
      </div>

      <p className="font-mono text-4xl font-semibold tabular-nums sm:text-5xl">
        {formatElapsed(elapsed)}
      </p>

      {data.activeTask ? (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">
            {label("workingOn", lang)}
          </p>
          <p className="font-medium">
            {data.activeTask.projectName} — {data.activeTask.clientName}
          </p>
          {data.activeTask.step ? (
            <p className="text-xs text-muted-foreground">
              {lang === "es"
                ? data.activeTask.step.es
                : lang === "en"
                  ? data.activeTask.step.en
                  : `${data.activeTask.step.en} / ${data.activeTask.step.es}`}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {active ? (
          <>
            <Button
              type="button"
              onClick={() => clock("clock_out")}
              variant="outline"
            >
              {label("startBreak", lang)}
            </Button>
            <Button
              type="button"
              onClick={() => clock("clock_out")}
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {label("clockOut", lang)}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={() => clock("clock_in")}>
            {label("clockIn", lang)}
          </Button>
        )}
      </div>
    </div>
  );
}

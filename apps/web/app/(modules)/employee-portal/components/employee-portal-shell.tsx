"use client";

import { SyncStatusBanner } from "./sync-status-banner";
import { ClockPanel } from "./clock-panel";
import { TaskNotePanel } from "./task-note-panel";

export function EmployeePortalShell() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <SyncStatusBanner />
      <ClockPanel />
      <TaskNotePanel />
    </div>
  );
}

import { Badge } from "@kostas/ui";
import { DepartmentBoard } from "@/app/(modules)/department-status/components/department-board";

export default function DepartmentStatusPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Department Status</h1>
        <p className="text-sm text-muted-foreground">
          Live production status across the shop floor.
        </p>
        {/* The RealtimeProvider interface is transport-agnostic; only the
            polling implementation exists today (see packages/realtime). */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Local polling</Badge>
          <span className="text-xs text-muted-foreground">
            Updates are polled on an interval. Production will switch this to
            Supabase Realtime push updates — no page changes needed, only a
            different provider.
          </span>
        </div>
      </div>
      <DepartmentBoard />
    </div>
  );
}

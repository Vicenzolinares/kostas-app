import { Suspense } from "react";
import { listWorkOrders } from "@/app/(modules)/work-orders/api/queries";
import { WorkOrdersTable } from "@/app/(modules)/work-orders/components/work-orders-table";

async function WorkOrdersTableSection() {
  const workOrders = await listWorkOrders();
  return <WorkOrdersTable workOrders={workOrders} />;
}

export default function WorkOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Work Orders</h1>
        <p className="text-sm text-muted-foreground">
          Generate and track shop-floor work orders through completion.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading work orders…</p>}>
        <WorkOrdersTableSection />
      </Suspense>
    </div>
  );
}

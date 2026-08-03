import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kostas/ui";
import { getHardwareById, listScanEvents } from "@/app/(modules)/hardware-inventory/api/queries";
import { StockBadge } from "@/app/(modules)/hardware-inventory/components/stock-badge";
import { HardwareFormDialog } from "@/app/(modules)/hardware-inventory/components/hardware-form-dialog";

async function HardwareDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getHardwareById(id);
  if (!item) notFound();
  const events = await listScanEvents(item.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">SKU {item.sku}</p>
        </div>
        <HardwareFormDialog item={item} trigger={<Button variant="outline">Edit</Button>} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <p className="text-lg font-medium">
            {item.quantity} {item.unit}
          </p>
          <StockBadge item={item} />
          <p className="text-sm text-muted-foreground">Reorder at {item.reorderThreshold}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent scan events</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scan events yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                <span className="capitalize">{event.type.replace("_", " ")}</span>
                <span className={event.quantityDelta >= 0 ? "text-emerald-600" : "text-destructive"}>
                  {event.quantityDelta >= 0 ? "+" : ""}
                  {event.quantityDelta}
                </span>
                <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// See work-orders/[id]/page.tsx for why this placeholder param exists —
// Cache Components requires at least one static param for a dynamic
// segment; dynamicParams defaults to true so every other :id still
// renders on-demand.
export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export default function HardwareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading item…</p>}>
      <HardwareDetail params={params} />
    </Suspense>
  );
}

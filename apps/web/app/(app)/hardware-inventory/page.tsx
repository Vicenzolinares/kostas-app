import { Suspense } from "react";
import { listHardware } from "@/app/(modules)/hardware-inventory/api/queries";
import { HardwareTable } from "@/app/(modules)/hardware-inventory/components/hardware-table";

async function HardwareTableSection() {
  const items = await listHardware();
  return <HardwareTable items={items} />;
}

export default function HardwareInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hardware Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track legs, fasteners, springs, and other hardware by barcode or QR code.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading hardware…</p>}>
        <HardwareTableSection />
      </Suspense>
    </div>
  );
}

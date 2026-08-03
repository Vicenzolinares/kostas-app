import { Suspense } from "react";
import { listFabrics } from "@/app/(modules)/fabric-inventory/api/queries";
import { FabricGrid } from "@/app/(modules)/fabric-inventory/components/fabric-grid";
import { FabricFormDialog } from "@/app/(modules)/fabric-inventory/components/fabric-form-dialog";

async function FabricInventorySection() {
  const fabrics = await listFabrics();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FabricFormDialog />
      </div>
      <FabricGrid fabrics={fabrics} />
    </div>
  );
}

export default function FabricInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Fabric Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Large-dataset fabric stock, powered by AG Grid Community.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading fabrics…</p>
        }
      >
        <FabricInventorySection />
      </Suspense>
    </div>
  );
}

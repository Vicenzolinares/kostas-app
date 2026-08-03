import { Suspense } from "react";
import { listItems } from "@/app/(modules)/items-inventory/api/queries";
import { ItemsTable } from "@/app/(modules)/items-inventory/components/items-table";
import { ItemFormDialog } from "@/app/(modules)/items-inventory/components/item-form-dialog";
import { WarehouseMap } from "@/app/(modules)/items-inventory/components/warehouse-map";

async function ItemsInventorySection() {
  const items = await listItems();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ItemFormDialog />
      </div>
      <ItemsTable items={items} />
      <div>
        <h2 className="mb-2 text-lg font-medium">Warehouse map</h2>
        <WarehouseMap items={items} />
      </div>
    </div>
  );
}

export default function ItemsInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Items &amp; Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Manage warehouse stock, bin assignment, and reorder thresholds.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading inventory…</p>
        }
      >
        <ItemsInventorySection />
      </Suspense>
    </div>
  );
}

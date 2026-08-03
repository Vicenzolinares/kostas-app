import { Badge } from "@kostas/ui";
import type { HardwareInventory } from "../types";

export function StockBadge({ item }: { item: Pick<HardwareInventory, "quantity" | "reorderThreshold"> }) {
  if (item.quantity <= 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }
  if (item.quantity <= item.reorderThreshold) {
    return <Badge variant="secondary">Low stock</Badge>;
  }
  return <Badge variant="outline">In stock</Badge>;
}

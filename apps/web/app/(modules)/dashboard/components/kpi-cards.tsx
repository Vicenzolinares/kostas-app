import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";

interface KpiCardsProps {
  totalProjects: number;
  lowStockItems: number;
  totalFabricYards: number;
}

export function KpiCards({
  totalProjects,
  lowStockItems,
  totalFabricYards,
}: KpiCardsProps) {
  const items: { label: string; value: string }[] = [
    { label: "Total projects", value: totalProjects.toLocaleString() },
    { label: "Low-stock items", value: lowStockItems.toLocaleString() },
    {
      label: "Fabric yards in stock",
      value: totalFabricYards.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

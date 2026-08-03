import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@kostas/ui";
import { getMonthlyRevenue } from "@/app/(modules)/finance/api/queries";
import { RevenueChart } from "@/app/(modules)/finance/components/revenue-chart";

async function RevenueSection() {
  const data = await getMonthlyRevenue();
  return <RevenueChart data={data} />;
}

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finance</h1>
          <p className="text-sm text-muted-foreground">Revenue overview, invoices, and transactions.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/transactions">
            <Button variant="outline">Transactions</Button>
          </Link>
          <Link href="/finance/invoices">
            <Button variant="outline">Invoices</Button>
          </Link>
        </div>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading revenue…</p>}>
        <RevenueSection />
      </Suspense>
    </div>
  );
}

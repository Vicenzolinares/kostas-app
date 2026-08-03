import { Suspense } from "react";
import { listTransactions } from "@/app/(modules)/finance/api/queries";
import { TransactionsTable } from "@/app/(modules)/finance/components/transactions-table";

async function TransactionsSection() {
  const transactions = await listTransactions();
  return <TransactionsTable transactions={transactions} />;
}

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">All payments, refunds, and adjustments.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading transactions…</p>}>
        <TransactionsSection />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { listInvoices } from "@/app/(modules)/finance/api/queries";
import { InvoicesTable } from "@/app/(modules)/finance/components/invoices-table";

async function InvoicesTableSection() {
  const invoices = await listInvoices();
  return <InvoicesTable invoices={invoices} />;
}

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">Create and track client invoices.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading invoices…</p>}>
        <InvoicesTableSection />
      </Suspense>
    </div>
  );
}

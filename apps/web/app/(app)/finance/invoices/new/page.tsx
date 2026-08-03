import { Suspense } from "react";
import { InvoiceForm } from "@/app/(modules)/finance/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New invoice</h1>
        <p className="text-sm text-muted-foreground">Add line items and generate a new invoice.</p>
      </div>
      {/* react-hook-form's useFieldArray calls crypto.randomUUID() for
          field keys, which Cache Components treats as non-deterministic
          request-time work requiring a Suspense boundary. */}
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading form…</p>}>
        <InvoiceForm />
      </Suspense>
    </div>
  );
}

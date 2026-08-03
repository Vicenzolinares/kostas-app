import { InvoiceForm } from "@/app/(modules)/finance/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New invoice</h1>
        <p className="text-sm text-muted-foreground">Add line items and generate a new invoice.</p>
      </div>
      <InvoiceForm />
    </div>
  );
}

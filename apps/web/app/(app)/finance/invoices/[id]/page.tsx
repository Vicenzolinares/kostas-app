import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { getInvoiceById } from "@/app/(modules)/finance/api/queries";
import { InvoiceStatusBadge } from "@/app/(modules)/finance/components/invoice-status-badge";
import { InvoicePdfButton } from "@/app/(modules)/finance/components/invoice-pdf-button";
import { PayInvoiceButton } from "@/app/(modules)/finance/components/pay-invoice-button";
import { TransactionsTable } from "@/app/(modules)/finance/components/transactions-table";
import { paymentProvider } from "@/lib/payments";

async function InvoiceDetail({ id }: { id: string }) {
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const amountDue = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          <InvoicePdfButton
            document={{
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              clientName: invoice.clientName,
              clientEmail: invoice.clientEmail,
              lineItems: invoice.lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
              subtotal: invoice.subtotal,
              taxRate: invoice.taxRate,
              taxAmount: invoice.taxAmount,
              total: invoice.total,
              dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
              notes: invoice.notes,
              createdAt: new Date(invoice.createdAt),
            }}
          />
          {amountDue > 0 ? (
            <PayInvoiceButton
              invoiceId={invoice.id}
              amount={amountDue}
              paymentsConfigured={paymentProvider.isConfigured}
            />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {invoice.lineItems.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-border py-1 last:border-0">
              <span>{item.description}</span>
              <span>
                {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="mt-2 flex flex-col items-end gap-1">
            <p>Subtotal: ${Number(invoice.subtotal).toFixed(2)}</p>
            <p>Tax: ${Number(invoice.taxAmount).toFixed(2)}</p>
            <p className="font-medium">Total: ${Number(invoice.total).toFixed(2)}</p>
            <p className="text-muted-foreground">Paid: ${Number(invoice.amountPaid).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={invoice.transactions} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading invoice…</p>}>
      <InvoiceDetail id={id} />
    </Suspense>
  );
}

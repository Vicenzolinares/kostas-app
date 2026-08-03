import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, transactions, invoices } from "@kostas/database";
import { PaymentConfigurationError } from "@kostas/shared/payments";
import { paymentProvider } from "@/lib/payments";

/**
 * Stripe webhook receiver. Returns 503 (not 500) when Stripe isn't
 * configured, since that's an expected local-dev state rather than a
 * server error. Configure this endpoint's URL as the webhook destination
 * in the Stripe dashboard once STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
 * are set — see docs/PROGRESS.md.
 */
export async function POST(request: NextRequest) {
  if (!paymentProvider.isConfigured) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = paymentProvider.constructWebhookEvent(payload, signature);

    if (event.paymentIntentId && event.status) {
      const status =
        event.type === "payment_intent.succeeded"
          ? "succeeded"
          : event.type === "payment_intent.payment_failed"
            ? "failed"
            : event.type === "payment_intent.canceled"
              ? "canceled"
              : "pending";

      const [updated] = await db
        .update(transactions)
        .set({ status })
        .where(eq(transactions.stripePaymentIntentId, event.paymentIntentId))
        .returning({ invoiceId: transactions.invoiceId, amount: transactions.amount });

      if (updated?.invoiceId && status === "succeeded") {
        await db
          .update(invoices)
          .set({ status: "paid", amountPaid: updated.amount, updatedAt: new Date() })
          .where(eq(invoices.id, updated.invoiceId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof PaymentConfigurationError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@kostas/ui";
import {
  createPaymentIntentAction,
  recordDemoPaymentAction,
} from "../api/actions";

interface PayInvoiceButtonProps {
  invoiceId: string;
  amount: number;
  paymentsConfigured: boolean;
}

/**
 * Payment controls for an invoice with an outstanding balance.
 *
 * With Stripe configured, this kicks off a PaymentIntent for the invoice
 * total. A full Stripe Elements checkout form is out of scope here; this
 * creates the intent and surfaces the client secret, which a payment
 * element could mount against.
 *
 * Without STRIPE_SECRET_KEY, real collection stays disabled and a
 * clearly-labelled demo action records a local simulated payment instead —
 * see recordDemoPaymentAction and docs/PHASE_1_DEMO_STATUS.md.
 */
export function PayInvoiceButton({
  invoiceId,
  amount,
  paymentsConfigured,
}: PayInvoiceButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Stripe unconfigured: real collection stays disabled, but the demo
  // action lets the invoice lifecycle (sent -> partially paid -> paid) be
  // walked through locally. Rows it writes are labelled as demo payments.
  if (!paymentsConfigured) {
    function handleDemoPay() {
      setMessage(null);
      startTransition(async () => {
        const result = await recordDemoPaymentAction({ invoiceId, amount });
        if (result.success) {
          setMessage(
            "Demo payment recorded locally — no Stripe charge was made.",
          );
          router.refresh();
        } else {
          setMessage(result.error ?? "Failed to record demo payment.");
        }
      });
    }

    return (
      <div className="flex flex-col gap-2" data-testid="pay-invoice-demo">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDemoPay}
            disabled={pending}
          >
            {pending ? "Recording…" : "Record demo payment"}
          </Button>
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          >
            Demo Mode — Stripe not connected
          </Badge>
        </div>
        <Button type="button" disabled>
          Pay with Stripe
        </Button>
        <p className="text-xs text-muted-foreground">
          Real card collection needs STRIPE_SECRET_KEY. The demo action
          simulates a successful payment locally and records it as demo data —
          no money moves and no Stripe object is created.
        </p>
        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}
      </div>
    );
  }

  function handlePay() {
    setMessage(null);
    startTransition(async () => {
      const result = await createPaymentIntentAction({ invoiceId, amount });
      setMessage(
        result.success
          ? "Payment intent created — complete checkout with Stripe Elements."
          : (result.error ?? "Failed to start payment."),
      );
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" onClick={handlePay} disabled={pending}>
        {pending ? "Starting…" : "Pay with Stripe"}
      </Button>
      {message ? (
        <p className="text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@kostas/ui";
import { createPaymentIntentAction } from "../api/actions";

interface PayInvoiceButtonProps {
  invoiceId: string;
  amount: number;
  paymentsConfigured: boolean;
}

/**
 * Kicks off a Stripe PaymentIntent for the invoice total. Disabled with a
 * clear message when Stripe isn't configured (no STRIPE_SECRET_KEY) — see
 * docs/PROGRESS.md for what's needed to go live. A full Stripe Elements
 * checkout form is out of scope here; this creates the PaymentIntent and
 * surfaces the client secret, which a payment element could mount against
 * once a live Stripe account exists.
 */
export function PayInvoiceButton({ invoiceId, amount, paymentsConfigured }: PayInvoiceButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!paymentsConfigured) {
    return (
      <div className="flex flex-col gap-1">
        <Button type="button" disabled>
          Pay with Stripe
        </Button>
        <p className="text-xs text-muted-foreground">
          Payments aren&apos;t configured yet. Set STRIPE_SECRET_KEY to enable.
        </p>
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
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

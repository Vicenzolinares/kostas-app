import "server-only";
import { createPaymentProvider, type PaymentProvider } from "@kostas/shared/payments";

/**
 * The single PaymentProvider instance used across apps/web. Falls back to
 * the null provider (every call throws PaymentConfigurationError) when
 * STRIPE_SECRET_KEY is unset — see packages/shared/src/payments for the
 * abstraction and docs/PROGRESS.md for what's needed to go live.
 */
export const paymentProvider: PaymentProvider = createPaymentProvider({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
});

export interface CreatePaymentIntentParams {
  amount: number; // in the currency's smallest unit (e.g. cents)
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string | null;
  status: string;
}

export interface WebhookEvent {
  type: string;
  paymentIntentId?: string;
  chargeId?: string;
  amount?: number;
  status?: string;
}

/**
 * Abstraction over the Stripe SDK so the app can be built and typechecked
 * without a live Stripe account. The `stripe` implementation reads
 * STRIPE_SECRET_KEY at construction time; when it's unset,
 * `createNullPaymentProvider()` is used instead, which throws a clear
 * PaymentConfigurationError on every call rather than crashing at
 * import/boot time. Mirrors the AuthProvider/StorageProvider pattern in
 * packages/auth and packages/shared/storage.
 */
export interface PaymentProvider {
  readonly isConfigured: boolean;
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  retrievePaymentIntent(id: string): Promise<PaymentIntentResult>;
  /** Verifies and parses an incoming Stripe webhook request body. */
  constructWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent;
}

export class PaymentConfigurationError extends Error {
  constructor(message = "Payments are not configured. Set STRIPE_SECRET_KEY to enable Stripe.") {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

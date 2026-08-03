import Stripe from "stripe";
import {
  PaymentConfigurationError,
  type CreatePaymentIntentParams,
  type PaymentIntentResult,
  type PaymentProvider,
  type WebhookEvent,
} from "./types";

export interface StripePaymentProviderOptions {
  secretKey: string;
  webhookSecret?: string;
}

export class StripePaymentProvider implements PaymentProvider {
  readonly isConfigured = true;
  private readonly stripe: Stripe;
  private readonly webhookSecret?: string;

  constructor(options: StripePaymentProviderOptions) {
    this.stripe = new Stripe(options.secretKey);
    this.webhookSecret = options.webhookSecret;
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });
    return { id: intent.id, clientSecret: intent.client_secret, status: intent.status };
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.retrieve(id);
    return { id: intent.id, clientSecret: intent.client_secret, status: intent.status };
  }

  constructWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent {
    if (!this.webhookSecret) {
      throw new PaymentConfigurationError(
        "STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook signatures.",
      );
    }
    const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    const obj = event.data.object as Stripe.PaymentIntent | Stripe.Charge;

    return {
      type: event.type,
      paymentIntentId: "id" in obj && obj.object === "payment_intent" ? obj.id : undefined,
      chargeId: "id" in obj && obj.object === "charge" ? obj.id : undefined,
      amount: "amount" in obj ? obj.amount : undefined,
      status: "status" in obj ? String(obj.status) : undefined,
    };
  }
}

/**
 * No-op PaymentProvider used when STRIPE_SECRET_KEY is unset (e.g. local
 * dev without a Stripe account). Every method throws
 * PaymentConfigurationError so callers can surface a clear "payments not
 * configured" state instead of the app crashing at startup.
 */
export function createNullPaymentProvider(): PaymentProvider {
  return {
    isConfigured: false,
    async createPaymentIntent() {
      throw new PaymentConfigurationError();
    },
    async retrievePaymentIntent() {
      throw new PaymentConfigurationError();
    },
    constructWebhookEvent() {
      throw new PaymentConfigurationError();
    },
  };
}

export function createPaymentProvider(env: {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}): PaymentProvider {
  if (!env.STRIPE_SECRET_KEY) {
    return createNullPaymentProvider();
  }
  return new StripePaymentProvider({
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  });
}

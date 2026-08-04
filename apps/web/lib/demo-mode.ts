import "server-only";
import { emailProvider } from "./email";
import { paymentProvider } from "./payments";
import { aiVisionProvider } from "./ai-vision";

/**
 * Demo mode for the credential-dependent modules.
 *
 * Each flag is derived from its provider's own `isConfigured`, never from a
 * separate env var. That means demo mode turns itself off the moment real
 * credentials are supplied — there is no second switch to remember, and no
 * way for the app to claim "demo" while actually talking to a live service
 * (or vice versa).
 *
 * Demo mode never fabricates a real-world artifact: no Stripe charge, no
 * outbound SMTP message, no model call. It substitutes clearly-labelled
 * local behaviour so the module can be walked through end to end. Anything
 * it writes is marked as demo data in the database (see DEMO_* constants
 * below) so it can be told apart from real records later.
 */

export const emailDemoMode = !emailProvider.isConfigured;
export const paymentsDemoMode = !paymentProvider.isConfigured;
export const aiVisionDemoMode = !aiVisionProvider.isConfigured;

/** Domain used for locally-generated Message-IDs so demo mail is identifiable. */
export const DEMO_MESSAGE_ID_HOST = "demo.kostas.local";

/** Prefix on transaction descriptions written by the demo payment action. */
export const DEMO_PAYMENT_DESCRIPTION_PREFIX = "[Demo payment]";

/** Shown wherever a module is running against local stand-ins. */
export const DEMO_MODE_LABELS = {
  email: "Demo Mode — Yahoo not connected",
  payments: "Demo Mode — Stripe not connected",
  aiVision: "Demo Mode — AI vision not connected",
} as const;

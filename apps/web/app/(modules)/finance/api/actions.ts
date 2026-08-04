"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, invoices, invoiceLineItems, transactions } from "@kostas/database";
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  createPaymentIntentSchema,
} from "@kostas/shared/schemas";
import { PaymentConfigurationError } from "@kostas/shared/payments";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments";
import {
  paymentsDemoMode,
  DEMO_PAYMENT_DESCRIPTION_PREFIX,
} from "@/lib/demo-mode";
import { nextInvoiceNumber } from "./queries";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  invoiceId?: string;
  clientSecret?: string | null;
}

const WRITE_ROLES = ["admin", "manager"] as const;

async function requireWriteAccess(): Promise<ActionResult | null> {
  try {
    await authProvider.requireRole([...WRITE_ROLES]);
    return null;
  } catch (err) {
    if (err instanceof AuthError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong." };
  }
}

function calculateTotals(
  lineItems: { quantity: number; unitPrice: number }[],
  taxRate: number,
) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const taxAmount = subtotal * taxRate;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

export async function createInvoiceAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const {
    projectId,
    clientName,
    clientEmail,
    taxRate,
    dueDate,
    notes,
    lineItems,
  } = parsed.data;
  const { subtotal, taxAmount, total } = calculateTotals(lineItems, taxRate);
  const invoiceNumber = await nextInvoiceNumber();

  const invoiceId = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        projectId: projectId || null,
        clientName,
        clientEmail: clientEmail || null,
        taxRate: String(taxRate),
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        total: String(total),
        dueDate: dueDate ?? null,
        notes: notes || null,
      })
      .returning({ id: invoices.id });

    if (!invoice) throw new Error("Failed to create invoice.");

    await tx.insert(invoiceLineItems).values(
      lineItems.map((item, index) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        sortOrder: index,
      })),
    );

    return invoice.id;
  });

  revalidatePath("/finance/invoices");
  return { success: true, invoiceId };
}

export async function updateInvoiceStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const parsed = updateInvoiceStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(invoices)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(invoices.id, parsed.data.id));

  revalidatePath("/finance/invoices");
  revalidatePath(`/finance/invoices/${parsed.data.id}`);
  return { success: true };
}

/**
 * Creates a Stripe PaymentIntent for an invoice. When STRIPE_SECRET_KEY
 * isn't set, paymentProvider is the null implementation and this throws
 * PaymentConfigurationError, which we translate into a clear disabled-
 * state error rather than a 500.
 */
export async function createPaymentIntentAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = createPaymentIntentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const intent = await paymentProvider.createPaymentIntent({
      amount: Math.round(parsed.data.amount * 100),
      currency: "usd",
      metadata: { invoiceId: parsed.data.invoiceId },
    });

    await db.insert(transactions).values({
      invoiceId: parsed.data.invoiceId,
      type: "payment",
      status: "pending",
      amount: String(parsed.data.amount),
      stripePaymentIntentId: intent.id,
      description: `Payment intent for invoice ${parsed.data.invoiceId}`,
    });

    return { success: true, clientSecret: intent.clientSecret };
  } catch (err) {
    if (err instanceof PaymentConfigurationError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Failed to create payment intent." };
  }
}

/**
 * Records a locally-simulated payment against an invoice.
 *
 * This exists so the Finance module is walkable end to end without a
 * Stripe account. It deliberately does NOT call Stripe and does NOT
 * impersonate one: no PaymentIntent is created, `stripePaymentIntentId`
 * and `stripeChargeId` stay null, and the transaction description carries
 * a "[Demo payment]" prefix so these rows are trivially distinguishable
 * from real revenue in the database and in reports.
 *
 * Only available while Stripe is unconfigured — once STRIPE_SECRET_KEY
 * exists, real payment collection takes over and this refuses to run, so
 * demo rows can never be written against a live account.
 */
export async function recordDemoPaymentAction(
  input: unknown,
): Promise<ActionResult> {
  const authError = await requireWriteAccess();
  if (authError) return authError;

  if (!paymentsDemoMode) {
    return {
      success: false,
      error:
        "Stripe is configured — use real payment collection instead of the demo action.",
    };
  }

  const parsed = createPaymentIntentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, parsed.data.invoiceId),
  });
  if (!invoice) return { success: false, error: "Invoice not found." };

  if (invoice.status === "void") {
    return {
      success: false,
      error: "This invoice is void and cannot take a payment.",
    };
  }

  const total = Number(invoice.total);
  const alreadyPaid = Number(invoice.amountPaid);
  const outstanding = Math.round((total - alreadyPaid) * 100) / 100;
  if (outstanding <= 0) {
    return { success: false, error: "This invoice is already paid in full." };
  }

  // Never let a demo payment overshoot the balance — an invoice showing
  // more collected than billed would be worse than no demo at all.
  const amount = Math.min(parsed.data.amount, outstanding);
  if (amount <= 0)
    return { success: false, error: "Enter an amount greater than zero." };

  const newPaid = Math.round((alreadyPaid + amount) * 100) / 100;

  await db.insert(transactions).values({
    invoiceId: invoice.id,
    type: "payment",
    status: "succeeded",
    amount: amount.toFixed(2),
    description: `${DEMO_PAYMENT_DESCRIPTION_PREFIX} simulated locally — no Stripe charge`,
  });

  await db
    .update(invoices)
    .set({
      amountPaid: newPaid.toFixed(2),
      status: newPaid >= total ? "paid" : "partially_paid",
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoice.id));

  revalidatePath("/finance");
  revalidatePath("/finance/invoices");
  revalidatePath(`/finance/invoices/${invoice.id}`);
  return { success: true, invoiceId: invoice.id };
}

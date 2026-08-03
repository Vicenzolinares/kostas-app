"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, invoices, invoiceLineItems, transactions } from "@kostas/database";
import { createInvoiceSchema, updateInvoiceStatusSchema, createPaymentIntentSchema } from "@kostas/shared/schemas";
import { PaymentConfigurationError } from "@kostas/shared/payments";
import { AuthError } from "@kostas/auth";
import { authProvider } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments";
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

function calculateTotals(lineItems: { quantity: number; unitPrice: number }[], taxRate: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * taxRate;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

export async function createInvoiceAction(input: unknown): Promise<ActionResult> {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { projectId, clientName, clientEmail, taxRate, dueDate, notes, lineItems } = parsed.data;
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

export async function updateInvoiceStatusAction(input: unknown): Promise<ActionResult> {
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
export async function createPaymentIntentAction(input: unknown): Promise<ActionResult> {
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

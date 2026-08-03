import { z } from "zod";

export const invoiceStatusValues = [
  "draft",
  "sent",
  "paid",
  "partially_paid",
  "overdue",
  "void",
] as const;
export const invoiceStatusSchema = z.enum(invoiceStatusValues);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().nonnegative().default(0),
});
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;

export const createInvoiceSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  clientName: z.string().trim().min(1).max(200),
  clientEmail: z.string().trim().email().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(1).default(0),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  lineItems: z.array(invoiceLineItemSchema).min(1, "Add at least one line item"),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  id: z.string().uuid(),
  status: invoiceStatusSchema,
});
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;

export const invoiceFiltersSchema = z.object({
  status: invoiceStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
});
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;

// Submitted from the invoice detail page to kick off a Stripe PaymentIntent
// (or, when STRIPE_SECRET_KEY is unset, rejected with a clear "payments not
// configured" error surfaced by the PaymentProvider — see packages/shared
// src/payments).
export const createPaymentIntentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().positive(),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const transactionTypeValues = ["payment", "refund", "adjustment"] as const;
export const transactionStatusValues = ["pending", "succeeded", "failed", "canceled"] as const;
export const transactionFiltersSchema = z.object({
  status: z.enum(transactionStatusValues).optional(),
  type: z.enum(transactionTypeValues).optional(),
  search: z.string().trim().max(200).optional(),
});
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

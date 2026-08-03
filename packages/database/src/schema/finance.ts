import { pgTable, pgEnum, uuid, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "partially_paid",
  "overdue",
  "void",
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "date" }),
  notes: text("notes"),
  pdfStorageKey: text("pdf_storage_key"),
  // Stripe linkage. Null until the app actually creates a Stripe object
  // (requires STRIPE_SECRET_KEY at runtime) — see packages/shared payments.
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

export const transactionTypeEnum = pgEnum("transaction_type", [
  "payment",
  "refund",
  "adjustment",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "succeeded",
  "failed",
  "canceled",
]);

// Mirrors Stripe PaymentIntent lifecycle locally so the transactions table
// (and revenue charts) are queryable without calling Stripe on every page
// load. Populated by the Stripe webhook handler; gracefully unused if
// STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are unset (see finance module docs).
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  type: transactionTypeEnum("type").notNull().default("payment"),
  status: transactionStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  description: text("description"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  lineItems: many(invoiceLineItems),
  transactions: many(transactions),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLineItems.invoiceId], references: [invoices.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  invoice: one(invoices, { fields: [transactions.invoiceId], references: [invoices.id] }),
}));

import type { Invoice, InvoiceLineItem, Transaction } from "@kostas/database/schema";

export type { Invoice, InvoiceLineItem, Transaction };

export interface InvoiceWithLineItems extends Invoice {
  lineItems: InvoiceLineItem[];
  transactions: Transaction[];
}

export interface RevenuePoint {
  month: string; // "2026-01"
  revenue: number;
}

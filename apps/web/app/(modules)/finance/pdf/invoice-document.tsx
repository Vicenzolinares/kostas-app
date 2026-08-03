import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 4 },
  section: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#666666" },
  tableHeaderRow: { flexDirection: "row", borderBottom: 1, borderColor: "#333333", paddingVertical: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderBottom: 1, borderColor: "#eeeeee", paddingVertical: 4 },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "right" },
  colPrice: { width: "17.5%", textAlign: "right" },
  colTotal: { width: "17.5%", textAlign: "right" },
  totalsBlock: { marginTop: 12, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 200, marginBottom: 2 },
  grandTotal: { fontWeight: 700, fontSize: 13 },
});

export interface InvoiceDocumentProps {
  invoiceNumber: string;
  status: string;
  clientName: string;
  clientEmail: string | null;
  lineItems: { description: string; quantity: string; unitPrice: string }[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  dueDate: Date | null;
  notes: string | null;
  createdAt: Date;
}

export function InvoiceDocument({
  invoiceNumber,
  status,
  clientName,
  clientEmail,
  lineItems,
  subtotal,
  taxRate,
  taxAmount,
  total,
  dueDate,
  notes,
  createdAt,
}: InvoiceDocumentProps) {
  return (
    <Document title={`Invoice ${invoiceNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Invoice {invoiceNumber}</Text>
            <Text style={styles.subtitle}>Kostas Upholstery</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>Status: {status}</Text>
            <Text style={styles.subtitle}>Issued: {createdAt.toLocaleDateString()}</Text>
            <Text style={styles.subtitle}>Due: {dueDate ? dueDate.toLocaleDateString() : "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bill to</Text>
          <Text>{clientName}</Text>
          {clientEmail ? <Text>{clientEmail}</Text> : null}
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {lineItems.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>${Number(item.unitPrice).toFixed(2)}</Text>
              <Text style={styles.colTotal}>${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.label}>Subtotal</Text>
            <Text>${Number(subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.label}>Tax ({(Number(taxRate) * 100).toFixed(2)}%)</Text>
            <Text>${Number(taxAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.grandTotal}>Total</Text>
            <Text style={styles.grandTotal}>${Number(total).toFixed(2)}</Text>
          </View>
        </View>

        {notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text>{notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

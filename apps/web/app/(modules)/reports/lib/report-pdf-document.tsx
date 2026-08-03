import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportResult } from "../types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, color: "#666666", marginBottom: 16 },
  mockedNotice: { fontSize: 9, color: "#b45309", marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: 6,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  label: { flex: 2 },
  value: { flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: "#111827",
    fontFamily: "Helvetica-Bold",
  },
});

/** Renders a report as a single-page PDF table (Kostas ERP letterhead-lite). */
export function ReportPdfDocument({ report }: { report: ReportResult }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.meta}>
          Generated {new Date(report.generatedAt).toLocaleString()} · Kostas ERP
        </Text>
        {report.isMocked ? (
          <Text style={styles.mockedNotice}>
            Note: this report uses estimated/mocked data pending a dedicated module.
          </Text>
        ) : null}

        <View style={styles.headerRow}>
          <Text style={styles.label}>Label</Text>
          <Text style={styles.value}>Value</Text>
        </View>
        {report.rows.map((row, i) => (
          <View style={styles.row} key={`${row.label}-${i}`}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value.toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.label}>{report.totalLabel}</Text>
          <Text style={styles.value}>{report.total.toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  );
}

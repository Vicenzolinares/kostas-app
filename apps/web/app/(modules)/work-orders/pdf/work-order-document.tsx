import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { WORK_ORDER_TYPE_LABEL } from "../components/status-badge";
import type { WorkOrderType, WorkOrderSpecifications } from "@kostas/shared/schemas";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666666", marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottom: 1, borderColor: "#dddddd", paddingBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#666666" },
  table: { display: "flex", width: "auto" },
  tableRow: { flexDirection: "row", borderBottom: 1, borderColor: "#eeeeee", paddingVertical: 4 },
  tableHeaderRow: { flexDirection: "row", borderBottom: 1, borderColor: "#333333", paddingVertical: 4, fontWeight: 700 },
  colFabric: { width: "50%" },
  colCode: { width: "20%" },
  colYards: { width: "15%" },
  colNotes: { width: "15%" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#999999", textAlign: "center" },
});

export interface WorkOrderDocumentProps {
  orderNumber: string;
  type: WorkOrderType;
  status: string;
  project: { name: string; clientName: string } | null;
  specifications: WorkOrderSpecifications;
  fabrics: { fabricName: string; fabricCode: string; yardsAllocated: string; cutNotes: string | null }[];
  assignedToName: string | null;
  dueDate: Date | null;
  createdAt: Date;
}

export function WorkOrderDocument({
  orderNumber,
  type,
  status,
  project,
  specifications,
  fabrics,
  assignedToName,
  dueDate,
  createdAt,
}: WorkOrderDocumentProps) {
  return (
    <Document title={`Work Order ${orderNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Work Order {orderNumber}</Text>
            <Text style={styles.subtitle}>Kostas Upholstery — {WORK_ORDER_TYPE_LABEL[type]}</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>Status: {status}</Text>
            <Text style={styles.subtitle}>Created: {createdAt.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Project</Text>
            <Text>{project?.name ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client</Text>
            <Text>{project?.clientName ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Furniture pieces</Text>
            <Text>{specifications.furniturePieces?.join(", ") || "—"}</Text>
          </View>
          {specifications.constructionNotes ? (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.label}>Construction notes</Text>
              <Text>{specifications.constructionNotes}</Text>
            </View>
          ) : null}
          {specifications.specialInstructions ? (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.label}>Special instructions</Text>
              <Text>{specifications.specialInstructions}</Text>
            </View>
          ) : null}
        </View>

        {fabrics.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fabrics</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.colFabric}>Fabric</Text>
              <Text style={styles.colCode}>Code</Text>
              <Text style={styles.colYards}>Yards</Text>
              <Text style={styles.colNotes}>Notes</Text>
            </View>
            {fabrics.map((fabric, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.colFabric}>{fabric.fabricName}</Text>
                <Text style={styles.colCode}>{fabric.fabricCode}</Text>
                <Text style={styles.colYards}>{fabric.yardsAllocated}</Text>
                <Text style={styles.colNotes}>{fabric.cutNotes ?? "—"}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Assigned to</Text>
            <Text>{assignedToName ?? "Unassigned"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due date</Text>
            <Text>{dueDate ? dueDate.toLocaleDateString() : "—"}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Generated by Kostas ERP — {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
}

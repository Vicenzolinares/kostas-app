import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { getWorkOrderById } from "@/app/(modules)/work-orders/api/queries";
import { WORK_ORDER_TYPE_LABEL } from "@/app/(modules)/work-orders/components/status-badge";
import { StatusControl } from "@/app/(modules)/work-orders/components/status-control";
import { PdfActions } from "@/app/(modules)/work-orders/components/pdf-actions";

async function WorkOrderDetail({ id }: { id: string }) {
  const workOrder = await getWorkOrderById(id);
  if (!workOrder) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{workOrder.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {WORK_ORDER_TYPE_LABEL[workOrder.type]} for {workOrder.project?.name ?? "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusControl id={workOrder.id} status={workOrder.status} />
          <PdfActions
            workOrderId={workOrder.id}
            document={{
              orderNumber: workOrder.orderNumber,
              type: workOrder.type,
              status: workOrder.status,
              project: workOrder.project,
              specifications: workOrder.specifications,
              fabrics: workOrder.fabrics.map((f) => ({
                fabricName: f.fabric.name,
                fabricCode: f.fabric.fabricCode,
                yardsAllocated: f.yardsAllocated,
                cutNotes: f.cutNotes,
              })),
              assignedToName: workOrder.assignedTo?.name ?? null,
              dueDate: workOrder.dueDate ? new Date(workOrder.dueDate) : null,
              createdAt: new Date(workOrder.createdAt),
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Furniture pieces: </span>
            {workOrder.specifications.furniturePieces?.join(", ") || "—"}
          </p>
          {workOrder.specifications.constructionNotes ? (
            <p className="whitespace-pre-wrap">
              <span className="text-muted-foreground">Construction notes: </span>
              {workOrder.specifications.constructionNotes}
            </p>
          ) : null}
          {workOrder.specifications.specialInstructions ? (
            <p className="whitespace-pre-wrap">
              <span className="text-muted-foreground">Special instructions: </span>
              {workOrder.specifications.specialInstructions}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fabrics ({workOrder.fabrics.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {workOrder.fabrics.length === 0 ? (
            <p className="text-muted-foreground">No fabrics allocated.</p>
          ) : (
            workOrder.fabrics.map((f) => (
              <p key={f.id}>
                {f.fabric.name} ({f.fabric.fabricCode}) — {f.yardsAllocated} yd
                {f.cutNotes ? ` — ${f.cutNotes}` : ""}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Assigned to: </span>
            {workOrder.assignedTo?.name ?? "Unassigned"}
          </p>
          <p>
            <span className="text-muted-foreground">Due date: </span>
            {workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleDateString() : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading work order…</p>}>
      <WorkOrderDetail id={id} />
    </Suspense>
  );
}

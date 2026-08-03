"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@kostas/ui";
import { WorkOrderDocument, type WorkOrderDocumentProps } from "../pdf/work-order-document";
import { storeWorkOrderPdfKeyAction } from "../api/actions";

interface PdfActionsProps {
  workOrderId: string;
  document: WorkOrderDocumentProps;
}

/**
 * Generates the work order PDF client-side with @react-pdf/renderer,
 * offers a download, and separately supports the browser Print API by
 * opening the rendered PDF in a new tab (from which the user can invoke
 * Ctrl/Cmd+P — @react-pdf/renderer output is a real PDF, so native print
 * dialogs work without any extra plumbing).
 */
export function PdfActions({ workOrderId, document }: PdfActionsProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateBlob() {
    setPending(true);
    setError(null);
    try {
      const instance = pdf(<WorkOrderDocument {...document} />);
      const blob = await instance.toBlob();
      return blob;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF.");
      return null;
    } finally {
      setPending(false);
    }
  }

  async function handleDownload() {
    const blob = await generateBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.orderNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);

    // Upload alongside the download so the storage key is persisted for
    // later retrieval (e.g. attaching to an email or reprinting).
    try {
      const formData = new FormData();
      formData.set("file", blob, `${document.orderNumber}.pdf`);
      const res = await fetch(`/api/work-orders/${workOrderId}/pdf`, { method: "POST", body: formData });
      if (res.ok) {
        const { key } = await res.json();
        await storeWorkOrderPdfKeyAction(workOrderId, key);
      }
    } catch {
      // Non-fatal — the user still has their download.
    }
  }

  async function handlePrint() {
    const blob = await generateBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    // Most browsers auto-show the print-ready PDF viewer; nudge print()
    // once it has loaded for browsers that support triggering it directly.
    win?.addEventListener("load", () => win.print());
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleDownload} disabled={pending}>
          {pending ? "Generating…" : "Download PDF"}
        </Button>
        <Button type="button" variant="outline" onClick={handlePrint} disabled={pending}>
          Print
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

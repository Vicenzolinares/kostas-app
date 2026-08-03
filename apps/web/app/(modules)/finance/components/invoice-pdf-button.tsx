"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@kostas/ui";
import { InvoiceDocument, type InvoiceDocumentProps } from "../pdf/invoice-document";

export function InvoicePdfButton({ document }: { document: InvoiceDocumentProps }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const instance = pdf(<InvoiceDocument {...document} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${document.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" onClick={handleDownload} disabled={pending}>
        {pending ? "Generating…" : "Download PDF"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@kostas/ui";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// CDN worker avoids needing an .npmrc public-hoist-pattern for pdfjs-dist
// (the "import worker" approach react-pdf recommends needs that hoist
// under pnpm's strict node_modules). `canvas` (a peer react-pdf/pdfjs-dist
// otherwise resolves to under Node) is aliased away for Turbopack in
// next.config.ts, per react-pdf's own Turbopack setup instructions — no
// webpack config needed.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div className="flex flex-col items-center gap-3">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={<p className="text-sm text-muted-foreground">Loading PDF…</p>}
        error={<p className="text-sm text-destructive">Failed to load PDF.</p>}
      >
        <Page pageNumber={pageNumber} width={640} />
      </Document>
      {numPages && numPages > 1 ? (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

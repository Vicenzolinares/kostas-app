"use client";

import { useEffect, useId, useRef, useState } from "react";

interface QrScannerProps {
  onDecode: (text: string) => void;
  active: boolean;
}

/**
 * QR code scanning via html5-qrcode, used for hardware items tagged with
 * QR labels (e.g. bulk bins). Kept as a separate component from
 * BarcodeScanner (zxing-js) since html5-qrcode owns its own DOM element
 * and lifecycle rather than a <video> ref.
 */
export function QrScanner({ onDecode, active }: QrScannerProps) {
  const elementId = useId().replace(/:/g, "");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => onDecode(decodedText),
          () => {
            // Per-frame "no QR found" callback — expected, ignore.
          },
        )
        .catch((err: Error) => {
          if (!cancelled) setError(err.message ?? "Could not access camera.");
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().catch(() => undefined).finally(() => scanner.clear());
      }
      scannerRef.current = null;
    };
  }, [active, elementId, onDecode]);

  if (!active) return null;

  return (
    <div className="flex flex-col gap-2">
      <div id={elementId} className="w-full max-w-md overflow-hidden rounded-md border border-border" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

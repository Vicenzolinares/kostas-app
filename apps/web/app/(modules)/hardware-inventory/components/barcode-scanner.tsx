"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Button } from "@kostas/ui";

interface BarcodeScannerProps {
  /** Called with the decoded text every time a barcode is successfully read. */
  onDecode: (text: string) => void;
  active: boolean;
}

/**
 * 1D barcode scanning via zxing-js (@zxing/browser + @zxing/library), used
 * for hardware items with printed barcodes. Runs entirely client-side
 * against the device camera — no server round-trip to decode.
 */
export function BarcodeScanner({ onDecode, active }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active || !videoRef.current) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (cancelled) return;
        if (result) {
          onDecode(result.getText());
        }
        // NotFoundException fires continuously between successful reads —
        // only surface unexpected errors.
        if (err && err.name !== "NotFoundException") {
          setError(err.message);
        }
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setReady(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message ?? "Could not access camera.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setReady(false);
    };
  }, [active, onDecode]);

  if (!active) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-border bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {!ready && !error ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white">
            Starting camera…
          </p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function BarcodeScannerToggle({
  scanning,
  onToggle,
}: {
  scanning: boolean;
  onToggle: () => void;
}) {
  return (
    <Button type="button" variant="outline" onClick={onToggle}>
      {scanning ? "Stop camera" : "Scan barcode"}
    </Button>
  );
}

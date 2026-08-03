"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@kostas/ui";
import { scanHardwareSchema, type ScanHardwareInput } from "@kostas/shared/schemas";
import { BarcodeScanner } from "./barcode-scanner";
import { QrScanner } from "./qr-scanner";
import { applyHardwareScanAction } from "../api/actions";

type ScanMode = "barcode" | "qr" | null;

const EVENT_LABEL: Record<ScanHardwareInput["type"], string> = {
  scan_in: "Scan in (+)",
  scan_out: "Scan out (-)",
  adjustment: "Adjustment",
};

export function ScanWorkflow() {
  const [mode, setMode] = useState<ScanMode>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const lastDecodedRef = useRef<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<ScanHardwareInput>({
    resolver: zodResolver(scanHardwareSchema),
    defaultValues: { type: "scan_in", quantityDelta: 1 },
  });

  const type = watch("type");

  const handleDecode = useCallback(
    (text: string) => {
      // Debounce repeat frames decoding the same code while the camera stays open.
      if (text === lastDecodedRef.current) return;
      lastDecodedRef.current = text;
      setValue("code", text);
      setMode(null);
    },
    [setValue],
  );

  function onSubmit(values: ScanHardwareInput) {
    setResult(null);
    const formData = new FormData();
    formData.set("code", values.code);
    formData.set("type", values.type);
    formData.set("quantityDelta", String(values.quantityDelta));
    if (values.note) formData.set("note", values.note);

    startTransition(async () => {
      const res = await applyHardwareScanAction({ success: false }, formData);
      if (res.success) {
        setResult({ success: true, message: "Stock updated." });
        reset({ type: values.type, quantityDelta: 1, code: "" });
        lastDecodedRef.current = "";
      } else {
        setResult({ success: false, message: res.error ?? "Scan failed." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan a code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "barcode" ? "default" : "outline"}
              onClick={() => setMode(mode === "barcode" ? null : "barcode")}
            >
              {mode === "barcode" ? "Stop barcode scan" : "Scan barcode"}
            </Button>
            <Button
              type="button"
              variant={mode === "qr" ? "default" : "outline"}
              onClick={() => setMode(mode === "qr" ? null : "qr")}
            >
              {mode === "qr" ? "Stop QR scan" : "Scan QR code"}
            </Button>
          </div>
          <BarcodeScanner active={mode === "barcode"} onDecode={handleDecode} />
          <QrScanner active={mode === "qr"} onDecode={handleDecode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply stock change</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Scanned code</Label>
              <Input id="code" placeholder="Scan or type a barcode/SKU" {...register("code")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Event type</Label>
                <Select value={type} onValueChange={(value) => setValue("type", value as ScanHardwareInput["type"])}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantityDelta">Quantity</Label>
                <Input id="quantityDelta" type="number" {...register("quantityDelta")} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" rows={2} {...register("note")} />
            </div>
            {result ? (
              <p className={result.success ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
                {result.message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Applying…" : "Apply"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

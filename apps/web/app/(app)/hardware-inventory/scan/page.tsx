import { ScanWorkflow } from "@/app/(modules)/hardware-inventory/components/scan-workflow";

export default function HardwareScanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Scan hardware</h1>
        <p className="text-sm text-muted-foreground">
          Use your device camera to scan a barcode or QR code and adjust stock.
        </p>
      </div>
      <ScanWorkflow />
    </div>
  );
}

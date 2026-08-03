import { NextResponse, type NextRequest } from "next/server";
import { authProvider } from "@/lib/auth";
import { storageProvider } from "@/lib/storage";

/**
 * Accepts the PDF blob generated client-side by @react-pdf/renderer
 * (see work-orders/components/pdf-actions.tsx) and persists it through
 * the StorageProvider so it can be re-downloaded later without
 * regenerating. The generation itself always happens in the browser —
 * this route only stores the result.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authProvider.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await storageProvider.upload(buffer, {
    folder: `work-orders/${id}`,
    fileName: file.name || "work-order.pdf",
    contentType: "application/pdf",
  });

  return NextResponse.json({ key: result.key, url: result.url });
}

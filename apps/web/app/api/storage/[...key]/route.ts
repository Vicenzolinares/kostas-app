import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.env.STORAGE_ROOT_DIR
  ? path.resolve(process.cwd(), process.env.STORAGE_ROOT_DIR)
  : path.resolve(process.cwd(), ".local-storage");

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Serves files written by the local StorageProvider (packages/shared).
 * Only used in local dev — swapping to Supabase Storage means files are
 * served directly from the bucket's public URL instead of through this
 * route.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const relativePath = key.join("/");

  // Guard against path traversal outside the storage root.
  const resolved = path.resolve(ROOT_DIR, relativePath);
  if (!resolved.startsWith(ROOT_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const file = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(file), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

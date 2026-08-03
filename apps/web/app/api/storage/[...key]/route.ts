import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authProvider } from "@/lib/auth";

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

// Serves files written by the local StorageProvider (packages/shared).
// Only used in local dev — swapping to Supabase Storage means files are
// served directly from the bucket's public URL instead of through this
// route. Auth-gated: these files (work order PDFs, photo uploads, design
// files) aren't meant to be publicly fetchable.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const session = await authProvider.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

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
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

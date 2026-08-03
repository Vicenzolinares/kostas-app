import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.env.STORAGE_ROOT_DIR
  ? path.resolve(process.env.STORAGE_ROOT_DIR)
  : path.resolve(process.cwd(), ".local-storage");

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Serves files uploaded via the local StorageProvider. Swapping to the
// Supabase Storage provider later removes the need for this route (files
// are served directly from the bucket's public URL).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;

  // Guard against path traversal outside the storage root.
  const relativePath = path.normalize(path.join(...key));
  if (relativePath.startsWith("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const absolutePath = path.join(ROOT_DIR, relativePath);

  try {
    const data = await readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

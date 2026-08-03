import { randomUUID } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, UploadOptions, UploadResult } from "./types";

export interface LocalStorageProviderOptions {
  /** Absolute path to the directory files are written under. */
  rootDir: string;
  /** URL prefix used to serve files back, e.g. "/api/storage" */
  publicPathPrefix: string;
}

/**
 * Filesystem-backed StorageProvider for local development. Swap this for a
 * `supabase` provider implementing the same interface once a Supabase
 * Storage bucket exists (see docs/TECH_STACK.md).
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly options: LocalStorageProviderOptions) {}

  async upload(data: Buffer | Uint8Array, options: UploadOptions): Promise<UploadResult> {
    const ext = path.extname(options.fileName) || "";
    const key = path.posix.join(options.folder, `${randomUUID()}${ext}`);
    const absolutePath = path.join(this.options.rootDir, key);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, data);
    return { key, url: this.getUrl(key) };
  }

  getUrl(key: string): string {
    return `${this.options.publicPathPrefix}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const absolutePath = path.join(this.options.rootDir, key);
    await rm(absolutePath, { force: true });
  }
}

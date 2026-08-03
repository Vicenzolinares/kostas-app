export interface UploadOptions {
  /** Logical folder/prefix, e.g. "client-measurements/{projectId}" */
  folder: string;
  /** Original filename, used to derive the stored filename/extension. */
  fileName: string;
  contentType?: string;
}

export interface UploadResult {
  /** Opaque key the provider needs later to resolve/delete the file. */
  key: string;
  /** Publicly resolvable URL (may be relative, e.g. /api/storage/:key). */
  url: string;
}

/**
 * Storage abstraction so the app can start on local-filesystem storage and
 * later swap to Supabase Storage (or S3) with only a new provider
 * implementation — no call-site changes. See docs/TECH_STACK.md.
 */
export interface StorageProvider {
  upload(data: Buffer | Uint8Array, options: UploadOptions): Promise<UploadResult>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

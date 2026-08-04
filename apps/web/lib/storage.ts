import "server-only";
import path from "node:path";
import {
  LocalStorageProvider,
  type StorageProvider,
} from "@kostas/shared/storage";

/**
 * The single StorageProvider instance used across apps/web (work order
 * PDFs, AI photo search uploads, email attachments, invoice PDFs, module
 * 15's photo uploads, module 18's design file uploads). Local filesystem
 * today; swapping to Supabase Storage means constructing that provider
 * here instead — call sites only depend on the StorageProvider interface
 * from @kostas/shared/storage. See docs/TECH_STACK.md for the swap plan.
 */
/**
 * Absolute directory the local provider writes under. Resolved against
 * `process.cwd()`, which is apps/web when Next runs — so STORAGE_ROOT_DIR
 * in the monorepo-root .env must be app-relative (`.local-storage`), not
 * repo-relative. Exported because the demo photo matcher needs to read
 * reference images back off disk, and StorageProvider is a write/serve
 * interface with no read method.
 */
export const STORAGE_ROOT_DIR = process.env.STORAGE_ROOT_DIR
  ? path.resolve(process.cwd(), process.env.STORAGE_ROOT_DIR)
  : path.resolve(process.cwd(), ".local-storage");

export const storageProvider: StorageProvider = new LocalStorageProvider({
  rootDir: STORAGE_ROOT_DIR,
  publicPathPrefix: process.env.STORAGE_PUBLIC_PATH_PREFIX ?? "/api/storage",
});

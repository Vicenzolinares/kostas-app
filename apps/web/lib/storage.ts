import "server-only";
import path from "node:path";
import { LocalStorageProvider, type StorageProvider } from "@kostas/shared/storage";

/**
 * The single StorageProvider instance used across apps/web (work order
 * PDFs, AI photo search uploads, email attachments, invoice PDFs, module
 * 15's photo uploads, module 18's design file uploads). Local filesystem
 * today; swapping to Supabase Storage means constructing that provider
 * here instead — call sites only depend on the StorageProvider interface
 * from @kostas/shared/storage. See docs/TECH_STACK.md for the swap plan.
 */
export const storageProvider: StorageProvider = new LocalStorageProvider({
  rootDir: process.env.STORAGE_ROOT_DIR
    ? path.resolve(process.cwd(), process.env.STORAGE_ROOT_DIR)
    : path.resolve(process.cwd(), ".local-storage"),
  publicPathPrefix: process.env.STORAGE_PUBLIC_PATH_PREFIX ?? "/api/storage",
});

import "server-only";
import path from "node:path";
import { LocalStorageProvider, type StorageProvider } from "@kostas/shared/storage";

/**
 * The single StorageProvider instance used across apps/web (work order
 * PDFs, AI photo search uploads, email attachments, invoice PDFs). Local
 * filesystem today; swapping to Supabase Storage means constructing that
 * provider here instead — call sites only depend on the StorageProvider
 * interface from @kostas/shared/storage.
 */
export const storageProvider: StorageProvider = new LocalStorageProvider({
  rootDir: process.env.STORAGE_ROOT_DIR
    ? path.resolve(process.cwd(), process.env.STORAGE_ROOT_DIR)
    : path.resolve(process.cwd(), ".local-storage"),
  publicPathPrefix: process.env.STORAGE_PUBLIC_PATH_PREFIX ?? "/api/storage",
});

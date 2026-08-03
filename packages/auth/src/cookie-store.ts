/**
 * Minimal cookie-store contract so the auth provider isn't hard-wired to
 * Next.js's `cookies()` API. apps/web supplies a Next-backed implementation
 * (see apps/web/lib/auth.ts); tests can supply an in-memory one.
 */
export interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options: { expires: Date }): void;
  delete(name: string): void;
}

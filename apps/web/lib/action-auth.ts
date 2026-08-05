import "server-only";
import { AuthError } from "@kostas/auth";
import type { UserRole } from "@kostas/shared/schemas";
import { authProvider } from "@/lib/auth";

/**
 * The shape every module's `ActionResult` widens: a failed guard only ever
 * needs to report `success: false` plus a message, and that assigns cleanly
 * to each module's own richer result type.
 */
export interface ActionAuthFailure {
  success: false;
  error: string;
}

/**
 * Role gate for Server Actions, returning a failure result rather than
 * throwing so call sites stay `const denied = await requireWriteAccess(...)
 * ; if (denied) return denied;`.
 *
 * `proxy.ts` also redirects unauthorized users away from role-restricted
 * route prefixes, but that is an optimistic UX check only — a Server Action
 * is a POST endpoint that can be invoked directly, so authorization has to
 * be re-asserted here, next to the data. (Next's own auth guide makes the
 * same point about Proxy not being the only line of defense.)
 *
 * Extracted from the three hand-rolled copies that previously lived in
 * work-orders, hardware-inventory and finance so every module gates the
 * same way and a future change (audit logging, a different provider) lands
 * in one place.
 */
export async function requireWriteAccess(
  roles: readonly UserRole[],
): Promise<ActionAuthFailure | null> {
  try {
    await authProvider.requireRole([...roles]);
    return null;
  } catch (err) {
    if (err instanceof AuthError) return { success: false, error: err.message };
    return { success: false, error: "Something went wrong." };
  }
}

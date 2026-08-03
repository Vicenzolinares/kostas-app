import "server-only";
import { cookies } from "next/headers";
import { db } from "@kostas/database";
import { LocalAuthProvider, type AuthProvider } from "@kostas/auth";

/**
 * The single AuthProvider instance used across apps/web. Swapping to a
 * Supabase-backed provider later means constructing that provider here
 * instead — call sites elsewhere in the app only depend on the
 * AuthProvider interface from @kostas/auth.
 */
export const authProvider: AuthProvider = new LocalAuthProvider({
  db,
  cookies: async () => {
    const store = await cookies();
    return {
      get: (name: string) => store.get(name)?.value,
      set: (name: string, value: string, options: { expires: Date }) =>
        store.set(name, value, {
          expires: options.expires,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        }),
      delete: (name: string) => store.delete(name),
    };
  },
});

import type { UserRole } from "@kostas/shared/schemas";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Session {
  user: SessionUser;
  expiresAt: Date;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

/**
 * Abstraction over "who is signed in and what can they do." The `local`
 * provider (Postgres users table + bcrypt + signed cookie) is the only
 * implementation today. A future `supabase` provider implementing this
 * same interface (backed by Supabase Auth) is meant to be a drop-in swap
 * — see docs/TECH_STACK.md for the env vars that would require.
 */
export interface AuthProvider {
  signIn(params: SignInParams): Promise<Session>;
  signUp(params: SignUpParams): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  /** Throws if there is no session, or the session's role isn't in `roles`. */
  requireRole(roles: UserRole[]): Promise<Session>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_credentials" | "email_taken" | "unauthenticated" | "forbidden",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

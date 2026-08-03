import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Database } from "@kostas/database";
import { users } from "@kostas/database/schema";
import type { UserRole } from "@kostas/shared/schemas";
import type { CookieStore } from "../cookie-store";
import { signSessionToken, verifySessionToken } from "../jwt";
import { AuthError, type AuthProvider, type Session, type SignInParams, type SignUpParams } from "../types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const BCRYPT_ROUNDS = 10;

export interface LocalAuthProviderOptions {
  db: Database;
  cookies: () => Promise<CookieStore> | CookieStore;
  cookieName?: string;
}

/**
 * Postgres-backed AuthProvider: bcrypt-hashed passwords in the `users`
 * table, sessions represented as a signed JWT stored in an HttpOnly
 * cookie (no server-side session table lookup needed to validate).
 */
export class LocalAuthProvider implements AuthProvider {
  private readonly cookieName: string;

  constructor(private readonly options: LocalAuthProviderOptions) {
    this.cookieName = options.cookieName ?? process.env.SESSION_COOKIE_NAME ?? "kostas_session";
  }

  private async cookieStore(): Promise<CookieStore> {
    return this.options.cookies();
  }

  async signUp({ name, email, password, role }: SignUpParams): Promise<Session> {
    const existing = await this.options.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (existing) {
      throw new AuthError("An account with this email already exists.", "email_taken");
    }

    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    const [user] = await this.options.db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role ?? "employee",
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create user.");
    }

    return this.establishSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    });
  }

  async signIn({ email, password }: SignInParams): Promise<Session> {
    const user = await this.options.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (!user) {
      throw new AuthError("Invalid email or password.", "invalid_credentials");
    }
    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthError("Invalid email or password.", "invalid_credentials");
    }
    return this.establishSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    });
  }

  async signOut(): Promise<void> {
    const store = await this.cookieStore();
    store.delete(this.cookieName);
  }

  async getSession(): Promise<Session | null> {
    const store = await this.cookieStore();
    const token = store.get(this.cookieName);
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    return {
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
      // The token's own exp is authoritative; this is informational only.
      expiresAt: new Date(),
    };
  }

  async requireRole(roles: UserRole[]): Promise<Session> {
    const session = await this.getSession();
    if (!session) {
      throw new AuthError("You must be signed in.", "unauthenticated");
    }
    if (roles.length > 0 && !roles.includes(session.user.role)) {
      throw new AuthError("You do not have permission to do this.", "forbidden");
    }
    return session;
  }

  private async establishSession(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }): Promise<Session> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const token = await signSessionToken(
      { sub: user.id, name: user.name, email: user.email, role: user.role },
      expiresAt,
    );
    const store = await this.cookieStore();
    store.set(this.cookieName, token, { expires: expiresAt });
    return { user, expiresAt };
  }
}

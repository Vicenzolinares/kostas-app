import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@kostas/auth/jwt";
import type { SessionTokenPayload } from "@kostas/auth/jwt";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "kostas_session";
const PUBLIC_PATHS = ["/login", "/signup"];

// Role allow-lists per route prefix, checked in declaration order (first
// match wins). Paths not listed here are auth-only (any signed-in role).
// Keep in sync with any `requireRole` calls made server-side within that
// route's actions/queries — this is a fast-path UX redirect, not the only
// enforcement layer.
const ROLE_RESTRICTED_PREFIXES: { prefix: string; roles: SessionTokenPayload["role"][] }[] = [
  { prefix: "/designer-portal", roles: ["admin", "manager", "designer"] },
];

// Runs on the Node.js runtime (the only option for `proxy` in Next 16).
// Guards every app route except the public auth pages and static/API
// asset paths excluded by the matcher below.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const restriction = ROLE_RESTRICTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (restriction && !restriction.roles.includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)",
  ],
};

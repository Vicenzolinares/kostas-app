import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@kostas/auth/jwt";
import type { SessionTokenPayload } from "@kostas/auth/jwt";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "kostas_session";
// /offline: the module 15 PWA's offline fallback page must render without
// a session (the whole point is it's shown when the network — and thus
// auth — is unavailable). /serwist: serves the service worker script
// itself (app/serwist/[path]/route.ts), which the browser fetches before
// any page/cookie context applies.
// /employee-login: the shop-floor kiosk's own sign-in screen (deck p17).
// It has to render before there's a session, same as /login — it lists
// name and role for PIN-enabled accounts only, never email addresses.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/offline",
  "/serwist",
  "/employee-login",
];

// Role allow-lists per route prefix, checked in declaration order (first
// match wins). Paths not listed here are auth-only (any signed-in role).
// Keep in sync with any `requireRole` calls made server-side within that
// route's actions/queries — this is a fast-path UX redirect, not the only
// enforcement layer.
const ROLE_RESTRICTED_PREFIXES: {
  prefix: string;
  roles: SessionTokenPayload["role"][];
}[] = [
  // Office-side view of design submissions.
  { prefix: "/designer-portal", roles: ["admin", "manager"] },
  // External Designer Portal — office staff can look, designers live here.
  { prefix: "/portal", roles: ["admin", "manager", "designer"] },
];

// The `designer` role belongs to external design firms, not staff. They get
// the Designer Portal and nothing else: without this, a designer signing in
// lands on /dashboard with the full office sidebar (finance, emails,
// inventory, every internal module). Office roles are unaffected.
const EXTERNAL_ROLE_HOME = "/portal";
const EXTERNAL_ROLES: SessionTokenPayload["role"][] = ["designer"];

// Runs on the Node.js runtime (the only option for `proxy` in Next 16).
// Guards every app route except the public auth pages and static/API
// asset paths excluded by the matcher below.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // External users are confined to their portal, so this runs before the
  // per-prefix rules below — otherwise every office route would need its
  // own entry in that list to keep designers out.
  const isExternal = EXTERNAL_ROLES.includes(session.role);
  if (
    isExternal &&
    pathname !== EXTERNAL_ROLE_HOME &&
    !pathname.startsWith(`${EXTERNAL_ROLE_HOME}/`)
  ) {
    return NextResponse.redirect(new URL(EXTERNAL_ROLE_HOME, request.url));
  }

  const restriction = ROLE_RESTRICTED_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (restriction && !restriction.roles.includes(session.role)) {
    return NextResponse.redirect(
      new URL(isExternal ? EXTERNAL_ROLE_HOME : "/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  // The trailing `\\..*` exclusion covers files served straight out of
  // /public. Without it the guard runs on asset requests too, so an image
  // on a page that renders before sign-in (the kiosk's logo on
  // /employee-login) gets redirected to /login and silently fails to load —
  // which is exactly how it was found.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|.*\\..*).*)",
  ],
};

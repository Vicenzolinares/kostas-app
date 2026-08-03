export * from "./types";
export * from "./cookie-store";
export * from "./providers/local";
export { verifySessionToken, signSessionToken } from "./jwt";

// Note: `./jwt` is also exported as the standalone subpath `@kostas/auth/jwt`
// so lightweight consumers (e.g. apps/web/proxy.ts) can verify a session
// token without pulling in the local provider's @kostas/database import.

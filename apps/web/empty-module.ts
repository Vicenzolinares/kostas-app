// Turbopack alias target for the optional `canvas` package that
// pdfjs-dist (react-pdf's dependency, used by module 18's PDF viewer)
// tries to resolve in Node environments. The browser build never needs
// it — see react-pdf's own Turbopack setup instructions and
// next.config.ts's `turbopack.resolveAlias`.
export default {};

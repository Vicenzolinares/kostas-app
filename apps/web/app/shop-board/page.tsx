import { KioskBoard } from "@/app/(modules)/shop-board/components/kiosk-board";

// Deliberately outside the (app) route group: the kiosk display is meant
// to run full-bleed on a shop-floor TV, with none of the app shell's
// sidebar/header chrome. Still auth-gated by proxy.ts's default guard
// (this path isn't in PUBLIC_PATHS) — a kiosk device needs a signed-in
// session like any other client.
export default function ShopBoardPage() {
  return <KioskBoard />;
}

import { NextResponse } from "next/server";
import { getDepartmentStatusBoard } from "@/app/(modules)/department-status/api/queries";
import { authProvider } from "@/lib/auth";

// Polled by useRealtimeQuery (packages/realtime/react.tsx) from both the
// module 13 dashboard and the module 16 kiosk board. Kept as a route
// handler (rather than a server action) because it's a plain GET that
// needs to be fetchable from a TanStack Query `queryFn`.
export async function GET() {
  const session = await authProvider.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const board = await getDepartmentStatusBoard();
  return NextResponse.json(board);
}

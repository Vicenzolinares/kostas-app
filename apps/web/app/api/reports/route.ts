import { NextResponse } from "next/server";
import { reportFiltersSchema } from "@kostas/shared/schemas";
import { runReport } from "@/app/(modules)/reports/api/queries";
import { authProvider } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await authProvider.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = reportFiltersSchema.safeParse({
    type: searchParams.get("type"),
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report filters." }, { status: 400 });
  }

  const report = await runReport(parsed.data);
  return NextResponse.json(report);
}

import { NextResponse } from "next/server";
import { syncEmployeeActionsSchema } from "@kostas/shared/schemas";
import { syncEmployeeActions } from "@/app/(modules)/employee-portal/api/actions";
import { authProvider } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await authProvider.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = syncEmployeeActionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sync payload." },
      { status: 400 },
    );
  }

  const result = await syncEmployeeActions(session.user.id, parsed.data);
  return NextResponse.json(result);
}

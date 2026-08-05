import { Suspense } from "react";
import { redirect } from "next/navigation";
import { authProvider } from "@/lib/auth";
import { getEmployeeDashboard } from "@/app/(modules)/employee-portal/api/queries";
import { PortalDashboard } from "@/app/(modules)/employee-portal/components/portal-dashboard";

async function PortalSection() {
  const session = await authProvider.getSession();
  // The route group is already auth-gated by proxy.ts; this is here so the
  // dashboard query never has to accept a null user.
  if (!session) redirect("/employee-login");

  const data = await getEmployeeDashboard({
    id: session.user.id,
    name: session.user.name,
  });

  return (
    <PortalDashboard
      data={data}
      user={{ name: session.user.name, role: session.user.role }}
    />
  );
}

export default function EmployeePortalPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading your day…</p>
      }
    >
      <PortalSection />
    </Suspense>
  );
}

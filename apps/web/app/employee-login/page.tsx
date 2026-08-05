import { Suspense } from "react";
import { listKioskEmployees } from "@/app/(modules)/employee-portal/api/queries";
import { KioskLogin } from "@/app/(modules)/employee-portal/components/kiosk-login";

/**
 * The shop tablet's sign-in screen (deck p17): pick your name off a grid,
 * then enter a 4-digit PIN.
 *
 * Public by necessity — it's what an unauthenticated wall-mounted tablet
 * shows — so it lists only name and role for accounts that have a PIN, and
 * never the email addresses those accounts sign in with elsewhere. Office
 * accounts have no PIN and so never appear here at all.
 */
async function KioskLoginSection() {
  const employees = await listKioskEmployees();
  return <KioskLogin employees={employees} />;
}

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#101a33]" />}>
      <KioskLoginSection />
    </Suspense>
  );
}

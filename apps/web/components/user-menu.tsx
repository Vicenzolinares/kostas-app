import { authProvider } from "@/lib/auth";
import { signOutAction } from "@/app/(app)/actions";
import { UserMenuShell } from "@/components/user-menu-shell";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  designer: "Designer",
  shop_floor: "Shop Floor",
  employee: "Employee",
};

/** Initials for the avatar chip — "Victoria Alvarez" -> "VA". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function UserMenu() {
  const session = await authProvider.getSession();
  if (!session) return null;

  return (
    <UserMenuShell
      name={session.user.name}
      roleLabel={ROLE_LABEL[session.user.role] ?? session.user.role}
      initials={initials(session.user.name)}
      signOut={signOutAction}
    />
  );
}

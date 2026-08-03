import { authProvider } from "@/lib/auth";
import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@kostas/ui";

export async function UserMenu() {
  const session = await authProvider.getSession();
  if (!session) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right text-sm">
        <p className="font-medium leading-none">{session.user.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{session.user.role}</p>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}

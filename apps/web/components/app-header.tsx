import Link from "next/link";
import { Bell, Mail } from "lucide-react";
import { Badge } from "@kostas/ui";
import { authProvider } from "@/lib/auth";
import { navItemsForHref } from "@/lib/nav";
import { countUnread } from "@/app/(modules)/emails/api/queries";
import { UserMenu } from "@/components/user-menu";
import { NewMenu } from "@/components/new-menu";
import { ModuleSearch } from "@/components/module-search";

/**
 * The top bar from the deck: search, "+ New", notification and message
 * icons, then the user badge.
 *
 * Both icon buttons are real links with real counts rather than decoration
 * — the deck shows a bell with an unread dot, and an icon that only means
 * something if it points at actual mail. Each is hidden for roles that
 * can't reach its destination, so the header never offers a route the
 * sidebar has already withheld.
 */
export async function AppHeader() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const role = session.user.role;
  const canSeeEmails = navItemsForHref("/emails", role);
  const canSeeCalendar = navItemsForHref("/calendar", role);
  const unread = canSeeEmails ? await countUnread() : 0;

  return (
    <div className="flex flex-1 items-center gap-3">
      <ModuleSearch role={role} />
      <div className="ml-auto flex items-center gap-1.5">
        <NewMenu role={role} />
        {canSeeCalendar ? (
          <Link
            href="/calendar"
            aria-label="Calendar"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="h-4 w-4" />
          </Link>
        ) : null}
        {canSeeEmails ? (
          <Link
            href="/emails"
            aria-label={`Emails${unread ? ` (${unread} unread)` : ""}`}
            className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Mail className="h-4 w-4" />
            {unread > 0 ? (
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[0.6rem] leading-none"
              >
                {unread}
              </Badge>
            ) : null}
          </Link>
        ) : null}
        <UserMenu />
      </div>
    </div>
  );
}

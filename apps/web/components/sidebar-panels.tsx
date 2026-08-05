import Link from "next/link";
import {
  ChevronDown,
  ClipboardPlus,
  FilePlus2,
  FolderPlus,
  MailPlus,
  PackagePlus,
} from "lucide-react";
import { authProvider } from "@/lib/auth";
import { navItemsForHref } from "@/lib/nav";
import { emailDemoMode, DEMO_MODE_LABELS } from "@/lib/demo-mode";
import { getMailboxSummary } from "@/app/(modules)/dashboard/api/queries";

const CREATE_LINKS = [
  {
    label: "New Project",
    href: "/projects",
    module: "/projects",
    icon: <FolderPlus className="h-3.5 w-3.5" />,
  },
  {
    label: "New Work Order",
    href: "/work-orders/new",
    module: "/work-orders",
    icon: <ClipboardPlus className="h-3.5 w-3.5" />,
  },
  {
    label: "New Item",
    href: "/items-inventory",
    module: "/items-inventory",
    icon: <PackagePlus className="h-3.5 w-3.5" />,
  },
  {
    label: "New Invoice",
    href: "/finance/invoices/new",
    module: "/finance",
    icon: <FilePlus2 className="h-3.5 w-3.5" />,
  },
  {
    label: "New Email",
    href: "/emails/compose",
    module: "/emails",
    icon: <MailPlus className="h-3.5 w-3.5" />,
  },
];

/**
 * The two panels the deck pins under the sidebar nav: the mailbox status
 * card and a Quick Create shortcut list.
 *
 * Reads the session (for role filtering) and the mailbox, so it renders
 * inside the layout's own Suspense boundary like SidebarNav does.
 *
 * The deck's card says "Yahoo Mail Connected · Connected". This one says
 * what is actually true: with no IMAP credentials configured the app has
 * never spoken to Yahoo, and the card reports demo mode rather than a
 * connection that does not exist. `<details>` gives the collapse behaviour
 * the deck's chevron implies without making the sidebar a client component.
 */
export async function SidebarPanels() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const role = session.user.role;
  const links = CREATE_LINKS.filter((link) =>
    navItemsForHref(link.module, role),
  );
  const canSeeMail = navItemsForHref("/emails", role);
  const mailbox = canSeeMail ? await getMailboxSummary() : null;

  return (
    <div className="mt-4 flex flex-col gap-3" data-testid="sidebar-panels">
      {mailbox ? (
        <Link
          href="/emails"
          className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-primary" aria-hidden>
              y!
            </span>
            Yahoo Mail
          </p>
          <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground">
            {mailbox.unread} unread ·{" "}
            {mailbox.lastSyncedAt
              ? `last synced ${mailbox.lastSyncedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
              : "never synced"}
          </p>
          <p
            className={`mt-1.5 flex items-center gap-1 text-[0.65rem] font-medium ${
              emailDemoMode
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${emailDemoMode ? "bg-amber-500" : "bg-emerald-500"}`}
              aria-hidden
            />
            {emailDemoMode ? DEMO_MODE_LABELS.email : "Connected"}
          </p>
        </Link>
      ) : null}

      {links.length > 0 ? (
        <details
          open
          className="rounded-lg border border-border bg-card p-3 [&_svg.chevron]:open:rotate-180"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold">
            Quick Create
            <ChevronDown
              className="chevron h-3.5 w-3.5 text-muted-foreground transition-transform"
              aria-hidden
            />
          </summary>
          <ul className="mt-2 flex flex-col gap-0.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[0.7rem] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="text-primary" aria-hidden>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

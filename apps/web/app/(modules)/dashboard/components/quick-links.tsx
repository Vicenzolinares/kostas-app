import Link from "next/link";
import {
  BarChart3,
  Camera,
  ClipboardPlus,
  FilePlus2,
  FolderPlus,
  PackagePlus,
} from "lucide-react";
import type { UserRole } from "@kostas/shared/schemas";
import { navItemsForHref } from "@/lib/nav";
import { Panel, PanelEmpty } from "./panel";

/**
 * Row 4, right: the deck's Quick Links tile grid.
 *
 * Filtered through the same nav matrix the sidebar and "+ New" menu use, so
 * this never offers a shortcut into a module the signed-in role can't open.
 * Project and Item point at their list pages because both are created from a
 * dialog there — there is no /new route to link to.
 */
const LINKS = [
  {
    label: "New Project",
    href: "/projects",
    module: "/projects",
    icon: <FolderPlus className="h-4 w-4" />,
  },
  {
    label: "New Work Order",
    href: "/work-orders/new",
    module: "/work-orders",
    icon: <ClipboardPlus className="h-4 w-4" />,
  },
  {
    label: "New Invoice",
    href: "/finance/invoices/new",
    module: "/finance",
    icon: <FilePlus2 className="h-4 w-4" />,
  },
  {
    label: "Add Item",
    href: "/items-inventory",
    module: "/items-inventory",
    icon: <PackagePlus className="h-4 w-4" />,
  },
  {
    label: "Upload Photos",
    href: "/photo-search",
    module: "/photo-search",
    icon: <Camera className="h-4 w-4" />,
  },
  {
    label: "View Reports",
    href: "/reports",
    module: "/reports",
    icon: <BarChart3 className="h-4 w-4" />,
  },
];

export function QuickLinks({ role }: { role: UserRole }) {
  const links = LINKS.filter((link) => navItemsForHref(link.module, role));

  return (
    <Panel title="Quick Links" data-testid="dashboard-quick-links">
      {links.length === 0 ? (
        <PanelEmpty>No shortcuts available for your role.</PanelEmpty>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <span className="text-primary" aria-hidden>
                {link.icon}
              </span>
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

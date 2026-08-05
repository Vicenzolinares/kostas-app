"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@kostas/ui";
import { navItemsForHref } from "@/lib/nav";
import type { UserRole } from "@kostas/shared/schemas";

/**
 * The deck's "+ New" button, opening the same shortcuts its Quick Create
 * panel lists. Entries whose module the role can't reach are dropped, so
 * this never routes someone into a page the sidebar withheld.
 *
 * Project and Item open their list page rather than a dedicated route:
 * both are created through a dialog on the list itself, so there is no
 * /new URL to deep-link to.
 */
const CREATE_LINKS = [
  { label: "New Project", href: "/projects", module: "/projects" },
  { label: "New Work Order", href: "/work-orders/new", module: "/work-orders" },
  { label: "New Item", href: "/items-inventory", module: "/items-inventory" },
  { label: "New Invoice", href: "/finance/invoices/new", module: "/finance" },
  { label: "New Email", href: "/emails/compose", module: "/emails" },
];

export function NewMenu({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const links = CREATE_LINKS.filter((link) =>
    navItemsForHref(link.module, role),
  );
  if (links.length === 0) return null;

  return (
    <div className="relative">
      <Button
        size="sm"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="gap-1 rounded-full px-3"
      >
        <Plus className="h-3.5 w-3.5" />
        New
        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
      </Button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
        >
          {links.map((link) => (
            <li key={link.href} role="none">
              <Link
                role="menuitem"
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

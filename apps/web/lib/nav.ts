import type { UserRole } from "@kostas/shared/schemas";

export interface NavItem {
  label: string;
  href: string;
  /**
   * Roles that see this link. Every item declares its own list rather than
   * defaulting to "everyone" — an omitted list is how this sidebar came to
   * show all 18 modules to a shop-floor user in the first place.
   */
  roles: UserRole[];
}

export interface NavSection {
  /** Rendered as a small heading; the primary section is unlabelled, as in the deck. */
  label?: string;
  items: NavItem[];
}

const ALL_OFFICE: UserRole[] = [
  "admin",
  "manager",
  "sales",
  "shop_floor",
  "employee",
];
const OFFICE_LEADERSHIP: UserRole[] = ["admin", "manager"];
const CLIENT_FACING: UserRole[] = ["admin", "manager", "sales"];
const WAREHOUSE: UserRole[] = ["admin", "manager", "shop_floor"];

/**
 * Sidebar structure, ordered to match the mockup deck (p2 onward): the main
 * block is the deck's list verbatim — Dashboard, Projects, Items, Fabrics,
 * Work Orders, Calendar, Finance, Emails, Photo Search, Reports, Settings —
 * with the modules the deck only shows on their own screens gathered into a
 * secondary block below it.
 *
 * `designer` is deliberately absent everywhere: external design firms are
 * redirected to /portal by proxy.ts and never render this sidebar. The entry
 * pointing at the office-side designer view is admin/manager only, matching
 * ROLE_RESTRICTED_PREFIXES in proxy.ts.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", roles: ALL_OFFICE },
      { label: "Projects", href: "/projects", roles: CLIENT_FACING },
      { label: "Items", href: "/items-inventory", roles: WAREHOUSE },
      { label: "Fabrics", href: "/fabric-inventory", roles: WAREHOUSE },
      {
        label: "Project Fabrics",
        href: "/project-fabrics",
        roles: [...CLIENT_FACING, "shop_floor"],
      },
      {
        label: "Work Orders",
        href: "/work-orders",
        roles: [...CLIENT_FACING, "shop_floor"],
      },
      { label: "Calendar", href: "/calendar", roles: ALL_OFFICE },
      { label: "Finance", href: "/finance", roles: OFFICE_LEADERSHIP },
      { label: "Emails", href: "/emails", roles: CLIENT_FACING },
      { label: "Photo Search", href: "/photo-search", roles: CLIENT_FACING },
      { label: "Reports", href: "/reports", roles: OFFICE_LEADERSHIP },
      { label: "Settings", href: "/settings", roles: ALL_OFFICE },
    ],
  },
  {
    label: "Workshop",
    items: [
      {
        label: "Client Measurements",
        href: "/client-measurements",
        roles: CLIENT_FACING,
      },
      {
        label: "Hardware Inventory",
        href: "/hardware-inventory",
        roles: WAREHOUSE,
      },
      {
        label: "Department Status",
        href: "/department-status",
        roles: WAREHOUSE,
      },
      { label: "Shop Board", href: "/shop-board", roles: WAREHOUSE },
      { label: "Employee Portal", href: "/employee-portal", roles: ALL_OFFICE },
      { label: "Project View", href: "/project-view", roles: ALL_OFFICE },
      {
        label: "Designer Portal",
        href: "/designer-portal",
        roles: OFFICE_LEADERSHIP,
      },
    ],
  },
];

/** Flat list, for anything that needs every route rather than the grouping. */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(
  (section) => section.items,
);

/** Whether `role` is allowed the nav entry for `href` — used by header chrome. */
export function navItemsForHref(href: string, role: UserRole): boolean {
  return NAV_ITEMS.some(
    (item) => item.href === href && item.roles.includes(role),
  );
}

/**
 * Sidebar sections for a role, with empty sections dropped.
 *
 * Hiding a link is navigation, not authorization — these routes are still
 * reachable by URL for any signed-in office role. Real enforcement lives in
 * each Server Action's role gate (lib/action-auth.ts). Promoting this matrix
 * to route-level enforcement means feeding it into proxy.ts's
 * ROLE_RESTRICTED_PREFIXES, which changes redirect behaviour for every role
 * at once.
 */
export function navSectionsForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

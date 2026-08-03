export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Client Measurements", href: "/client-measurements" },
  { label: "Items & Inventory", href: "/items-inventory" },
  { label: "Fabric Inventory", href: "/fabric-inventory" },
  { label: "Project Fabrics", href: "/project-fabrics" },
  { label: "Hardware Inventory", href: "/hardware-inventory" },
  { label: "Work Orders", href: "/work-orders" },
  { label: "Calendar", href: "/calendar" },
  { label: "Finance", href: "/finance" },
  { label: "Emails", href: "/emails" },
  { label: "AI Photo Search", href: "/photo-search" },
  { label: "Department Status", href: "/department-status" },
  { label: "Reports", href: "/reports" },
  { label: "Employee Portal", href: "/employee-portal" },
  { label: "Shop Board", href: "/shop-board" },
  { label: "Project View", href: "/project-view" },
  { label: "Designer Portal", href: "/designer-portal" },
];

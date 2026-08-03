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
];

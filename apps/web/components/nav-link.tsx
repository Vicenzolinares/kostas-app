"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@kostas/ui";
import type { NavItem } from "@/lib/nav";

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

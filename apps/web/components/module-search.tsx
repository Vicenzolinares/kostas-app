"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@kostas/ui";
import { navSectionsForRole } from "@/lib/nav";
import type { UserRole } from "@kostas/shared/schemas";

/**
 * The deck's header search box.
 *
 * Scoped to jumping between modules, and labelled as such. The deck's
 * placeholder ("Search projects, clients, items, work orders…") implies a
 * global entity search across every table, which doesn't exist yet — a box
 * that looks like it searches your projects but silently doesn't would be
 * worse than one that says what it does.
 */
export function ModuleSearch({ role }: { role: UserRole }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => navSectionsForRole(role).flatMap((section) => section.items),
    [role],
  );
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [items, query]);

  function go(href: string) {
    setQuery("");
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative hidden max-w-md flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // A blur that fires before the click lands would close the list out
        // from under the pointer, so this defers past the mousedown.
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && matches[0]) go(matches[0].href);
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Jump to a module…"
        aria-label="Jump to a module"
        className="h-9 rounded-full bg-muted pl-9"
      />
      {open && matches.length > 0 ? (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md">
          {matches.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => go(item.href)}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

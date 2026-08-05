import { navSectionsForRole } from "@/lib/nav";
import { authProvider } from "@/lib/auth";
import { NavLink } from "@/components/nav-link";

/**
 * The sidebar's link list, scoped to the signed-in user's role.
 *
 * Deliberately its own async component rather than an `await` at the top of
 * the layout: reading the session there would hold `{children}` — every page
 * in the (app) group — behind the cookie read. Rendered inside the layout's
 * Suspense boundary, which it needs anyway since NavLink reads the pathname.
 */
export async function SidebarNav() {
  const session = await authProvider.getSession();
  if (!session) return null;

  return (
    <nav className="flex flex-col gap-4">
      {navSectionsForRole(session.user.role).map((section, index) => (
        <div key={section.label ?? index} className="flex flex-col gap-0.5">
          {section.label ? (
            <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Neutral placeholder — the role isn't known until the session resolves. */
export function SidebarNavFallback() {
  return (
    <div className="flex flex-col gap-1" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className="mx-3 my-2 h-4 rounded bg-muted" />
      ))}
    </div>
  );
}

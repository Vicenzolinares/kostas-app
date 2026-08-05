import Link from "next/link";
import { cn } from "@kostas/ui";

/**
 * The card shell every panel on the fixed dashboard sits in: white surface,
 * a small bold title on the left and an optional violet action link on the
 * right, exactly as the deck's p2 panels are drawn.
 *
 * Kept local to the dashboard rather than pushed into @kostas/ui — it is a
 * layout convention of this one screen, not a design-system primitive, and
 * @kostas/ui is shared with the modules other people are editing.
 */
export function Panel({
  title,
  action,
  children,
  className,
  contentClassName,
  ...rest
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
} & Omit<React.ComponentProps<"section">, "title" | "children">) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      {...rest}
    >
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="text-xs font-medium text-primary hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </header>
      <div className={cn("flex-1 px-4 pb-4", contentClassName)}>{children}</div>
    </section>
  );
}

/** Shown inside a panel when the underlying query genuinely returned nothing. */
export function PanelEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-xs text-muted-foreground">{children}</p>
  );
}

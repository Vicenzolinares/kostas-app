"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@kostas/ui";

interface UserMenuShellProps {
  name: string;
  roleLabel: string;
  initials: string;
  /** Passed down from the Server Component so sign-out stays a Server Action. */
  signOut: () => Promise<void>;
}

/**
 * The deck's top-right user badge: avatar chip, name over role, chevron,
 * opening a small menu. The name and role are always visible rather than
 * hidden behind the avatar — several of the deck's screens are shown to
 * shared shop devices where whose session is open actually matters.
 */
export function UserMenuShell({
  name,
  roleLabel,
  initials,
  signOut,
}: UserMenuShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs text-muted-foreground">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
        >
          <Link
            role="menuitem"
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            Settings
          </Link>
          <form action={signOut} className="border-t border-border pt-1">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 font-normal"
            >
              Sign out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

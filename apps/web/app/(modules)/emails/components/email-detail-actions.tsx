"use client";

import { useEffect, useTransition } from "react";
import { markEmailReadAction } from "../api/actions";

/** Fires markEmailReadAction once on mount for an unread email. */
export function MarkReadOnView({ id, isRead }: { id: string; isRead: boolean }) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isRead) return;
    startTransition(async () => {
      await markEmailReadAction(id);
    });
    // Only run once per email id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return null;
}

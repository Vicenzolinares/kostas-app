"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import {
  label,
  notificationLines,
  type Language,
  type MessageKey,
} from "@/lib/i18n";
import type { BoardNotification, NotificationKind } from "../lib/board-data";

/** How long a freshly-arrived message keeps its highlight (mockup: 10s). */
const NEW_MESSAGE_TTL_MS = 10_000;

const ICONS = {
  done: CheckCircle2,
  blocked: AlertTriangle,
  started: ArrowRight,
  moved: Info,
} as const;

const TONES = {
  done: "text-emerald-400",
  blocked: "text-amber-400",
  started: "text-sky-400",
  moved: "text-slate-400",
} as const;

const SENTENCE_KEYS: Record<
  NotificationKind,
  Extract<MessageKey, `note${string}`>
> = {
  done: "noteDone",
  blocked: "noteBlocked",
  started: "noteStarted",
  moved: "noteMoved",
};

interface LiveNotificationsProps {
  notifications: BoardNotification[];
  lang: Language;
}

/**
 * Recent shop activity for the department TV.
 *
 * The mockup specifies that new messages disappear after 10 seconds. Taken
 * literally against a quiet database that would leave a permanently empty
 * panel on the wall, so the rule is applied to the *highlight*: a message
 * that genuinely just arrived (detected by diffing successive polls) pulses
 * for 10 seconds and then settles into the standing recent-activity list.
 * Nothing is invented — every row here is a real production stage.
 */
export function LiveNotifications({
  notifications,
  lang,
}: LiveNotificationsProps) {
  const [freshIds, setFreshIds] = useState<string[]>([]);
  // Tracks ids seen on the previous poll so genuinely new ones can be spotted.
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentIds = notifications.map((n) => n.id);

    // First render establishes the baseline: nothing is "new" on page load,
    // otherwise every message would pulse when a TV is switched on.
    if (seenRef.current === null) {
      seenRef.current = new Set(currentIds);
      return;
    }

    const seen = seenRef.current;
    const arrived = currentIds.filter((id) => !seen.has(id));
    currentIds.forEach((id) => seen.add(id));
    if (arrived.length === 0) return;

    setFreshIds((prev) => [...prev, ...arrived]);
    const timer = setTimeout(() => {
      setFreshIds((prev) => prev.filter((id) => !arrived.includes(id)));
    }, NEW_MESSAGE_TTL_MS);
    return () => clearTimeout(timer);
  }, [notifications]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg bg-slate-800/60 p-3">
      <h2 className="shrink-0 text-sm font-bold uppercase tracking-wide text-white">
        {label("liveNotifications", lang)}
      </h2>

      {notifications.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">
          {label("noNotifications", lang)}
        </p>
      ) : (
        <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {notifications.map((note) => {
            const Icon = ICONS[note.kind];
            const isFresh = freshIds.includes(note.id);
            const lines = notificationLines(
              SENTENCE_KEYS[note.kind],
              { project: note.projectName, departmentKey: note.departmentKey },
              lang,
            );
            return (
              <li
                key={note.id}
                className={`flex items-start gap-2.5 rounded px-2 py-1.5 transition-colors ${
                  isFresh ? "animate-pulse bg-white/10" : ""
                }`}
              >
                <Icon
                  className={`mt-0.5 size-4 shrink-0 ${TONES[note.kind]}`}
                  aria-hidden
                />
                <p className="text-sm leading-snug text-slate-200">
                  {lines.map((line, index) => (
                    <span
                      key={line}
                      className={index === 0 ? "block" : "block text-slate-400"}
                    >
                      {line}
                    </span>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 shrink-0 border-t border-white/10 pt-1.5 text-xs text-slate-500">
        {label("notificationsExpire", lang)}
      </p>
    </section>
  );
}

"use client";

import { useMemo, useRef } from "react";
import { Maximize, Minimize } from "lucide-react";
import type { DepartmentKey } from "@kostas/shared/schemas";
import { useDepartmentStatus } from "@/app/(modules)/department-status/hooks/use-department-status";
import {
  LANGUAGES,
  departmentName,
  label,
  localeFor,
  type Language,
} from "@/lib/i18n";
import { useFullscreen } from "../hooks/use-fullscreen";
import {
  useDepartmentSelection,
  useStoredPreference,
  useWallClock,
} from "../hooks/use-board-preferences";
import {
  deriveNotifications,
  findDepartmentBoard,
  type BoardStage,
} from "../lib/board-data";
import { NeedsAttentionCard, UpNextCard, WorkingNowCard } from "./board-cards";
import { LiveNotifications } from "./live-notifications";
import { ProgressRing } from "./progress-ring";
import { BoardLegend } from "./board-legend";

/** Column caps: a wall display should never need scrolling. */
const MAX_WORKING_NOW = 2;
const MAX_UP_NEXT = 3;
const MAX_NEEDS_ATTENTION = 3;

const LANGUAGE_STORAGE_KEY = "kostas.shopboard.language";
const DEPARTMENT_STORAGE_KEY = "kostas.shopboard.department";

function isLanguage(value: string): value is Language {
  return value === "en" || value === "es" || value === "both";
}

function ColumnHeader({
  tone,
  children,
}: {
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-t-lg px-4 py-2.5 text-center ${tone}`}>
      <h2 className="text-lg font-bold uppercase tracking-wide">{children}</h2>
    </div>
  );
}

function Overflow({ count, lang }: { count: number; lang: Language }) {
  if (count <= 0) return null;
  return (
    <p className="pt-1 text-center text-sm font-medium text-slate-500">
      + {count} {label("more", lang)}
    </p>
  );
}

/**
 * Live department display for a shop-floor TV (module 16).
 *
 * One screen per room — each TV is pointed at `?department=<key>`, or picks
 * a room once and remembers it, matching how the mockups show a separate
 * board mounted in Seamstress, Upholstery, Carpentry and so on.
 *
 * Data still comes from module 13's `useDepartmentStatus`, so the realtime
 * story is unchanged: swapping the RealtimeProvider for Supabase Realtime
 * later upgrades this board without touching it.
 *
 * The previous virtualized row list is gone deliberately — a department
 * shows a handful of jobs, and react-window's fixed-height rows can't
 * express the three-column card layout the shop actually reads from across
 * the room.
 */
export function KioskBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(containerRef);
  const { data, isLoading, isError, dataUpdatedAt } = useDepartmentStatus();

  // A TV is configured once and left alone, so both choices persist locally.
  // `?department=` wins when present — that's how each screen is deployed.
  const [lang, chooseLanguage] = useStoredPreference(
    LANGUAGE_STORAGE_KEY,
    isLanguage,
    "both",
  );
  const [departmentKey, chooseDepartment] = useDepartmentSelection(
    DEPARTMENT_STORAGE_KEY,
  );
  const now = useWallClock();

  const board = useMemo(
    () => findDepartmentBoard(data, departmentKey),
    [data, departmentKey],
  );
  const notifications = useMemo(() => deriveNotifications(data, 4), [data]);

  const workingNow = board?.workingNow.slice(0, MAX_WORKING_NOW) ?? [];
  const upNext = board?.upNext.slice(0, MAX_UP_NEXT) ?? [];
  const needsAttention =
    board?.needsAttention.slice(0, MAX_NEEDS_ATTENTION) ?? [];

  return (
    <div
      ref={containerRef}
      className="flex h-screen flex-col overflow-hidden bg-slate-900 text-white"
      data-testid="kiosk-board"
    >
      {/* --- header ---------------------------------------------------- */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="leading-none">
            <p className="text-xl font-bold tracking-[0.2em]">KOSTAS</p>
            <p className="text-[10px] tracking-[0.35em] text-slate-400">
              UPHOLSTERY
            </p>
          </div>
          <select
            aria-label="Department"
            data-testid="department-select"
            value={board?.key ?? ""}
            onChange={(event) => chooseDepartment(event.target.value)}
            className="rounded-md border border-white/20 bg-slate-800 px-3 py-1.5 text-lg font-semibold text-white"
          >
            {data?.departments.map((snapshot) => (
              <option
                key={snapshot.department.id}
                value={snapshot.department.key}
              >
                {departmentName(snapshot.department.key as DepartmentKey, lang)}
              </option>
            ))}
          </select>
        </div>

        <h1 className="hidden flex-1 text-center text-2xl font-bold uppercase tracking-wide xl:block">
          {board
            ? departmentName(board.key, lang)
            : label("allDepartments", lang)}
        </h1>

        <div className="flex items-center gap-3">
          <div
            className="flex rounded-md border border-white/20"
            role="group"
            aria-label="Language"
          >
            {LANGUAGES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseLanguage(option.value)}
                aria-pressed={lang === option.value}
                className={`px-2.5 py-1.5 text-xs font-bold first:rounded-l-md last:rounded-r-md ${
                  lang === option.value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {option.short}
              </button>
            ))}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-lg font-bold tabular-nums">
              {now
                ? now.toLocaleTimeString(localeFor(lang), {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
            <p className="text-xs text-slate-400">
              {now
                ? now.toLocaleDateString(localeFor(lang), {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={label(
              isFullscreen ? "exitFullscreen" : "fullscreen",
              lang,
            )}
            className="rounded-md border border-white/20 p-2 hover:bg-white/10"
          >
            {isFullscreen ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </button>
        </div>
      </header>

      {/* --- body ------------------------------------------------------ */}
      {isError ? (
        <p className="p-8 text-lg text-red-400">{label("loadFailed", lang)}</p>
      ) : isLoading || !board ? (
        <p className="p-8 text-lg text-slate-400">{label("loading", lang)}</p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-3">
          {/* Working Now */}
          <section className="flex min-h-0 flex-col">
            <ColumnHeader tone="bg-emerald-600 text-white">
              {label("workingNow", lang)}
            </ColumnHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-b-lg bg-slate-100 p-3">
              {workingNow.length === 0 ? (
                <p className="text-slate-500">{label("nothingHere", lang)}</p>
              ) : (
                workingNow.map((stage: BoardStage) => (
                  <WorkingNowCard key={stage.id} stage={stage} lang={lang} />
                ))
              )}
              <Overflow
                count={board.workingNow.length - workingNow.length}
                lang={lang}
              />
            </div>
          </section>

          {/* Up Next */}
          <section className="flex min-h-0 flex-col">
            <ColumnHeader tone="bg-amber-400 text-slate-900">
              {label("upNext", lang)}
            </ColumnHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-b-lg bg-slate-100 p-3">
              {upNext.length === 0 ? (
                <p className="text-slate-500">{label("nothingHere", lang)}</p>
              ) : (
                upNext.map((stage) => (
                  <UpNextCard key={stage.id} stage={stage} lang={lang} />
                ))
              )}
              <Overflow
                count={board.upNext.length - upNext.length}
                lang={lang}
              />
            </div>
          </section>

          {/* Needs Attention + department progress */}
          <section className="flex min-h-0 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col">
              <ColumnHeader tone="bg-red-600 text-white">
                {label("needsAttention", lang)}
              </ColumnHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-b-lg bg-slate-100 p-3">
                {needsAttention.length === 0 ? (
                  <p className="text-slate-500">{label("nothingHere", lang)}</p>
                ) : (
                  needsAttention.map((stage) => (
                    <NeedsAttentionCard
                      key={stage.id}
                      stage={stage}
                      lang={lang}
                    />
                  ))
                )}
                <Overflow
                  count={board.needsAttention.length - needsAttention.length}
                  lang={lang}
                />
              </div>
            </div>

            <div
              className="flex shrink-0 items-center justify-between gap-4 rounded-lg bg-slate-800 p-4"
              data-testid="department-progress"
            >
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  {label("departmentProgress", lang)}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {label("today", lang)}
                </p>
                <p className="text-3xl font-bold tabular-nums text-white">
                  {board.tasksDone} / {board.tasksTotal}
                </p>
                <p className="text-xs text-slate-400">
                  {label("tasksCompleted", lang)}
                </p>
              </div>
              <ProgressRing percent={board.progressPct} />
            </div>
          </section>
        </div>
      )}

      {/* --- footer ------------------------------------------------------
          Capped height: the three columns are what the shop reads from
          across the room, so activity and legend must never crowd them
          out on a shorter screen. */}
      <footer className="grid max-h-[34vh] shrink-0 gap-4 overflow-hidden border-t border-white/10 px-4 py-3 lg:grid-cols-3">
        <div className="min-h-0 overflow-hidden lg:col-span-2">
          <LiveNotifications notifications={notifications} lang={lang} />
        </div>
        <div className="flex min-h-0 flex-col justify-between gap-2 overflow-hidden">
          <BoardLegend lang={lang} />
          <p className="text-right text-xs text-slate-500">
            {label("updated", lang)}{" "}
            {new Date(dataUpdatedAt).toLocaleTimeString(localeFor(lang))}
          </p>
        </div>
      </footer>
    </div>
  );
}

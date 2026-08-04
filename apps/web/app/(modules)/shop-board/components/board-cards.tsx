import { AlertTriangle, Check } from "lucide-react";
import type { ProductionTask, BlockedReason } from "@kostas/shared/schemas";
import {
  label,
  bilingual,
  blockedReasonLabel,
  localeFor,
  type Language,
} from "@/lib/i18n";
import type { BoardStage } from "../lib/board-data";

/** Short due-date string sized for a wall display. */
function formatDue(date: Date | null, lang: Language): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString(localeFor(lang), {
    month: "short",
    day: "numeric",
  });
}

function TaskList({
  tasks,
  lang,
}: {
  tasks: ProductionTask[];
  lang: Language;
}) {
  if (tasks.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-start gap-2 text-[15px] leading-tight"
        >
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 ${
              task.done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-slate-300 bg-white"
            }`}
            aria-hidden
          >
            {task.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
          </span>
          <span
            className={
              task.done ? "text-slate-400 line-through" : "text-slate-700"
            }
          >
            {bilingual(task, lang)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "Working Now" — the job actually on the bench, with its checklist. */
export function WorkingNowCard({
  stage,
  lang,
}: {
  stage: BoardStage;
  lang: Language;
}) {
  const due = formatDue(stage.dueDate, lang);
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-slate-900">
            {stage.projectName}
          </h3>
          <p className="truncate text-sm text-slate-500">{stage.clientName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label("progress", lang)}
          </p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              stage.progressPct >= 60 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {stage.progressPct}%
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {stage.isRush ? (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
            {label("rush", lang)}
          </span>
        ) : null}
        <span className="text-sm font-medium text-slate-600">
          {stage.assignedTo ?? label("unassigned", lang)}
        </span>
        {due ? (
          <span className="ml-auto text-sm text-slate-500">
            {label("due", lang)}: <span className="font-semibold">{due}</span>
          </span>
        ) : null}
      </div>

      {stage.tasks.length > 0 ? (
        <>
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label("todaysTasks", lang)}
          </p>
          <TaskList tasks={stage.tasks} lang={lang} />
        </>
      ) : null}
    </article>
  );
}

/** "Up Next" — queued work, deliberately lighter than Working Now. */
export function UpNextCard({
  stage,
  lang,
}: {
  stage: BoardStage;
  lang: Language;
}) {
  const due = formatDue(stage.dueDate, lang);
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <h3 className="truncate text-base font-bold text-slate-900">
        {stage.projectName}
      </h3>
      <p className="truncate text-sm text-slate-500">
        {stage.assignedTo ?? label("unassigned", lang)}
      </p>
      {due ? (
        <p className="mt-1.5 text-sm text-slate-500">
          {label("due", lang)}: <span className="font-semibold">{due}</span>
        </p>
      ) : null}
    </article>
  );
}

/** "Needs Attention" — blocked work, with the reason spelled out. */
export function NeedsAttentionCard({
  stage,
  lang,
}: {
  stage: BoardStage;
  lang: Language;
}) {
  const reason = (stage.blockedReason ?? "other") as BlockedReason;
  return (
    <article className="flex gap-3 rounded-lg border border-red-200 bg-white p-3.5 shadow-sm">
      <AlertTriangle
        className="mt-0.5 size-6 shrink-0 text-red-600"
        aria-hidden
      />
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold text-slate-900">
          {stage.projectName}
        </h3>
        <p className="mt-0.5 text-sm font-semibold text-red-600">
          {blockedReasonLabel(reason, lang)}
        </p>
        {stage.notes ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {stage.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}

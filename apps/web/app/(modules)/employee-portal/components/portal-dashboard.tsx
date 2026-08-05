"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@kostas/ui";
import type { UserRole } from "@kostas/shared/schemas";
import { label, labelWith, localeFor, type Language } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";
import { ActiveTimer } from "./active-timer";
import { HoursDonut } from "./hours-donut";
import { SyncStatusBanner } from "./sync-status-banner";
import { TaskNotePanel } from "./task-note-panel";
import { roleTitle } from "../lib/roles";
import type { EmployeeDashboard, TaskCard } from "../types";

const STATUS_TONE: Record<string, string> = {
  in_progress: "bg-primary/10 text-primary",
  queued: "bg-muted text-muted-foreground",
  blocked: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

function greetingKey(hour: number) {
  if (hour < 12) return "goodMorning" as const;
  if (hour < 18) return "goodAfternoon" as const;
  return "goodEvening" as const;
}

function StatCard({
  title,
  value,
  hint,
  tone,
  progress,
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "danger";
  progress?: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 pt-6">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p
          className={`text-2xl font-semibold ${tone === "danger" ? "text-destructive" : ""}`}
        >
          {value}
        </p>
        {progress !== undefined ? (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        ) : null}
        {hint ? (
          <p className="text-[0.7rem] text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaskChecklist({ task, lang }: { task: TaskCard; lang: Language }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{task.projectName}</p>
          <p className="text-xs text-muted-foreground">
            {task.clientName} · {task.departmentName}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {task.isRush ? (
            <Badge variant="destructive" className="text-[0.6rem]">
              {label("rush", lang)}
            </Badge>
          ) : null}
          <span
            className={`rounded-full px-2 py-0.5 text-[0.6rem] font-medium ${STATUS_TONE[task.status] ?? ""}`}
          >
            {task.status.replace("_", " ")}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {task.tasks.map((entry, index) => (
          <li
            key={`${entry.en}-${index}`}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[0.6rem] ${
                entry.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
              aria-hidden
            >
              {entry.done ? "✓" : ""}
            </span>
            <span
              className={entry.done ? "text-muted-foreground line-through" : ""}
            >
              {lang === "es"
                ? entry.es
                : lang === "en"
                  ? entry.en
                  : `${entry.en} / ${entry.es}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The employee portal dashboard from deck p17.
 *
 * Language lives here rather than in a provider: it's the only state shared
 * across these panels, and keeping it local means the office app — which is
 * English-only — never pays for the bilingual machinery.
 */
export function PortalDashboard({
  data,
  user,
}: {
  data: EmployeeDashboard;
  user: { name: string; role: UserRole };
}) {
  const [lang, setLang] = useState<Language>("both");
  const now = new Date(data.now);
  const locale = localeFor(lang);
  const firstName = user.name.split(" ")[0] ?? user.name;

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {labelWith(greetingKey(now.getHours()), { name: firstName }, lang)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {roleTitle(user.role, lang)} · {dateFmt.format(now)}
          </p>
        </div>
        <LanguageToggle value={lang} onChange={setLang} />
      </div>

      <SyncStatusBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={label("hoursThisWeek", lang)}
          value={`${data.hoursWeek} hrs`}
          hint={labelWith("ofHours", { total: data.weeklyTarget }, lang)}
          progress={(data.hoursWeek / data.weeklyTarget) * 100}
        />
        <StatCard
          title={label("overtime", lang)}
          value={`${data.overtime} hrs`}
          tone={data.overtime > 0 ? "danger" : undefined}
          hint={label("thisWeek", lang)}
        />
        <StatCard
          title={label("totalProjects", lang)}
          value={String(data.assignedCount)}
          hint={label("activeNow", lang)}
        />
        <StatCard
          title={label("completedCount", lang)}
          value={String(data.completedCount)}
          hint={label("thisMonth", lang)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {label("activeTimer", lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ActiveTimer data={data} lang={lang} />
            <TaskNotePanel lang={lang} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {label("myTasks", lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {label("noTasksAssigned", lang)}
              </p>
            ) : (
              data.tasks.map((task) => (
                <TaskChecklist key={task.id} task={task} lang={lang} />
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {label("todaysSummary", lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {label("totalHoursToday", lang)}
                </span>
                <span className="font-medium">{data.hoursToday} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {label("hoursThisWeek", lang)}
                </span>
                <span className="font-medium">
                  {data.hoursWeek} / {data.weeklyTarget} hrs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {label("overtime", lang)}
                </span>
                <span
                  className={`font-medium ${data.overtime > 0 ? "text-destructive" : ""}`}
                >
                  {data.overtime} hrs
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {label("recentActivity", lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {label("nothingHere", lang)}
                </p>
              ) : (
                data.activity.map((entry, index) => (
                  <div
                    key={`${entry.occurredAt}-${index}`}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <span>
                      {entry.type === "clock_in"
                        ? label("clockedIn", lang)
                        : entry.type === "clock_out"
                          ? label("clockedOut", lang)
                          : entry.type === "photo_upload"
                            ? label("photoUploaded", lang)
                            : label("noteLogged", lang)}
                      {entry.note ? (
                        <span className="text-muted-foreground">
                          {" "}
                          — {entry.note}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {timeFmt.format(new Date(entry.occurredAt))}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {label("workOrders", lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">{label("project", lang)}</th>
                  <th className="pb-2 font-medium">{label("item", lang)}</th>
                  <th className="pb-2 font-medium">
                    {label("customer", lang)}
                  </th>
                  <th className="pb-2 font-medium">{label("dueDate", lang)}</th>
                  <th className="pb-2 font-medium">
                    {label("assignedTo", lang)}
                  </th>
                  <th className="pb-2 font-medium">{label("status", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {data.workOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2">{order.projectName ?? "—"}</td>
                    <td className="py-2">{order.title}</td>
                    <td className="py-2">{order.clientName ?? "—"}</td>
                    <td className="py-2">
                      {order.dueDate
                        ? dateFmt.format(new Date(order.dueDate))
                        : "—"}
                    </td>
                    <td className="py-2">{order.assignedTo ?? "—"}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                          STATUS_TONE[order.status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {label("hoursByTask", lang)} · {label("thisWeek", lang)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.hoursByTask.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {label("nothingHere", lang)}
                </p>
              ) : (
                <HoursDonut
                  data={data.hoursByTask}
                  total={data.hoursWeek}
                  totalLabel={label("totalHrs", lang)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {label("employeeOverview", lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data.teammates.map((mate) => (
                <div key={mate.id} className="flex items-center gap-2 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.65rem] font-semibold text-accent-foreground">
                    {mate.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("")}
                  </span>
                  <span className="flex-1 truncate">
                    {mate.name}
                    {mate.isMe ? (
                      <span className="text-muted-foreground">
                        {" "}
                        ({label("activeNow", lang)})
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {roleTitle(mate.role, lang)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

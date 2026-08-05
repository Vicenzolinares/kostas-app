import "server-only";
import { connection } from "next/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  ne,
  notInArray,
  sql,
} from "drizzle-orm";
import {
  db,
  projects,
  itemsInventory,
  fabricInventory,
  dashboardLayouts,
  workOrders,
  invoices,
  transactions,
  calendarEvents,
  emails,
  users,
} from "@kostas/database";
import type {
  ProjectStatus,
  WorkOrderStatus,
  InvoiceStatus,
  CalendarEventType,
} from "@kostas/shared/schemas";

/**
 * Statuses that count as "active" for the Active Projects stat: everything
 * still on the shop's plate. Kept as one list so the stat card and the
 * Projects Overview table below it can't drift apart.
 */
const ACTIVE_PROJECT_STATUSES = [
  "lead",
  "quoted",
  "approved",
  "in_progress",
  "quality_check",
  "ready_for_delivery",
] as const satisfies readonly ProjectStatus[];

/** Invoices the shop is still waiting to be paid for. */
const OPEN_INVOICE_STATUSES = [
  "sent",
  "partially_paid",
  "overdue",
] as const satisfies readonly InvoiceStatus[];

/** Work orders currently on the floor. */
const LIVE_WORK_ORDER_STATUSES = [
  "approved",
  "in_production",
] as const satisfies readonly WorkOrderStatus[];

const outstandingExpr = sql<string>`coalesce(sum(${invoices.total} - ${invoices.amountPaid}), 0)`;

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
// Widget queries — shared by the customizable grid view
// ---------------------------------------------------------------------------

export async function getDashboardKpis() {
  const [[projectCount], [lowStockCount], [fabricYards]] = await Promise.all([
    db.select({ value: count() }).from(projects),
    db
      .select({ value: count() })
      .from(itemsInventory)
      .where(
        sql`${itemsInventory.quantity} <= ${itemsInventory.reorderThreshold}`,
      ),
    db
      .select({
        value: sql<string>`coalesce(sum(${fabricInventory.yardsInStock}), 0)`,
      })
      .from(fabricInventory),
  ]);

  return {
    totalProjects: projectCount?.value ?? 0,
    lowStockItems: lowStockCount?.value ?? 0,
    totalFabricYards: Number(fabricYards?.value ?? 0),
  };
}

export async function getProjectsByStatus() {
  const rows = await db
    .select({ status: projects.status, value: count() })
    .from(projects)
    .groupBy(projects.status);

  return rows.map((row) => ({ status: row.status, count: row.value }));
}

export async function getDashboardLayout(userId: string) {
  const row = await db.query.dashboardLayouts.findFirst({
    where: eq(dashboardLayouts.userId, userId),
  });
  return row?.layout ?? null;
}

export interface DepartmentLoadRow {
  name: string;
  queued: number;
  inProgress: number;
  blocked: number;
}

/** Per-department production load, for the grid view's department widget. */
export async function getDepartmentLoad(): Promise<DepartmentLoadRow[]> {
  const rows = await db.execute<{
    name: string;
    queued: number;
    in_progress: number;
    blocked: number;
  }>(sql`
    select d.name,
           count(*) filter (where s.status = 'queued')::int as queued,
           count(*) filter (where s.status = 'in_progress')::int as in_progress,
           count(*) filter (where s.status = 'blocked')::int as blocked
      from production_stages s
      join departments d on d.id = s.department_id
     group by d.name, d.sort_order
     order by d.sort_order
  `);

  return Array.from(rows).map((row) => ({
    name: row.name,
    queued: Number(row.queued),
    inProgress: Number(row.in_progress),
    blocked: Number(row.blocked),
  }));
}

export interface LowStockRow {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
}

/** Items at or below their reorder point, for the grid view's stock widget. */
export async function getLowStock(limit = 6): Promise<LowStockRow[]> {
  return db
    .select({
      id: itemsInventory.id,
      name: itemsInventory.name,
      sku: itemsInventory.sku,
      quantity: itemsInventory.quantity,
      unit: itemsInventory.unit,
      reorderThreshold: itemsInventory.reorderThreshold,
    })
    .from(itemsInventory)
    .where(sql`${itemsInventory.quantity} <= ${itemsInventory.reorderThreshold}`)
    .orderBy(asc(itemsInventory.quantity))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Fixed dashboard (deck p2)
// ---------------------------------------------------------------------------

export interface DashboardStats {
  activeProjects: number;
  /** Projects created in the trailing 30 days — the only project trend the data supports. */
  projectsStartedLast30: number;
  workOrders: number;
  workOrdersInProgress: number;
  openInvoices: number;
  openInvoiceTotal: number;
  overdueInvoices: number;
  overdueTotal: number;
  installationsThisWeek: number;
}

/**
 * The five stat cards across the top of the deck's dashboard.
 *
 * Every number here is a live count — including the line under Active
 * Projects, which reports "projects started in the last 30 days" rather than
 * the deck's "+3 from last month". Nothing in the schema records what the
 * active count *was* a month ago, so a true month-over-month delta would
 * have to be invented; this reports the comparable thing the data knows.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await connection();
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -30);
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);

  const [
    [active],
    [started],
    [woTotal],
    [woLive],
    [openInv],
    [overdueInv],
    [installs],
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(projects)
      .where(inArray(projects.status, [...ACTIVE_PROJECT_STATUSES])),
    db
      .select({ value: count() })
      .from(projects)
      .where(gte(projects.createdAt, thirtyDaysAgo)),
    db
      .select({ value: count() })
      .from(workOrders)
      .where(ne(workOrders.status, "cancelled")),
    db
      .select({ value: count() })
      .from(workOrders)
      .where(eq(workOrders.status, "in_production")),
    db
      .select({ value: count(), outstanding: outstandingExpr })
      .from(invoices)
      .where(inArray(invoices.status, [...OPEN_INVOICE_STATUSES])),
    db
      .select({ value: count(), outstanding: outstandingExpr })
      .from(invoices)
      .where(eq(invoices.status, "overdue")),
    db
      .select({ value: count() })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.type, "delivery_installation"),
          gte(calendarEvents.start, weekStart),
          lt(calendarEvents.start, weekEnd),
        ),
      ),
  ]);

  return {
    activeProjects: active?.value ?? 0,
    projectsStartedLast30: started?.value ?? 0,
    workOrders: woTotal?.value ?? 0,
    workOrdersInProgress: woLive?.value ?? 0,
    openInvoices: openInv?.value ?? 0,
    openInvoiceTotal: Number(openInv?.outstanding ?? 0),
    overdueInvoices: overdueInv?.value ?? 0,
    overdueTotal: Number(overdueInv?.outstanding ?? 0),
    installationsThisWeek: installs?.value ?? 0,
  };
}

export interface ProjectOverviewRow {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  workOrdersDone: number;
  workOrdersTotal: number;
  installDate: Date | null;
}

/**
 * The Projects Overview table: active projects with their work-order
 * completion ratio and scheduled install date.
 *
 * "Install date" is the project's earliest `delivery_installation` calendar
 * event, falling back to the project's own due date — the deck shows a dash
 * for a project that has neither, and so does this.
 */
export async function getProjectsOverview(
  limit = 5,
): Promise<ProjectOverviewRow[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: projects.clientName,
      status: projects.status,
      dueDate: projects.dueDate,
      workOrdersTotal: sql<number>`(
        select count(*)::int from work_orders wo
         where wo.project_id = ${projects.id} and wo.status <> 'cancelled'
      )`,
      workOrdersDone: sql<number>`(
        select count(*)::int from work_orders wo
         where wo.project_id = ${projects.id} and wo.status = 'completed'
      )`,
      installDate: sql<string | null>`(
        select min(ce.start) from calendar_events ce
         where ce.project_id = ${projects.id}
           and ce.type = 'delivery_installation'
      )`,
    })
    .from(projects)
    .where(inArray(projects.status, [...ACTIVE_PROJECT_STATUSES]))
    .orderBy(asc(projects.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    clientName: row.clientName,
    status: row.status,
    workOrdersDone: Number(row.workOrdersDone),
    workOrdersTotal: Number(row.workOrdersTotal),
    installDate: row.installDate
      ? new Date(row.installDate)
      : (row.dueDate ?? null),
  }));
}

export interface UpcomingEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  start: Date;
  projectName: string | null;
  location: string | null;
}

/** Next scheduled calendar events, for the Upcoming Calendar column. */
export async function getUpcomingEvents(limit = 5): Promise<UpcomingEvent[]> {
  await connection();
  const now = new Date();

  const rows = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      type: calendarEvents.type,
      start: calendarEvents.start,
      location: calendarEvents.location,
      projectName: projects.name,
    })
    .from(calendarEvents)
    .leftJoin(projects, eq(calendarEvents.projectId, projects.id))
    .where(gte(calendarEvents.start, now))
    .orderBy(asc(calendarEvents.start))
    .limit(limit);

  return rows.map((row) => ({ ...row, start: new Date(row.start) }));
}

export interface FinanceSnapshot {
  revenueThisMonth: number;
  revenueLastMonth: number;
  outstanding: number;
  openInvoiceCount: number;
  depositsReceived: number;
  depositInvoiceCount: number;
  pastDue: number;
  pastDueCount: number;
  /** Weekly payments received, oldest first. */
  series: { label: string; revenue: number }[];
}

/**
 * Finance Snapshot: four figures plus the mini line chart.
 *
 * The deck plots Revenue against Expenses. Nothing in this app records an
 * expense — `transactions` only ever holds money coming in (payments) or
 * going back out to a customer (refunds) — so the chart plots the one
 * series the data supports instead of inventing a cost line.
 */
export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  await connection();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const seriesStart = addDays(startOfWeek(now), -7 * 7);

  const netAmount = sql<string>`coalesce(sum(case when ${transactions.type} = 'refund' then -${transactions.amount} else ${transactions.amount} end), 0)`;

  const [[thisMonth], [lastMonth], [open], [deposits], [pastDue], weekly] =
    await Promise.all([
      db
        .select({ total: netAmount })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, "succeeded"),
            gte(transactions.occurredAt, monthStart),
          ),
        ),
      db
        .select({ total: netAmount })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, "succeeded"),
            gte(transactions.occurredAt, lastMonthStart),
            lt(transactions.occurredAt, monthStart),
          ),
        ),
      db
        .select({ value: count(), outstanding: outstandingExpr })
        .from(invoices)
        .where(inArray(invoices.status, [...OPEN_INVOICE_STATUSES])),
      db
        .select({
          value: count(),
          paid: sql<string>`coalesce(sum(${invoices.amountPaid}), 0)`,
        })
        .from(invoices)
        .where(eq(invoices.status, "partially_paid")),
      db
        .select({ value: count(), outstanding: outstandingExpr })
        .from(invoices)
        .where(eq(invoices.status, "overdue")),
      db
        .select({
          week: sql<string>`to_char(date_trunc('week', ${transactions.occurredAt}), 'YYYY-MM-DD')`,
          total: netAmount,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, "succeeded"),
            gte(transactions.occurredAt, seriesStart),
          ),
        )
        .groupBy(sql`date_trunc('week', ${transactions.occurredAt})`)
        .orderBy(sql`date_trunc('week', ${transactions.occurredAt})`),
    ]);

  // date_trunc('week') is ISO (Monday); startOfWeek() is Sunday. Bucket the
  // rows by the Monday that follows each chart tick so a payment lands in
  // the column its date actually falls in.
  const byWeek = new Map(weekly.map((row) => [row.week, Number(row.total)]));
  const series: FinanceSnapshot["series"] = [];
  for (let i = 0; i < 8; i += 1) {
    const tick = addDays(seriesStart, i * 7);
    const monday = addDays(tick, 1);
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    series.push({
      label: tick.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      revenue: byWeek.get(key) ?? 0,
    });
  }

  return {
    revenueThisMonth: Number(thisMonth?.total ?? 0),
    revenueLastMonth: Number(lastMonth?.total ?? 0),
    outstanding: Number(open?.outstanding ?? 0),
    openInvoiceCount: open?.value ?? 0,
    depositsReceived: Number(deposits?.paid ?? 0),
    depositInvoiceCount: deposits?.value ?? 0,
    pastDue: Number(pastDue?.outstanding ?? 0),
    pastDueCount: pastDue?.value ?? 0,
    series,
  };
}

export interface WorkOrderCard {
  id: string;
  orderNumber: string;
  status: WorkOrderStatus;
  piece: string | null;
  projectName: string | null;
  assignee: string | null;
  dueDate: Date | null;
  /** Storage key of a swatch photo for the fabric on this order, when there is one. */
  thumbnailKey: string | null;
}

/**
 * Work Orders In Progress.
 *
 * The deck's thumbnails are photographs of the finished piece; nothing in
 * this app stores a photo per work order. The closest real image is the
 * swatch of the fabric the order is cut from, so that is what is shown when
 * one exists — orders without a fabric fall back to a glyph rather than to a
 * stand-in photo of somebody else's sofa.
 */
export async function getWorkOrdersInProgress(
  limit = 4,
): Promise<WorkOrderCard[]> {
  const rows = await db
    .select({
      id: workOrders.id,
      orderNumber: workOrders.orderNumber,
      status: workOrders.status,
      specifications: workOrders.specifications,
      dueDate: workOrders.dueDate,
      projectName: projects.name,
      assignee: users.name,
      thumbnailKey: sql<string | null>`(
        select pr.storage_key
          from work_order_fabrics wof
          join photo_references pr on pr.fabric_id = wof.fabric_id
         where wof.work_order_id = ${workOrders.id}
         order by wof.sort_order
         limit 1
      )`,
    })
    .from(workOrders)
    .leftJoin(projects, eq(workOrders.projectId, projects.id))
    .leftJoin(users, eq(workOrders.assignedToId, users.id))
    .where(inArray(workOrders.status, [...LIVE_WORK_ORDER_STATUSES]))
    .orderBy(asc(workOrders.dueDate))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    piece: row.specifications?.furniturePieces?.[0] ?? null,
    projectName: row.projectName,
    assignee: row.assignee,
    dueDate: row.dueDate ? new Date(row.dueDate) : null,
    thumbnailKey: row.thumbnailKey,
  }));
}

export interface DashboardEmail {
  id: string;
  fromAddress: string;
  subject: string;
  preview: string | null;
  isRead: boolean;
  receivedAt: Date;
  projectName: string | null;
}

/** Recent inbound mail for the Recent Emails column. */
export async function getRecentEmails(limit = 5): Promise<DashboardEmail[]> {
  const rows = await db
    .select({
      id: emails.id,
      fromAddress: emails.fromAddress,
      subject: emails.subject,
      bodyText: emails.bodyText,
      isRead: emails.isRead,
      receivedAt: emails.receivedAt,
      projectName: projects.name,
    })
    .from(emails)
    .leftJoin(projects, eq(emails.projectId, projects.id))
    .where(eq(emails.direction, "inbound"))
    .orderBy(desc(emails.receivedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    fromAddress: row.fromAddress,
    subject: row.subject,
    preview: row.bodyText?.replace(/\s+/g, " ").trim().slice(0, 90) ?? null,
    isRead: row.isRead,
    receivedAt: new Date(row.receivedAt),
    projectName: row.projectName,
  }));
}

export interface Reminder {
  id: string;
  label: string;
  href: string;
  due: string;
  urgency: "overdue" | "soon" | "later";
}

/**
 * Tasks & Reminders.
 *
 * There is no task table in this app, so this is not a to-do list: it is
 * every real deadline the database already knows about — overdue invoices,
 * work orders due inside a week, active projects past their due date —
 * gathered into one column. The card says so in its footer, and there is
 * deliberately no checkbox and no "Add task" button, because nothing would
 * persist the result of either.
 */
export async function getReminders(limit = 6): Promise<Reminder[]> {
  await connection();
  const now = new Date();
  const inAWeek = addDays(now, 7);

  const [overdueInvoices, dueWorkOrders, lateProjects] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientName: invoices.clientName,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(eq(invoices.status, "overdue"))
      .orderBy(asc(invoices.dueDate))
      .limit(limit),
    db
      .select({
        id: workOrders.id,
        orderNumber: workOrders.orderNumber,
        dueDate: workOrders.dueDate,
        projectName: projects.name,
      })
      .from(workOrders)
      .leftJoin(projects, eq(workOrders.projectId, projects.id))
      .where(
        and(
          inArray(workOrders.status, [...LIVE_WORK_ORDER_STATUSES]),
          isNotNull(workOrders.dueDate),
          lte(workOrders.dueDate, inAWeek),
        ),
      )
      .orderBy(asc(workOrders.dueDate))
      .limit(limit),
    db
      .select({
        id: projects.id,
        name: projects.name,
        dueDate: projects.dueDate,
      })
      .from(projects)
      .where(
        and(
          inArray(projects.status, [...ACTIVE_PROJECT_STATUSES]),
          isNotNull(projects.dueDate),
          lte(projects.dueDate, now),
        ),
      )
      .orderBy(asc(projects.dueDate))
      .limit(limit),
  ]);

  const dueLabel = (date: Date | null): string => {
    if (!date) return "No date";
    const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  };

  const urgencyOf = (date: Date | null): Reminder["urgency"] => {
    if (!date) return "later";
    const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
    if (days < 0) return "overdue";
    if (days <= 1) return "soon";
    return "later";
  };

  const reminders: (Reminder & { sortKey: number })[] = [
    ...overdueInvoices.map((row) => ({
      id: `invoice-${row.id}`,
      label: `Chase payment on ${row.invoiceNumber} — ${row.clientName}`,
      href: `/finance/invoices/${row.id}`,
      due: dueLabel(row.dueDate),
      urgency: "overdue" as const,
      sortKey: row.dueDate?.getTime() ?? 0,
    })),
    ...dueWorkOrders.map((row) => ({
      id: `work-order-${row.id}`,
      label: `${row.orderNumber} due${row.projectName ? ` — ${row.projectName}` : ""}`,
      href: `/work-orders/${row.id}`,
      due: dueLabel(row.dueDate),
      urgency: urgencyOf(row.dueDate),
      sortKey: row.dueDate?.getTime() ?? 0,
    })),
    ...lateProjects.map((row) => ({
      id: `project-${row.id}`,
      label: `${row.name} is past its due date`,
      href: `/projects/${row.id}`,
      due: dueLabel(row.dueDate),
      urgency: "overdue" as const,
      sortKey: row.dueDate?.getTime() ?? 0,
    })),
  ];

  return reminders
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, limit)
    .map(({ sortKey: _sortKey, ...reminder }) => reminder);
}

export interface ActivityEntry {
  id: string;
  kind:
    | "work_order"
    | "work_order_done"
    | "payment"
    | "email"
    | "install"
    | "invoice";
  title: string;
  detail: string;
  at: Date;
}

/**
 * Recent Activity.
 *
 * This app has no audit-log table, so rather than leave the panel empty (or
 * fill it with invented events) the feed is assembled from timestamps the
 * domain tables already carry: work orders created and completed, payments
 * recorded, mail received, installs scheduled, invoices raised. Every row is
 * a real record and "when" is that record's own timestamp.
 */
export async function getRecentActivity(limit = 6): Promise<ActivityEntry[]> {
  const [newWorkOrders, doneWorkOrders, payments, inbound, installs, raised] =
    await Promise.all([
      db
        .select({
          id: workOrders.id,
          orderNumber: workOrders.orderNumber,
          createdAt: workOrders.createdAt,
          projectName: projects.name,
        })
        .from(workOrders)
        .leftJoin(projects, eq(workOrders.projectId, projects.id))
        .orderBy(desc(workOrders.createdAt))
        .limit(limit),
      db
        .select({
          id: workOrders.id,
          orderNumber: workOrders.orderNumber,
          updatedAt: workOrders.updatedAt,
          projectName: projects.name,
        })
        .from(workOrders)
        .leftJoin(projects, eq(workOrders.projectId, projects.id))
        .where(eq(workOrders.status, "completed"))
        .orderBy(desc(workOrders.updatedAt))
        .limit(limit),
      db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          occurredAt: transactions.occurredAt,
          clientName: invoices.clientName,
        })
        .from(transactions)
        .leftJoin(invoices, eq(transactions.invoiceId, invoices.id))
        .where(
          and(
            eq(transactions.status, "succeeded"),
            eq(transactions.type, "payment"),
          ),
        )
        .orderBy(desc(transactions.occurredAt))
        .limit(limit),
      db
        .select({
          id: emails.id,
          fromAddress: emails.fromAddress,
          receivedAt: emails.receivedAt,
          projectName: projects.name,
        })
        .from(emails)
        .leftJoin(projects, eq(emails.projectId, projects.id))
        .where(eq(emails.direction, "inbound"))
        .orderBy(desc(emails.receivedAt))
        .limit(limit),
      db
        .select({
          id: calendarEvents.id,
          title: calendarEvents.title,
          start: calendarEvents.start,
          createdAt: calendarEvents.createdAt,
          projectName: projects.name,
        })
        .from(calendarEvents)
        .leftJoin(projects, eq(calendarEvents.projectId, projects.id))
        .where(eq(calendarEvents.type, "delivery_installation"))
        .orderBy(desc(calendarEvents.createdAt))
        .limit(limit),
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          clientName: invoices.clientName,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(notInArray(invoices.status, ["draft", "void"]))
        .orderBy(desc(invoices.createdAt))
        .limit(limit),
    ]);

  const money = (value: string) =>
    Number(value).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    });

  const entries: ActivityEntry[] = [
    ...newWorkOrders.map((row) => ({
      id: `wo-new-${row.id}`,
      kind: "work_order" as const,
      title: "New work order",
      detail: `${row.orderNumber}${row.projectName ? ` · ${row.projectName}` : ""}`,
      at: new Date(row.createdAt),
    })),
    ...doneWorkOrders.map((row) => ({
      id: `wo-done-${row.id}`,
      kind: "work_order_done" as const,
      title: "Work order completed",
      detail: `${row.orderNumber}${row.projectName ? ` · ${row.projectName}` : ""}`,
      at: new Date(row.updatedAt),
    })),
    ...payments.map((row) => ({
      id: `tx-${row.id}`,
      kind: "payment" as const,
      title: "Payment received",
      detail: `${money(row.amount)}${row.clientName ? ` from ${row.clientName}` : ""}`,
      at: new Date(row.occurredAt),
    })),
    ...inbound.map((row) => ({
      id: `email-${row.id}`,
      kind: "email" as const,
      title: "Email received",
      detail: `${row.fromAddress}${row.projectName ? ` · ${row.projectName}` : ""}`,
      at: new Date(row.receivedAt),
    })),
    ...installs.map((row) => ({
      id: `event-${row.id}`,
      kind: "install" as const,
      title: "Install scheduled",
      detail: `${row.projectName ?? row.title} · ${new Date(row.start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      at: new Date(row.createdAt),
    })),
    ...raised.map((row) => ({
      id: `inv-${row.id}`,
      kind: "invoice" as const,
      title: "Invoice raised",
      detail: `${row.invoiceNumber} · ${row.clientName}`,
      at: new Date(row.createdAt),
    })),
  ];

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export interface MailboxSummary {
  unread: number;
  lastSyncedAt: Date | null;
}

/** Backs the sidebar's Yahoo Mail panel. */
export async function getMailboxSummary(): Promise<MailboxSummary> {
  const [[unread], syncRows] = await Promise.all([
    db.select({ value: count() }).from(emails).where(eq(emails.isRead, false)),
    db.execute<{ last_synced_at: string | null }>(sql`
      select max(last_synced_at) as last_synced_at
        from email_sync_state
       where status = 'synced'
    `),
  ]);

  const last = Array.from(syncRows)[0]?.last_synced_at ?? null;
  return {
    unread: unread?.value ?? 0,
    lastSyncedAt: last ? new Date(last) : null,
  };
}

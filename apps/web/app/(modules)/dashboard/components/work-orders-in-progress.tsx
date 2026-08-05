import Link from "next/link";
import Image from "next/image";
import { Sofa } from "lucide-react";
import { Panel, PanelEmpty } from "./panel";
import { WorkOrderStatusPill } from "./status-pill";
import type { WorkOrderCard } from "../api/queries";

const dueLabel = (date: Date | null) =>
  date
    ? `Due: ${date.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" })}`
    : "No due date";

/** Row 3, left column: live work orders with their fabric swatch. */
export function WorkOrdersInProgress({ orders }: { orders: WorkOrderCard[] }) {
  return (
    <Panel
      title="Work Orders In Progress"
      action={{ label: "View All Work Orders", href: "/work-orders" }}
      data-testid="dashboard-work-orders"
    >
      {orders.length === 0 ? (
        <PanelEmpty>No work orders on the floor right now.</PanelEmpty>
      ) : (
        <ul className="flex flex-col">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
            >
              <span className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {order.thumbnailKey ? (
                  <Image
                    src={`/api/storage/${order.thumbnailKey}`}
                    alt=""
                    width={56}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Sofa
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/work-orders/${order.id}`}
                  className="block truncate text-xs font-semibold text-primary hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <span className="block truncate text-xs">
                  {order.piece ?? "Unspecified piece"}
                </span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">
                  {order.projectName ?? "No project"}
                </span>
              </span>
              <WorkOrderStatusPill status={order.status} />
              <span className="w-20 shrink-0 text-right">
                <span className="block truncate text-[0.7rem] font-medium">
                  {order.assignee ?? "Unassigned"}
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  {dueLabel(order.dueDate)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/work-orders"
        className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
      >
        View All Work Orders
      </Link>
    </Panel>
  );
}

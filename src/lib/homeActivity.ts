import type { PhosphorIconsType } from "@shohojdhara/atomix";
import type { Incident, WorkOrder } from "@/types/domain";
import { formatRelativeTimeFromIso } from "@/lib/operationsViewMappers";

export type ActivityFeedItem = {
  id: string;
  message: string;
  time: string;
  icon: PhosphorIconsType;
  severity: "error" | "warning" | "success" | "info" | "primary";
  href: string;
  timestamp: number;
};

function incidentSeverity(
  severity: Incident["severity"]
): ActivityFeedItem["severity"] {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "info";
}

function workOrderSeverity(order: WorkOrder): ActivityFeedItem["severity"] {
  if (order.status === "done") return "success";
  if (order.workType === "audit" || order.workType === "repair") return "warning";
  if (order.priority === "high" || order.priority === "critical") return "warning";
  return "info";
}

function workOrderIcon(order: WorkOrder): PhosphorIconsType {
  if (order.status === "done") return "CheckCircle";
  if (order.workType === "audit" || order.workType === "repair") return "Wrench";
  return "Clipboard";
}

function workOrderMessage(order: WorkOrder, assigneeName?: string): string {
  if (order.status === "done" && (order.workType === "setup" || order.workType === "install")) {
    return `${order.title} — provisioning completed`;
  }

  if (order.status === "assigned" || order.status === "in_progress") {
    const assignee = assigneeName ?? "field technician";
    return `${order.id}: ${order.title} — assigned to ${assignee}`;
  }

  return `${order.id}: ${order.title}`;
}

export function buildHomeActivityFeed(
  incidents: Incident[],
  workOrders: WorkOrder[],
  memberNameById: Map<string, string>,
  limit = 4
): ActivityFeedItem[] {
  const incidentItems: ActivityFeedItem[] = incidents
    .filter((incident) => incident.status !== "resolved")
    .map((incident) => ({
      id: `incident-${incident.id}`,
      message: `${incident.id}: ${incident.title}`,
      time: formatRelativeTimeFromIso(incident.createdAt),
      icon: "Warning",
      severity: incidentSeverity(incident.severity),
      href: `/incidents?selected=${incident.id}`,
      timestamp: new Date(incident.createdAt).getTime(),
    }));

  const workOrderItems: ActivityFeedItem[] = workOrders.map((order) => ({
    id: `work-order-${order.id}`,
    message: workOrderMessage(
      order,
      order.assigneeId ? memberNameById.get(order.assigneeId) : undefined
    ),
    time: formatRelativeTimeFromIso(order.updatedAt),
    icon: workOrderIcon(order),
    severity: workOrderSeverity(order),
    href: `/work-orders?selected=${order.id}`,
    timestamp: new Date(order.updatedAt).getTime(),
  }));

  return [...incidentItems, ...workOrderItems]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function countIncidentsResolvedSince(
  incidents: Incident[],
  hoursAgo: number
): number {
  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
  return incidents.filter((incident) => {
    if (!incident.resolvedAt) return false;
    return new Date(incident.resolvedAt).getTime() >= cutoff;
  }).length;
}

export function countCustomersAddedThisMonth(customers: { createdAt: string }[]): number {
  const now = new Date();
  return customers.filter((customer) => {
    const created = new Date(customer.createdAt);
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;
}

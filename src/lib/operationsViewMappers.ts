import type {
  Asset,
  AssetKind,
  AssetStatus,
  BillingStatus,
  Customer,
  CustomerStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  PlanningProposal,
  ProposalStatus,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/types/domain";
import {
  priorityLabels,
  statusLabels as workOrderStatusLabels,
  workTypeLabels,
} from "@/modules/work-orders/schemas/workOrder.schema";
import {
  statusLabels as proposalStatusLabels,
  typeLabels as proposalTypeLabels,
} from "@/modules/planning/schemas/proposal.schema";

export type AssetTableRow = {
  id: string;
  type: string;
  location: string;
  status: "Active" | "Warning" | "Critical";
  lastMaintenance: string;
  coordinates: string;
};

export type CustomerTableRow = {
  id: string;
  name: string;
  type: string;
  signalHealth: number;
  connectionPath: string;
  billingStatus: "paid" | "overdue" | "unpaid";
  incidentHistory: number;
};

export type IncidentTableRow = {
  id: string;
  title: string;
  severity: "Critical" | "Warning" | "Low";
  status: "Investigating" | "Assigned" | "Resolved" | "In Progress";
  technician: string;
  time: string;
};

export type ProposalTableRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  targetArea: string;
  newCustomers: number;
  budget: string;
  owner: string;
};

export type WorkOrderTableRow = {
  id: string;
  title: string;
  priority: string;
  type: string;
  status: string;
  assignee: string;
  updated: string;
};

const assetKindLabels: Record<AssetKind, string> = {
  pole: "Pole",
  junction_box: "Junction Box",
  splitter: "Splitter",
  onu: "ONU",
  pop: "PoP",
  fiber_route: "Fiber Route",
};

const technicians = [
  "Jordan Lee",
  "Sam Rivera",
  "Taylor Chen",
  "Alex Morgan",
] as const;

function stableIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % modulo;
  }
  return hash;
}

export function formatCoordinates(location: { lat: number; lng: number }): string {
  const latSuffix = location.lat >= 0 ? "N" : "S";
  const lngSuffix = location.lng >= 0 ? "E" : "W";
  return `${Math.abs(location.lat).toFixed(4)}° ${latSuffix}, ${Math.abs(location.lng).toFixed(4)}° ${lngSuffix}`;
}

function mapAssetStatus(status: AssetStatus): AssetTableRow["status"] {
  switch (status) {
    case "active":
      return "Active";
    case "degraded":
    case "maintenance":
      return "Warning";
    case "down":
      return "Critical";
  }
}

function mapCustomerType(plan: string): string {
  if (plan.includes("1Gbps")) {
    return "Enterprise";
  }
  if (plan.includes("500Mbps")) {
    return "Business";
  }
  return "Residential";
}

function mapSignalHealth(status: CustomerStatus, customerId: string): number {
  switch (status) {
    case "online":
      return 92 + stableIndex(customerId, 8);
    case "unstable":
      return 55 + stableIndex(customerId, 20);
    case "offline":
      return 10 + stableIndex(customerId, 25);
  }
}

function mapBillingStatus(billingStatus: BillingStatus): CustomerTableRow["billingStatus"] {
  return billingStatus;
}

function mapIncidentSeverity(severity: IncidentSeverity): IncidentTableRow["severity"] {
  switch (severity) {
    case "critical":
    case "high":
      return severity === "critical" ? "Critical" : "Warning";
    case "medium":
      return "Warning";
    case "low":
      return "Low";
  }
}

function mapIncidentStatus(status: IncidentStatus): IncidentTableRow["status"] {
  switch (status) {
    case "new":
      return "In Progress";
    case "investigating":
      return "Investigating";
    case "assigned":
      return "Assigned";
    case "resolved":
      return "Resolved";
  }
}

export function formatRelativeTimeFromIso(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function pseudoMaintenanceDate(seed: string): string {
  const year = 2024 + stableIndex(seed, 3);
  const month = 1 + stableIndex(seed.slice(1), 12);
  const day = 1 + stableIndex(seed.slice(2), 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function mapAssetToTableRow(asset: Asset): AssetTableRow {
  return {
    id: asset.id,
    type: assetKindLabels[asset.kind],
    location: asset.name,
    status: mapAssetStatus(asset.status),
    lastMaintenance: pseudoMaintenanceDate(asset.id),
    coordinates: formatCoordinates(asset.location),
  };
}

export function mapCustomerToTableRow(
  customer: Customer,
  options: {
    incidentHistory?: number;
    connectionPath?: string;
    relatedOnu?: Asset | null;
  } = {}
): CustomerTableRow {
  const { incidentHistory = 0, connectionPath, relatedOnu } = options;
  const signalHealth = relatedOnu
    ? relatedOnu.status === "active"
      ? mapSignalHealth(customer.status, customer.id)
      : relatedOnu.status === "degraded" || relatedOnu.status === "maintenance"
        ? 55 + stableIndex(customer.id, 20)
        : 10 + stableIndex(customer.id, 25)
    : mapSignalHealth(customer.status, customer.id);

  return {
    id: customer.id,
    name: customer.name,
    type: mapCustomerType(customer.plan),
    signalHealth,
    connectionPath: connectionPath ?? `${customer.plan} • ${customer.id}`,
    billingStatus: mapBillingStatus(customer.billingStatus),
    incidentHistory,
  };
}

export function mapIncidentToTableRow(incident: Incident): IncidentTableRow {
  return {
    id: incident.id,
    title: incident.title,
    severity: mapIncidentSeverity(incident.severity),
    status: mapIncidentStatus(incident.status),
    technician:
      incident.technician ??
      technicians[stableIndex(incident.id, technicians.length)] ??
      technicians[0],
    time: formatRelativeTimeFromIso(incident.createdAt),
  };
}

function formatBudgetUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function mapProposalStatus(status: ProposalStatus): string {
  return proposalStatusLabels[status];
}

export function mapProposalToTableRow(proposal: PlanningProposal): ProposalTableRow {
  return {
    id: proposal.id,
    title: proposal.title,
    type: proposalTypeLabels[proposal.type],
    status: mapProposalStatus(proposal.status),
    targetArea: proposal.targetArea,
    newCustomers: proposal.estimatedNewCustomers,
    budget: formatBudgetUsd(proposal.estimatedBudgetUsd),
    owner: proposal.owner,
  };
}

function mapWorkOrderPriority(priority: WorkOrderPriority): string {
  return priorityLabels[priority];
}

function mapWorkOrderStatus(status: WorkOrderStatus): string {
  return workOrderStatusLabels[status];
}

export function mapWorkOrderToTableRow(
  order: WorkOrder,
  assigneeName?: string
): WorkOrderTableRow {
  return {
    id: order.id,
    title: order.title,
    priority: mapWorkOrderPriority(order.priority),
    type: workTypeLabels[order.workType],
    status: mapWorkOrderStatus(order.status),
    assignee: assigneeName ?? "Unassigned",
    updated: formatRelativeTimeFromIso(order.updatedAt),
  };
}

export function getOpenWorkOrderCount(orders: WorkOrder[]): number {
  return orders.filter((order) => order.status !== "done").length;
}

export function getHighPriorityOpenWorkOrderCount(orders: WorkOrder[]): number {
  return orders.filter(
    (order) =>
      order.status !== "done" &&
      (order.priority === "high" || order.priority === "critical")
  ).length;
}

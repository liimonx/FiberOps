import type {
  Asset,
  AssetKind,
  AssetStatus,
  Customer,
  CustomerStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/domain";

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

function formatCoordinates(location: { lat: number; lng: number }): string {
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

function mapBillingStatus(customerId: string): CustomerTableRow["billingStatus"] {
  const options: CustomerTableRow["billingStatus"][] = ["paid", "paid", "paid", "overdue", "unpaid"];
  return options[stableIndex(customerId, options.length)] ?? "paid";
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

function formatRelativeTime(seed: string): string {
  const options = ["10m ago", "2h ago", "6h ago", "1d ago", "2d ago"];
  return options[stableIndex(seed, options.length)] ?? "1d ago";
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
  incidentHistory = 0
): CustomerTableRow {
  return {
    id: customer.id,
    name: customer.name,
    type: mapCustomerType(customer.plan),
    signalHealth: mapSignalHealth(customer.status, customer.id),
    connectionPath: `${customer.plan} • ${customer.id}`,
    billingStatus: mapBillingStatus(customer.id),
    incidentHistory,
  };
}

export function mapIncidentToTableRow(incident: Incident): IncidentTableRow {
  return {
    id: incident.id,
    title: incident.title,
    severity: mapIncidentSeverity(incident.severity),
    status: mapIncidentStatus(incident.status),
    technician: technicians[stableIndex(incident.id, technicians.length)] ?? technicians[0],
    time: formatRelativeTime(incident.id),
  };
}

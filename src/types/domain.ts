export type AssetKind =
  | "pole"
  | "junction_box"
  | "splitter"
  | "onu"
  | "pop"
  | "fiber_route";

export type AssetStatus = "active" | "degraded" | "down" | "maintenance";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "new" | "investigating" | "assigned" | "resolved";

export type CustomerStatus = "online" | "offline" | "unstable";

export type LatLng = { lat: number; lng: number };

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  status: AssetStatus;
  location: LatLng;
};

export type Customer = {
  id: string;
  name: string;
  plan: string;
  status: CustomerStatus;
};

export type Incident = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  relatedAssetId?: string;
};


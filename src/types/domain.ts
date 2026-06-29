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
export type BillingStatus = "paid" | "overdue" | "unpaid";

export type LatLng = { lat: number; lng: number };

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  status: AssetStatus;
  location: LatLng;
  monitorHost?: string;
};

export type Customer = {
  id: string;
  name: string;
  plan: string;
  status: CustomerStatus;
  billingStatus: BillingStatus;
  relatedOnuId?: string;
  pppoeUsername?: string;
  email?: string;
  notes?: string;
  location?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
};

export type Incident = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  relatedAssetId?: string;
  technician?: string;
  notes?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
};

export type WorkOrderStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "review"
  | "done";

export type WorkOrderPriority = "low" | "medium" | "high" | "critical";

export type WorkOrderType =
  | "survey"
  | "audit"
  | "repair"
  | "upgrade"
  | "install"
  | "setup";

export type WorkOrder = {
  id: string;
  title: string;
  priority: WorkOrderPriority;
  workType: WorkOrderType;
  status: WorkOrderStatus;
  assigneeId?: string;
  relatedIncidentId?: string;
  relatedAssetId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationSettings = {
  organizationName: string;
  supportEmail: string;
};

export type IntegrationStatus = "connected" | "disconnected" | "error";

export type IntegrationProviderId =
  | "mapbox"
  | "slack"
  | "pagerduty"
  | "stripe"
  | "mikrotik";

export type Integration = {
  id: IntegrationProviderId;
  name: string;
  description: string;
  status: IntegrationStatus;
  enabled: boolean;
  apiKeyMasked?: string;
  host?: string;
  port?: number;
  username?: string;
  passwordMasked?: string;
  useSsl?: boolean;
  verifySsl?: boolean;
  apiMode?: "rest" | "classic";
  monitoredInterface?: string;
};

export type WebhookEvent =
  | "incident.created"
  | "incident.resolved"
  | "outage.detected"
  | "work_order.updated";

export type OutboundWebhook = {
  enabled: boolean;
  url: string;
  secretMasked?: string;
  events: WebhookEvent[];
};

export type IntegrationsSettings = {
  integrations: Integration[];
  outboundWebhook: OutboundWebhook;
};

export type InvoiceDelivery = "email" | "portal";

export type BillingCurrency = "USD" | "EUR" | "GBP" | "CAD";

export type BillingSettings = {
  legalName: string;
  billingEmail: string;
  currency: BillingCurrency;
  taxId: string;
  invoiceDelivery: InvoiceDelivery;
  lastSyncedAt: string | null;
};

export type StripeConnectionSummary = {
  status: IntegrationStatus;
  enabled: boolean;
  apiKeyMasked?: string;
};

export type BillingSettingsPayload = {
  settings: BillingSettings;
  stripe: StripeConnectionSummary;
};

export type TeamRole = "admin" | "operator" | "viewer";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  lastActiveAt: string;
};

export type TeamInvite = {
  id: string;
  email: string;
  role: TeamRole;
  invitedAt: string;
};

export type TeamSettings = {
  members: TeamMember[];
  invites: TeamInvite[];
};

export type ProposalStatus =
  | "draft"
  | "review"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ProposalType =
  | "fiber_expansion"
  | "splitter_upgrade"
  | "pop_build"
  | "capacity_upgrade"
  | "new_market";

export type PlanningAreaGeometry =
  | { type: "circle"; center: LatLng; radiusMeters: number }
  | { type: "polygon"; coordinates: LatLng[] };

export type PlanningRouteGeometry = { waypoints: LatLng[] };

export type BudgetLineItem = {
  category: string;
  amountUsd: number;
  notes?: string;
};

export type PlanningProposal = {
  id: string;
  title: string;
  description?: string;
  type: ProposalType;
  status: ProposalStatus;
  targetArea: string;
  relatedAssetId?: string;
  estimatedNewCustomers: number;
  currentUtilizationPercent?: number;
  projectedUtilizationPercent: number;
  estimatedBudgetUsd: number;
  budgetLineItems: BudgetLineItem[];
  areas: PlanningAreaGeometry[];
  routes: PlanningRouteGeometry[];
  owner: string;
  targetStartDate?: string;
  targetCompletionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportType =
  | "uptime_summary"
  | "asset_inventory"
  | "incident_analytics";

export type ReportFormat = "pdf" | "csv";

export type ReportStatus = "ready" | "generating" | "failed";

export type ReportPeriod = "7d" | "30d" | "90d" | "6m" | "12m";

export type GeneratedReport = {
  id: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  status: ReportStatus;
  period: ReportPeriod;
  generatedAt: string;
  generatedBy: string;
  fileSizeBytes: number;
};

export type ReportsSummary = {
  networkUptimePercent: number;
  slaTargetPercent: number;
  slaCompliant: boolean;
  totalAssets: number;
  degradedAssets: number;
  openIncidents: number;
  avgResolutionHours: number;
  reportsGeneratedThisMonth: number;
};

export type ChartDataPoint = {
  label: string;
  value: number;
  color?: string;
};

export type UptimeOutageEvent = {
  date: string;
  durationMinutes: number;
  affectedCustomers: number;
  cause: string;
};

export type UptimeSummary = {
  monthlyUptime: ChartDataPoint[];
  slaTarget: number;
  currentMonthUptime: number;
  outageEvents: UptimeOutageEvent[];
};

export type IncidentAnalytics = {
  bySeverity: ChartDataPoint[];
  byStatus: ChartDataPoint[];
  resolutionTrend: ChartDataPoint[];
  avgResolutionBySeverity: ChartDataPoint[];
  mttrHours: number;
  totalIncidents: number;
  resolvedIncidents: number;
};

export type ReportDownloadPayload = {
  filename: string;
  mimeType: string;
  content: string;
};

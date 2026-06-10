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
};

export type Customer = {
  id: string;
  name: string;
  plan: string;
  status: CustomerStatus;
  billingStatus: BillingStatus;
  relatedOnuId?: string;
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

export type OrganizationSettings = {
  organizationName: string;
  supportEmail: string;
};

export type IntegrationStatus = "connected" | "disconnected" | "error";

export type IntegrationProviderId =
  | "mapbox"
  | "slack"
  | "pagerduty"
  | "stripe";

export type Integration = {
  id: IntegrationProviderId;
  name: string;
  description: string;
  status: IntegrationStatus;
  enabled: boolean;
  apiKeyMasked?: string;
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

# API Reference

Base URL: `/api`  
Content-Type: `application/json`

All endpoints below are implemented in MSW (`src/mocks/handlers.ts`) and consumed by the frontend via `fetch()`.

## Error responses

| Status | When | Body |
|--------|------|------|
| 400 | Validation failure | `{ "error": "Validation failed", "issues": { "fieldErrors": {}, "formErrors": [] } }` |
| 400 | Business rule failure | `{ "error": "<message>" }` |
| 404 | Resource not found | `{ "error": "<message>" }` |
| 404 | Unhandled route | `{ "error": "No mock handler for METHOD /path" }` (mock only) |

The frontend parses validation errors via `parseSettingsError()` — preserve the `issues` shape compatible with [Zod's `flatten()`](https://zod.dev/ERROR_HANDLING?id=flattening-errors).

---

## Assets

### List assets

```
GET /api/assets
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "pop-dhaka-01",
      "kind": "pop",
      "name": "Dhaka Main PoP",
      "status": "active",
      "location": { "lat": 23.8103, "lng": 90.4125 }
    }
  ]
}
```

**Mock delay:** ~350 ms  
**Frontend cache:** 60 s stale time

---

## Customers

### List customers

```
GET /api/customers
```

**Response 200:** `{ "items": Customer[] }`

### Get customer

```
GET /api/customers/:id
```

**Response 200:** `Customer`  
**Response 404:** `{ "error": "Customer not found" }`

### Create customer

```
POST /api/customers
```

**Request body:**

```json
{
  "name": "Rahman Residence",
  "plan": "Fiber 100Mbps",
  "status": "online",
  "email": "rahman@example.com",
  "relatedOnuId": "onu-cust-001",
  "location": { "lat": 23.7948, "lng": 90.4088 }
}
```

| Field | Validation |
|-------|------------|
| `name` | trim, min 2 chars |
| `plan` | one of `customerPlans` enum |
| `status` | `online` \| `offline` \| `unstable` |
| `email` | valid email or empty string (treated as omitted) |
| `relatedOnuId` | optional string |
| `location.lat` | -90 to 90 |
| `location.lng` | -180 to 180 |

**Response 201:** created `Customer` (server sets `id`, `billingStatus: "paid"`, `createdAt`, `updatedAt`)

### Update customer

```
PATCH /api/customers/:id
```

**Request body** (all optional):

```json
{
  "name": "Updated Name",
  "plan": "Fiber 200Mbps",
  "status": "offline",
  "billingStatus": "overdue",
  "email": "new@example.com",
  "relatedOnuId": "onu-cust-002",
  "notes": "VIP account",
  "location": { "lat": 23.79, "lng": 90.41 }
}
```

**Response 200:** updated `Customer`  
**Response 404:** `{ "error": "Customer not found" }`

---

## Incidents

### List incidents

```
GET /api/incidents
```

**Response 200:** `{ "items": Incident[] }`

**Frontend behavior:** refetch interval 30 s; active subset filters `status !== "resolved"`.

### Get incident

```
GET /api/incidents/:id
```

**Response 200:** `Incident`  
**Response 404:** `{ "error": "Incident not found" }`

### Create incident

```
POST /api/incidents
```

**Request body:**

```json
{
  "title": "Fiber cut on Main Street",
  "severity": "critical",
  "relatedAssetId": "pole-main-st-01",
  "notes": "Field team dispatched."
}
```

| Field | Validation |
|-------|------------|
| `title` | trim, min 3 chars |
| `severity` | `low` \| `medium` \| `high` \| `critical` |
| `relatedAssetId` | optional |
| `notes` | optional |

**Response 201:** created `Incident` with `status: "new"`, timestamps, optional auto-assigned `technician`

**Side effect (recommended):** emit outbound webhook `incident.created`; WebSocket `incident_alert`

### Update incident

```
PATCH /api/incidents/:id
```

**Resolve flow** — when body includes `status: "resolved"`:

```json
{
  "status": "resolved",
  "resolutionNotes": "Splice repaired and signal restored to nominal levels."
}
```

| Field | Validation |
|-------|------------|
| `resolutionNotes` | trim, min 10 chars (required for resolve) |

**General update body:**

```json
{
  "status": "assigned",
  "notes": "Technician en route",
  "technician": "Jordan Lee",
  "resolutionNotes": "optional unless resolving"
}
```

**Response 200:** updated `Incident`  
On resolve: set `resolvedAt`, update `updatedAt`

**Side effect (recommended):** webhook `incident.resolved` when status becomes `resolved`

---

## Settings — Organization

### Get organization settings

```
GET /api/settings/organization
```

**Response 200:**

```json
{
  "organizationName": "FiberOps Telecom",
  "supportEmail": "support@fiberops.example"
}
```

### Update organization settings

```
PATCH /api/settings/organization
```

**Request body:**

```json
{
  "organizationName": "My ISP",
  "supportEmail": "help@myisp.com"
}
```

| Field | Validation |
|-------|------------|
| `organizationName` | 2–100 chars |
| `supportEmail` | valid email |

**Response 200:** updated settings object

---

## Settings — Integrations

### Get integrations

```
GET /api/settings/integrations
```

**Response 200:**

```json
{
  "integrations": [
    {
      "id": "mapbox",
      "name": "Mapbox",
      "description": "...",
      "status": "connected",
      "enabled": true,
      "apiKeyMasked": "pk.••••••••"
    }
  ],
  "outboundWebhook": {
    "enabled": false,
    "url": "",
    "secretMasked": "whsec_••••",
    "events": ["incident.created"]
  }
}
```

### Update integration

```
PATCH /api/settings/integrations/:id
```

`:id` ∈ `mapbox` | `slack` | `pagerduty` | `stripe`

**Request body:**

```json
{
  "enabled": true,
  "apiKey": "sk_live_...",
  "webhookUrl": "https://hooks.slack.com/...",
  "routingKey": "pagerduty-routing-key"
}
```

Validation rules per provider — see `validateIntegrationUpdate()` in `src/modules/settings/schemas/integrationsSettings.schema.ts`.

**Response 200:** updated `Integration` (single integration object, not full payload)

**Response 404:** `{ "error": "Integration not found" }`

### Update outbound webhook

```
PATCH /api/settings/integrations/webhook
```

**Request body:**

```json
{
  "enabled": true,
  "url": "https://example.com/webhooks/fiberops",
  "secret": "signing-secret-min-8-chars",
  "events": ["incident.created", "incident.resolved"]
}
```

**Response 200:** updated `OutboundWebhook` (masked secret in response)

---

## Settings — Billing

### Get billing settings

```
GET /api/settings/billing
```

**Response 200:** `BillingSettingsPayload`

```json
{
  "settings": {
    "legalName": "FiberOps Ltd",
    "billingEmail": "billing@fiberops.example",
    "currency": "USD",
    "taxId": "TAX-123",
    "invoiceDelivery": "email",
    "lastSyncedAt": "2026-06-01T12:00:00.000Z"
  },
  "stripe": {
    "status": "connected",
    "enabled": true,
    "apiKeyMasked": "sk_••••"
  }
}
```

### Update billing settings

```
PATCH /api/settings/billing
```

**Request body:**

```json
{
  "legalName": "FiberOps Ltd",
  "billingEmail": "billing@example.com",
  "currency": "USD",
  "taxId": "TAX-123",
  "invoiceDelivery": "portal"
}
```

**Response 200:** full `BillingSettingsPayload`

### Sync billing with Stripe

```
POST /api/settings/billing/sync
```

**Request body:** none

**Response 200:** updated `BillingSettingsPayload` with fresh `lastSyncedAt`

**Response 400:** `{ "error": "..." }` if Stripe not configured

---

## Settings — Team

### Get team settings

```
GET /api/settings/team
```

**Response 200:**

```json
{
  "members": [
    {
      "id": "tm-001",
      "name": "Jordan Lee",
      "email": "jordan@fiberops.example",
      "role": "admin",
      "lastActiveAt": "2026-06-10T10:00:00.000Z"
    }
  ],
  "invites": [
    {
      "id": "inv-001",
      "email": "new@example.com",
      "role": "operator",
      "invitedAt": "2026-06-09T08:00:00.000Z"
    }
  ]
}
```

### Update team member role

```
PATCH /api/settings/team/members/:id
```

**Request body:**

```json
{ "role": "operator" }
```

**Response 200:** updated `TeamMember`  
**Response 400:** on failure (e.g. last admin demotion — enforce in prod)

### Create team invite

```
POST /api/settings/team/invites
```

**Request body:**

```json
{
  "email": "newuser@example.com",
  "role": "viewer"
}
```

**Response 200:** created `TeamInvite` (mock returns 200; prefer **201** in production)

### Revoke team invite

```
DELETE /api/settings/team/invites/:id
```

**Response 200:** updated `TeamSettings` (full object after removal)

---

## Stats

### Network usage time series

```
GET /api/stats/usage
```

**Response 200:**

```json
[
  { "label": "00:00", "value": 472.3 },
  { "label": "02:00", "value": 395.1 }
]
```

13 entries covering a 24-hour window. Used by dashboard fiber usage chart.

---

## Endpoint index

| Method | Path | Auth (prod) | Status |
|--------|------|-------------|--------|
| GET | `/api/assets` | operator+ | Implemented |
| GET | `/api/customers` | operator+ | Implemented |
| GET | `/api/customers/:id` | operator+ | Implemented |
| POST | `/api/customers` | operator+ | Implemented |
| PATCH | `/api/customers/:id` | operator+ | Implemented |
| GET | `/api/incidents` | operator+ | Implemented |
| GET | `/api/incidents/:id` | operator+ | Implemented |
| POST | `/api/incidents` | operator+ | Implemented |
| PATCH | `/api/incidents/:id` | operator+ | Implemented |
| GET | `/api/settings/organization` | admin | Implemented |
| PATCH | `/api/settings/organization` | admin | Implemented |
| GET | `/api/settings/integrations` | admin | Implemented |
| PATCH | `/api/settings/integrations/:id` | admin | Implemented |
| PATCH | `/api/settings/integrations/webhook` | admin | Implemented |
| GET | `/api/settings/billing` | admin | Implemented |
| PATCH | `/api/settings/billing` | admin | Implemented |
| POST | `/api/settings/billing/sync` | admin | Implemented |
| GET | `/api/settings/team` | admin | Implemented |
| PATCH | `/api/settings/team/members/:id` | admin | Implemented |
| POST | `/api/settings/team/invites` | admin | Implemented |
| DELETE | `/api/settings/team/invites/:id` | admin | Implemented |
| GET | `/api/stats/usage` | viewer+ | Implemented |

---

## OpenAPI

Consider generating OpenAPI 3.1 from this spec and the Zod schemas. Shared package approach:

1. Port Zod schemas to `packages/api-contract`
2. Use `@asteasolutions/zod-to-openapi` or tRPC for codegen
3. Publish OpenAPI artifact for frontend and external consumers

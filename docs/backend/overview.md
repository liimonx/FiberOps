# FiberOps Backend Overview

## Product context

FiberOps is a telecom network operations dashboard. Operators use it to:

- Visualize fiber infrastructure on a GIS map (poles, junction boxes, splitters, ONUs, PoPs, routes)
- Monitor customer connectivity and billing health
- Track and resolve network incidents
- Configure organization settings, team access, and third-party integrations

The frontend (`FiberOps` repo) is production-ready against **mocked APIs**. A backend team's job is to implement the same contract with persistent storage, auth, and real integrations.

## Architecture alignment

```
┌─────────────────────────────────────────────────────────────┐
│                    FiberOps Frontend (Next.js)              │
│  TanStack Query  →  fetch('/api/...')  →  WebSocket client  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / WS
┌──────────────────────────▼──────────────────────────────────┐
│                     API Gateway / BFF                       │
│  - REST /api/*                                              │
│  - WebSocket /ws                                            │
│  - Auth middleware (not yet in frontend)                    │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│   Network   │ │ Operations │ │  Platform   │
│   Service   │ │  Service   │ │  Service    │
│             │ │            │ │             │
│ - Assets    │ │ - Customers│ │ - Org settings
│ - Topology  │ │ - Incidents│ │ - Team/RBAC
│ - Geo index │ │ - Work ord.│ │ - Integrations
└─────────────┘ └────────────┘ └─────────────┘
       │              │              │
       └──────────────┴──────────────┘
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │   (+ PostGIS)  │
              └────────────────┘
```

### Why the frontend derives topology today

The network map does **not** call `/api/network/nodes` or `/api/network/connections`. Instead:

1. `GET /api/assets` and `GET /api/customers` return flat lists.
2. The client transforms assets/customers into map nodes (`transformAssetToNode`, `transformCustomerToNode`).
3. The client generates connections via spatial proximity (`generateTopology` in `src/modules/network-map/utils/dataTransformation.ts`).

A backend may initially return the same flat asset/customer lists. Later, expose an explicit topology API for accuracy (documented as **Phase 2** in [domain-models.md](./domain-models.md)).

## Recommended stack

These are suggestions, not requirements. Match your org standards.

| Layer | Recommendation | Rationale |
|-------|----------------|-----------|
| Runtime | Node.js (Fastify/NestJS) or Go | TypeScript parity with frontend domain types |
| Database | PostgreSQL + PostGIS | Geo queries for assets, routes, customer locations |
| Cache | Redis | Session, rate limits, WebSocket pub/sub |
| Real-time | Redis pub/sub → WebSocket gateway | Fan-out status updates to map clients |
| Auth | JWT or session cookies + RBAC | Team roles already modeled: `admin`, `operator`, `viewer` |
| Secrets | Vault / cloud KMS | Integration API keys, webhook signing secrets |

## Cross-cutting concerns

### Authentication (Phase 1 — required for production)

The frontend currently has **no auth headers**. Backend should:

1. Add auth (e.g. Bearer token or httpOnly session cookie).
2. Provide a login endpoint (not yet in frontend contract).
3. Scope all `/api/*` routes to an organization/tenant.
4. Enforce RBAC from [team roles](./domain-models.md#team--access-control).

Update the frontend separately to attach credentials once auth exists.

### Multi-tenancy

All settings, team, customers, incidents, and assets should be scoped by `organization_id`. The mock layer assumes a single implicit org.

### Timestamps

Use ISO 8601 strings in UTC (e.g. `2026-06-10T14:30:00.000Z`). The frontend stores and displays these as strings.

### ID generation

Mock conventions (backend may keep or replace with UUIDs):

| Entity | Mock pattern | Example |
|--------|--------------|---------|
| Customer | `cust-{NNN}` | `cust-014` |
| Incident | `inc-{NNN}` | `inc-005` |
| Asset | semantic slug | `pop-dhaka-01`, `onu-cust-001` |

If switching to UUIDs, ensure IDs remain strings; the frontend accepts both UUID and slug formats for network nodes.

### Outbound webhooks

When incidents are created/resolved or outages detected, POST signed payloads to the customer's configured webhook URL. Events defined in domain:

- `incident.created`
- `incident.resolved`
- `outage.detected`
- `work_order.updated`

## Planned modules (not yet in API contract)

These UI modules exist but have **no backend endpoints** yet. Plan them as separate epics:

### Work orders

Kanban board at `/work-orders` with columns: New, Assigned, In Progress, Review, Done. Suggested future API:

```
GET    /api/work-orders
POST   /api/work-orders
PATCH  /api/work-orders/:id
```

Suggested entity: `{ id, title, priority, type, status, assigneeId?, relatedIncidentId?, relatedAssetId?, createdAt, updatedAt }`.

### Assets (write operations)

Frontend only reads assets. Future needs:

```
GET    /api/assets/:id
POST   /api/assets
PATCH  /api/assets/:id        # status updates from map/ops
DELETE /api/assets/:id
```

`useUpdateAssetStatus` in `useNetworkData.ts` is currently a no-op mock mutation.

### Dashboard KPIs

Dashboard combines derived data from assets, incidents, and `/api/stats/usage`. A consolidated `GET /api/stats/dashboard` endpoint would reduce client-side aggregation.

### Reports

The `/reports` page remains a stub. Define reporting APIs when product requirements are finalized.

### Planning (implemented in MSW)

Network Planning at `/planning` is implemented against the mock API:

```
GET    /api/planning/proposals
GET    /api/planning/proposals/:id
POST   /api/planning/proposals
PATCH  /api/planning/proposals/:id
```

Map integration uses `/network-map?proposal=<id>` (view) and `&edit=1` (draw tool). See [api-reference.md](./api-reference.md#planning-proposals).

## Environment variables (backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Cache + pub/sub |
| `JWT_SECRET` / session config | Auth |
| `STRIPE_SECRET_KEY` | Billing sync (`POST /api/settings/billing/sync`) |
| `MAPBOX_ACCESS_TOKEN` | Server-side geocoding (optional) |
| `WS_PORT` / gateway path | WebSocket at `/ws` |

Frontend expects:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WS_URL` | e.g. `ws://localhost:8080/ws` |

## Latency expectations

MSW mocks introduce artificial delays (200–500 ms). The frontend tolerates moderate latency but:

- Incidents list refetches every **30 seconds**
- Active incidents refetch every **15 seconds**
- Customer list cache: **5 minutes** stale time

Design list endpoints to paginate before datasets grow beyond a few hundred rows.

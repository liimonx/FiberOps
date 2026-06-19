# Backend Project Guideline

This document describes how to build a **complete backend feature end-to-end** for FiberOps, mirroring the same layered workflow the frontend uses. The frontend is **contract-first**: types, Zod schemas, and MSW handlers define what production APIs must implement. Your backend should satisfy that contract without changing the UI.

Use this as a checklist when scaffolding a new backend repo or adding a new domain module (e.g. work orders, planning, reports).

---

## How frontend and backend align

The frontend builds features in a fixed order. Each layer has a backend equivalent:

| Layer | Frontend (FiberOps repo) | Backend (your project) |
|-------|--------------------------|------------------------|
| 1. Domain model | `src/types/domain.ts` | `packages/domain/` or `src/domain/` |
| 2. Validation | `src/modules/*/schemas/*.schema.ts` | Same Zod schemas (shared package or copied) |
| 3. Data store | `src/mocks/*.ts` (in-memory seed + CRUD) | PostgreSQL tables + migrations |
| 4. Data access | Mock store functions (`getX`, `createX`, …) | Repository layer (SQL/ORM queries) |
| 5. API contract | `src/mocks/apiRouter.ts` + `handlers.ts` | HTTP route handlers / controllers |
| 6. Real-time | WebSocket client in network-map module | WebSocket gateway at `/ws` |
| 7. Integration docs | `docs/backend/*.md` | OpenAPI or keep in sync with FiberOps docs |

**Rule:** Before writing backend code, read the frontend contract for that feature. The MSW router is the behavioral spec.

---

## Recommended project layout

For a greenfield monolith (adapt to your org standards):

```
fiberops-api/
├── apps/
│   ├── api/                      # REST + WebSocket entrypoint
│   │   ├── src/
│   │   │   ├── routes/           # HTTP route registration
│   │   │   ├── middleware/       # Auth, tenancy, error handling
│   │   │   └── ws/               # WebSocket gateway
│   │   └── main.ts
│   └── worker/                   # Async jobs (webhooks, billing sync)
├── packages/
│   ├── domain/                   # Types + Zod schemas (mirror frontend)
│   ├── db/
│   │   ├── migrations/
│   │   └── repositories/         # One repo per aggregate
│   └── shared/                   # Error helpers, ID generation, mappers
├── tests/
│   ├── integration/              # HTTP contract tests against MSW shapes
│   └── unit/
└── docs/                         # Symlink or copy FiberOps/docs/backend
```

For microservices, split by bounded context — see [Overview](./overview.md#architecture-alignment):

- **Network** — assets, topology, geo index
- **Operations** — customers, incidents, work orders
- **Platform** — org settings, team, integrations, billing
- **Realtime** — WebSocket fan-out

---

## End-to-end workflow: adding a feature module

Follow these steps in order. Work orders is the reference implementation on the frontend side.

### Step 1 — Lock the contract (read, don't invent)

1. Read entity types in `src/types/domain.ts`.
2. Read Zod schemas in `src/modules/<feature>/schemas/*.schema.ts`.
3. Read MSW routes in `src/mocks/apiRouter.ts` (and `src/mocks/handlers.ts` for dev-only behavior).
4. Read repository interface in `src/services/repositories.ts` if one exists.
5. Add or update [API Reference](./api-reference.md) and [Domain Models](./domain-models.md) if the feature is new.

**Do not** change request/response shapes unless you coordinate a frontend update.

### Step 2 — Domain package

Mirror frontend types exactly. Prefer a shared npm workspace package or code generation from OpenAPI so drift is impossible.

```typescript
// packages/domain/workOrder.ts — mirrors src/types/domain.ts
export type WorkOrderStatus = "new" | "assigned" | "in_progress" | "review" | "done";
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
```

Copy Zod schemas from the frontend module. Use the same field names, enums, and optional/required rules.

### Step 3 — Database schema

Add tables following [Database Schema](./database-schema.md). Conventions:

- **Multi-tenancy:** every tenant-scoped table includes `organization_id`.
- **Timestamps:** `created_at`, `updated_at` as `TIMESTAMPTZ`; expose as ISO 8601 UTC strings in API responses.
- **IDs:** frontend accepts string slugs (`WO-995`, `cust-014`) or UUIDs. Pick one strategy per entity and document it.
- **Geo fields:** store as PostGIS `GEOGRAPHY(POINT, 4326)`; map to `{ lat, lng }` in JSON.

Write a forward migration. Seed data can mirror `src/mocks/<feature>Data.ts` for local dev parity.

### Step 4 — Repository layer

One repository per aggregate. Functions mirror mock store names:

| Mock (frontend) | Repository (backend) |
|---------------|----------------------|
| `getWorkOrders()` | `WorkOrderRepository.list(orgId)` |
| `getWorkOrderById(id)` | `WorkOrderRepository.findById(orgId, id)` |
| `createWorkOrder(input)` | `WorkOrderRepository.create(orgId, input)` |
| `updateWorkOrder(id, input)` | `WorkOrderRepository.update(orgId, id, input)` |

Repositories:

- Accept `organizationId` on every call (from auth middleware).
- Return domain types, not raw DB rows.
- Map DB columns ↔ API JSON (especially geo, enums, nullable fields).
- Throw domain errors (`NotFoundError`, `ConflictError`) — do not leak SQL errors to HTTP.

### Step 5 — Service layer (business logic)

Keep HTTP handlers thin. Services orchestrate:

- Validation already done by Zod at the HTTP boundary.
- Cross-entity rules (e.g. resolving an incident when a linked work order closes).
- Side effects: WebSocket broadcasts, outbound webhooks, audit logs.

Example side effects for work orders:

- On status change → emit `work_order.updated` webhook (see [Overview](./overview.md#outbound-webhooks)).
- On assignment → optional notification (future).

### Step 6 — HTTP handlers

Implement the exact routes from [API Reference](./api-reference.md). Match MSW behavior:

#### Response shapes

| Operation | Shape |
|-----------|-------|
| List | `{ "items": T[] }` |
| Get one | `T` (unwrapped) |
| Create | `T` with status **201** |
| Update | `T` with status **200** |

#### Error shapes

Match `src/mocks/apiRouter.ts`:

```typescript
// 400 — validation
{ "error": "Validation failed", "issues": { "fieldErrors": {}, "formErrors": [] } }
// issues must be compatible with Zod's .flatten() output

// 400 — business rule
{ "error": "Cannot resolve incident without resolution notes" }

// 404
{ "error": "Work order not found" }
```

The frontend parses errors via `parseSettingsError()` in `src/modules/settings/lib/parseSettingsError.ts`. Preserve the `issues` key for 400 validation responses.

#### Handler pattern

```typescript
async function createWorkOrderHandler(req: Request, ctx: AuthContext) {
  const body = await req.json();
  const parsed = createWorkOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const workOrder = await workOrderService.create(ctx.organizationId, parsed.data);
  return Response.json(workOrder, { status: 201 });
}
```

#### Route registration checklist

For each resource, implement the same verbs the MSW router exposes:

```
GET    /api/work-orders           → list
GET    /api/work-orders/:id       → get
POST   /api/work-orders           → create
PATCH  /api/work-orders/:id       → partial update
```

Special flows (e.g. incident resolve) may use PATCH with discriminated body shapes — copy MSW logic from `apiRouter.ts`.

### Step 7 — WebSocket (if applicable)

Network map features require real-time events. See [WebSocket Protocol](./websocket-protocol.md).

- Endpoint: `ws://<host>/ws` (frontend env: `NEXT_PUBLIC_WS_URL`).
- Events: `status_broadcast`, `node_update`, `incident_alert` (planned).
- Use Redis pub/sub to fan out from API/worker to WebSocket gateway.
- Payload shapes must match frontend Zod schema in `src/modules/network-map/schemas/webSocketMessage.schema.ts`.

### Step 8 — Auth and tenancy middleware

The frontend currently sends **no auth headers**. For production:

1. Add auth middleware on all `/api/*` routes.
2. Resolve `organization_id` from the session/token.
3. Enforce RBAC (`admin`, `operator`, `viewer`) per [Domain Models](./domain-models.md#team--access-control).
4. Document login endpoints separately; coordinate a frontend update to attach credentials.

Every repository call must be scoped to the resolved organization.

### Step 9 — Contract tests

Verify your backend matches the frontend contract before disabling MSW:

1. **Snapshot tests** — compare JSON responses to MSW fixture output for each endpoint.
2. **Schema tests** — validate responses against Zod types from the domain package.
3. **Error tests** — 400 validation shape, 404 messages, 201 on create.
4. **Integration tests** — full CRUD cycle with real PostgreSQL (testcontainers or CI service).

Run the FiberOps frontend against your backend (see [Frontend Integration](./frontend-integration.md)) and confirm the UI works without mock changes.

### Step 10 — Documentation and handoff

Update FiberOps backend docs when you ship:

- [API Reference](./api-reference.md) — mark endpoint as **implemented**.
- [Database Schema](./database-schema.md) — if schema diverged from suggestion.
- [Overview](./overview.md) — move feature out of "Planned modules".

---

## Cross-cutting standards

### API conventions

| Topic | Standard |
|-------|----------|
| Base path | `/api` |
| Content-Type | `application/json` |
| Timestamps | ISO 8601 UTC strings (`2026-06-10T14:30:00.000Z`) |
| List pagination | Add when lists exceed ~500 rows; frontend currently expects full lists |
| CORS | Required if frontend and API are on different origins |

### Polling and cache awareness

Design list endpoints with frontend refresh intervals in mind:

| Resource | Frontend stale time | Refetch interval |
|----------|--------------------|--------------------|
| Assets | 60 s | — |
| Customers | 5 min | — |
| Incidents | — | 30 s (list), 15 s (active) |
| Work orders | 30 s | 30 s |

Keep list endpoints fast; add indexes for common filters (status, org, created_at).

### ID generation

| Entity | Mock pattern | Backend options |
|--------|--------------|-----------------|
| Customer | `cust-{NNN}` | Sequential per org or UUID |
| Incident | `inc-{NNN}` | Sequential per org or UUID |
| Asset | semantic slug | Keep slugs or migrate to UUID |
| Work order | `WO-{NNN}` | Sequential per org |

IDs must remain strings in JSON regardless of DB type.

### Outbound integrations

When implementing settings/integrations:

- Store API keys encrypted; never return full secrets (frontend checks `hasExistingCredentials` flags).
- Webhook signing secrets — same pattern as integration credentials.
- Billing sync via `POST /api/settings/billing/sync` — stub Stripe until credentials exist.

### Workers and async jobs

Offload from the request path:

- Outbound webhooks (`incident.created`, `incident.resolved`, `outage.detected`, `work_order.updated`)
- Billing sync with Stripe
- Report generation for large exports (if response time exceeds frontend timeout)

---

## Module completion checklist

Use this before marking a backend module done:

- [ ] Domain types match `src/types/domain.ts`
- [ ] Zod schemas match `src/modules/<feature>/schemas/`
- [ ] All MSW routes implemented with identical paths and methods
- [ ] List responses use `{ items: [] }`; single resources are unwrapped
- [ ] Validation errors return `{ error, issues }` with Zod flatten shape
- [ ] 404 messages are human-readable strings in `{ error }`
- [ ] Creates return 201; updates return 200
- [ ] `organization_id` enforced on every query
- [ ] RBAC enforced for mutating operations
- [ ] Database migration applied and documented
- [ ] Contract/integration tests pass
- [ ] Frontend works with `NEXT_PUBLIC_USE_MSW=false`
- [ ] API Reference and Domain Models docs updated

---

## Reference: Work Orders end-to-end

Frontend source (the contract):

| File | Purpose |
|------|---------|
| `src/types/domain.ts` | `WorkOrder`, enums |
| `src/modules/work-orders/schemas/workOrder.schema.ts` | Create/update validation |
| `src/mocks/workOrdersData.ts` | Seed data + in-memory CRUD |
| `src/mocks/apiRouter.ts` | Route handlers (lines ~work-orders) |
| `src/modules/work-orders/hooks/useWorkOrdersData.ts` | Expected fetch behavior |
| `src/services/repositories.ts` | `WorkOrderRepository` interface |

Backend deliverables for the same feature:

| File | Purpose |
|------|---------|
| `packages/domain/workOrder.ts` | Shared types |
| `packages/domain/schemas/workOrder.schema.ts` | Shared Zod |
| `packages/db/migrations/*_work_orders.sql` | Table + indexes |
| `packages/db/repositories/workOrderRepository.ts` | SQL access |
| `apps/api/src/services/workOrderService.ts` | Business rules |
| `apps/api/src/routes/workOrders.ts` | HTTP handlers |
| `tests/integration/workOrders.test.ts` | Contract tests |

---

## Environment variables

Backend:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Cache, pub/sub, sessions |
| `JWT_SECRET` | Auth signing |
| `STRIPE_SECRET_KEY` | Billing sync |
| `WS_PORT` | WebSocket gateway |

Frontend (when connecting):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WS_URL` | e.g. `ws://localhost:8080/ws` |
| `NEXT_PUBLIC_USE_MSW` | Set `false` when backend is ready |

See [Frontend Integration](./frontend-integration.md) for proxy/rewrite setup.

---

## Related documents

| Document | When to read |
|----------|--------------|
| [README](./README.md) | Quick contract summary and doc index |
| [Overview](./overview.md) | Architecture, service boundaries, planned modules |
| [Domain Models](./domain-models.md) | Entities, enums, business rules |
| [API Reference](./api-reference.md) | Every endpoint, request/response |
| [WebSocket Protocol](./websocket-protocol.md) | Real-time map events |
| [Database Schema](./database-schema.md) | PostgreSQL + PostGIS tables |
| [Frontend Integration](./frontend-integration.md) | Wiring Next.js to real backend |

# FiberOps Backend Documentation

This folder describes the backend contract implied by the FiberOps frontend. The UI is built **frontend-first**: MSW handlers in `src/mocks/handlers.ts` and domain types in `src/types/domain.ts` are the source of truth for what a production API must implement.

Use these docs to scaffold one or more backend services (monolith or microservices) that replace the mock layer without changing the UI.

## Documents

| Document | Purpose |
|----------|---------|
| [Overview](./overview.md) | System context, service boundaries, tech recommendations |
| [Domain Models](./domain-models.md) | Entities, enums, relationships, business rules |
| [API Reference](./api-reference.md) | REST endpoints, request/response shapes, validation |
| [WebSocket Protocol](./websocket-protocol.md) | Real-time events for the network map |
| [Database Schema](./database-schema.md) | Suggested PostgreSQL schema and indexes |
| [Frontend Integration](./frontend-integration.md) | How to wire the Next.js app to a real backend |

## Quick contract summary

- **Base path:** `/api`
- **Content type:** `application/json`
- **List responses:** `{ "items": T[] }`
- **Single resource:** entity object (not wrapped)
- **Validation errors (400):** `{ "error": "Validation failed", "issues": <Zod flatten output> }`
- **Other errors:** `{ "error": "<message>" }` with appropriate HTTP status
- **WebSocket:** `ws://<host>/ws` (env: `NEXT_PUBLIC_WS_URL`)

## Implementation status (frontend expectations)

| Area | REST API | WebSocket | Notes |
|------|----------|-----------|-------|
| Assets | `GET /api/assets` | `status_broadcast`, `node_update` | Read-only today; status updates are mocked client-side |
| Customers | Full CRUD (list, get, create, patch) | — | |
| Incidents | Full CRUD + resolve flow | `incident_alert` (planned) | List polled every 30s |
| Settings | Organization, integrations, billing, team | — | Multi-tenant by org recommended |
| Stats | `GET /api/stats/usage` | — | Dashboard chart data |
| Work orders | **Not implemented** | — | UI uses local state; see [Overview](./overview.md#planned-modules) |
| Network topology | **Derived client-side** | Partial | Backend may expose explicit graph API later |

## Source files in this repo

When in doubt, read the frontend source:

- Contract types: `src/types/domain.ts`
- Repository interfaces: `src/services/repositories.ts`
- MSW handlers (API behavior): `src/mocks/handlers.ts`
- Zod validation: `src/modules/**/schemas/*.schema.ts`
- Mock seed data: `src/mocks/*.ts`

## Suggested backend project layout

For a greenfield backend monorepo:

```
fiberops-api/
├── apps/
│   ├── api/              # REST + WebSocket gateway
│   └── worker/           # Outbound webhooks, billing sync jobs
├── packages/
│   ├── domain/           # Shared types (mirror src/types/domain.ts)
│   └── db/               # Migrations, repositories
└── docs/                 # Copy or symlink from FiberOps/docs/backend
```

For microservices, split by bounded context: **Network** (assets + topology), **Operations** (customers, incidents, work orders), **Platform** (settings, team, integrations, billing), **Realtime** (WebSocket fan-out).

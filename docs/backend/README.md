# FiberOps Backend Documentation

This folder describes the backend contract implied by the FiberOps frontend. The UI is built **frontend-first**: MSW handlers in `src/mocks/handlers.ts` and domain types in `src/types/domain.ts` are the source of truth for what a production API must implement.

Use these docs to scaffold one or more backend services (monolith or microservices) that replace the mock layer without changing the UI.

## Documents

| Document | Purpose |
|----------|---------|
| [Guideline](./guideline.md) | **End-to-end workflow** for building backend features (mirrors frontend E2E pattern) |
| [Next Tasks](./next-tasks.md) | **Prioritized backlog** — what to build after Mikrotik + Laravel scaffold |
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
| Assets | `GET/POST /api/assets` | `status_broadcast`, `node_update` | PATCH + netwatch via Mikrotik; see [Next Tasks](./next-tasks.md) |
| Customers | Full CRUD (list, get, create, patch) | `status_broadcast` (PPPoE) | `pppoeUsername` links Mikrotik sessions |
| Incidents | Full CRUD + resolve flow | `incident_alert` | Query invalidation wired; toasts/map overlay pending |
| Settings | Organization, integrations, billing, team | — | Mikrotik integration + encrypted credentials |
| Stats | `GET /api/stats/usage` | — | Live Mikrotik interface samples when configured |
| Integrations | Mikrotik test + config | — | Slack/Stripe/PagerDuty config-only |
| Work orders | Full CRUD (list, get, create, patch) | — | Kanban + table at `/work-orders`; list polled every 30s |
| Network topology | **Derived client-side** | Partial | Backend graph API planned — [Next Tasks P2-1](./next-tasks.md#p2-1--explicit-topology-api) |
| Mikrotik | Settings API + scheduler | Indirect via Redis→WS | See [Next Tasks](./next-tasks.md) for hardening backlog |

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

# Frontend Integration Guide

How to connect the FiberOps Next.js app to a real backend and retire MSW mocks.

## Current data flow

```
Page / Hook
    └── fetch('/api/...')     ← same-origin in dev (MSW intercepts)
    └── WebSocket (optional)  ← NEXT_PUBLIC_WS_URL
```

Repository interfaces in `src/services/repositories.ts` exist but **most hooks call `fetch` directly**. MSW handlers in `src/mocks/handlers.ts` define the live contract.

## Step 1 — Run the backend

Expose:

- REST at `http://localhost:<port>/api/*` (or behind a reverse proxy)
- WebSocket at `ws://localhost:<port>/ws`

Implement all endpoints in [API Reference](./api-reference.md).

## Step 2 — Proxy API requests (development)

### Option A: Next.js rewrites (recommended)

In `next.config.ts`:

```typescript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};
```

WebSocket cannot be rewritten by Next.js — point `NEXT_PUBLIC_WS_URL` directly at the backend.

### Option B: BFF in Next.js Route Handlers

Implement `src/app/api/**/route.ts` handlers that proxy to the backend. More control, more maintenance.

## Step 3 — Disable MSW

MSW starts from `src/mocks/browser.ts` when enabled in the app layout/provider.

For production backend integration:

1. Set env flag e.g. `NEXT_PUBLIC_USE_MSW=false`
2. Conditionally skip MSW initialization
3. Or remove the MSW provider entirely for staging/prod builds

Verify network tab shows requests hitting your backend, not service worker mocks.

## Step 4 — Environment variables

**.env.local (frontend):**

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk....

# Real backend
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Disable mocks when backend is ready
NEXT_PUBLIC_USE_MSW=false
```

**Backend CORS** (if frontend and API are on different origins):

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

Same-origin via Next.js rewrites avoids CORS in local dev.

## Step 5 — Add authentication (joint frontend/backend work)

Backend adds auth; frontend must follow up:

1. Login page + token/session storage
2. Attach header to all `fetch` calls:

```typescript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
}
```

3. Centralize in a small `apiClient` helper (future refactor)
4. Handle 401 → redirect to login

Suggested backend endpoints (not yet in UI):

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Step 6 — Validate contract parity

Use this checklist against staging:

### Assets

- [ ] `GET /api/assets` returns `{ items: [...] }` with all required Asset fields
- [ ] Asset ids match customer `relatedOnuId` references

### Customers

- [ ] List, get, create, patch match Zod schemas in `customer.schema.ts`
- [ ] 400 validation errors use `{ error, issues }` shape
- [ ] Create returns 201 with `billingStatus: "paid"`

### Incidents

- [ ] Resolve requires `resolutionNotes` (min 10 chars) when `status: "resolved"`
- [ ] `resolvedAt` populated on resolve
- [ ] List supports frontend poll (30 s interval)

### Settings

- [ ] Secrets returned masked only (`apiKeyMasked`, `secretMasked`)
- [ ] Integration PATCH preserves existing credentials when fields omitted
- [ ] Billing sync updates `lastSyncedAt`

### Stats

- [ ] `GET /api/stats/usage` returns array of `{ label, value }` (13 points)

### WebSocket

- [ ] Connect sends immediate `heartbeat`
- [ ] `status_broadcast` uses asset ids and NetworkStatus enum values
- [ ] Messages validate against `webSocketMessageSchema`

## Step 7 — Repository layer (optional refactor)

Today:

| Hook | Data source |
|------|-------------|
| `useCustomersData.ts` | `fetch('/api/customers')` |
| `useIncidentsData.ts` | `fetch('/api/incidents')` |
| `useNetworkData.ts` | `fetch('/api/assets')` + customers |
| Settings hooks | `fetch('/api/settings/...')` |

Future: implement `HttpCustomerRepository`, etc. in `src/services/http/` that implement interfaces from `repositories.ts`, then swap `serviceLocator.ts`:

```typescript
export const services: Services = {
  assets: httpAssetRepository,
  customers: httpCustomerRepository,
  incidents: httpIncidentRepository,
  settings: httpSettingsRepository,
};
```

Hooks would call repositories instead of raw fetch. Not required for initial backend cutover.

## Query cache keys

TanStack Query keys are centralized in `networkQueryKeys` (`useNetworkData.ts`):

| Key | Invalidated when |
|-----|------------------|
| `['network', 'customers', 'list']` | Customer create/update |
| `['network', 'customers', 'detail', id]` | Customer update |
| `['network', 'incidents', 'list']` | Incident create/update/resolve |
| `['network', 'assets', 'list']` | Asset status update (future) |

Backend does not need to know these; useful for integration testing.

## Deep links

Network map supports customer deep links via query params handled in `useMapCustomerDeepLink.ts`. Customer ids in URLs must match API ids.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| 404 "No mock handler for..." | MSW still active; disable or add backend proxy |
| Map loads but no live updates | `NEXT_PUBLIC_WS_URL` unset or WS server down |
| Validation errors show generic message | Backend error body missing `issues.fieldErrors` |
| Customers on map at wrong location | Missing `location` on customer records |
| Topology looks wrong | Expected with client-side `generateTopology`; implement Phase 2 graph API |

## Related frontend source map

| Concern | Path |
|---------|------|
| Domain types | `src/types/domain.ts` |
| MSW handlers | `src/mocks/handlers.ts` |
| Customer API hooks | `src/modules/customers/hooks/useCustomersData.ts` |
| Incident API hooks | `src/modules/incidents/hooks/useIncidentsData.ts` |
| Network/asset hooks | `src/modules/network-map/hooks/useNetworkData.ts` |
| Settings hooks | `src/modules/settings/hooks/*.ts` |
| Topology transform | `src/modules/network-map/utils/dataTransformation.ts` |
| Real-time | `src/modules/network-map/hooks/useRealTimeUpdates.ts` |

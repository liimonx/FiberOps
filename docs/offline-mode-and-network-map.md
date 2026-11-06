# Offline App and Network Map Changes

This guide describes the changes made to make FiberOps start reliably with local
mock data, keep the main interface responsive, restore the sidebar's expanded
default, and provide a useful network map without consuming Mapbox tile usage.

## Summary

The application now uses same-origin Next.js API routes backed by local mock
data for its normal app flow. It no longer waits for a browser service worker
before rendering, and the configured mock integrations record simulated
deliveries instead of sending requests to external services.

The network map has two rendering modes:

1. **Mapbox mode:** used when a Mapbox access token is configured. This retains
   the existing online basemap and Mapbox layers.
2. **Offline simulation mode:** used when no token is available. A local
   SVG/CSS renderer displays the mock network topology over a generated
   synthetic basemap. It does not request Mapbox tiles.

The offline renderer is a visualization for development and demonstration; its
synthetic roads and land features are not real geographic map data.

## How the local app flow works

```text
Page or data hook
    -> same-origin fetch("/api/...")
        -> Next.js API route
            -> src/mocks/apiRouter.ts
                -> local mock data
```

The mock API follows the application's existing request and response
contracts. The browser does not need to start MSW to access that data. A demo
session is bootstrapped through the local API, and the local session cookie is
recognized by the mock API router for protected settings requests.

## How the token-free map works

The existing network-map data provider loads local mock assets and customers,
then supplies the resulting nodes and connections to the Zustand map store.
`MapCanvas` selects the renderer based on token availability. With no token,
`OfflineMapCanvas`:

- Projects the stored node coordinates into a local SVG viewport.
- Draws mock roads, blocks, a river, network routes, coverage areas, and nodes.
- Uses status colors and restrained animation to distinguish active,
  degraded, warning, and failed equipment.
- Applies the existing layer visibility rules to network nodes, connections,
  coverage, and outages.
- Reads selection and viewport state from the same map store as the Mapbox
  renderer, allowing existing map UI to stay in place.
- Supports local pan/zoom, selection, style switching, building visibility,
  measurement points, and basic planning/impairment placement.

When a token is configured, the Mapbox renderer remains the active renderer;
the offline illustration is not layered over it.

## File-by-file changes

### App startup, local API, and responsiveness

| File | Change | Why it helps |
| --- | --- | --- |
| [`next.config.ts`](../next.config.ts) | Removed the environment-dependent rewrites that sent API traffic to an external backend. | The local Next.js API routes are now the consistent API destination; development does not depend on a separate backend being available. |
| [`src/app/providers.tsx`](../src/app/providers.tsx) | Removed the MSW startup effect and its render-until-ready gate; set shared query defaults (30-second stale time, one retry, and no refetch-on-focus). | Pages can render immediately instead of waiting on service-worker/interceptor startup, removing a source of startup hangs and race conditions while reducing repeated reads. |
| [`src/app/ClientRoot.tsx`](../src/app/ClientRoot.tsx) | Removed the `useMsw` prop plumbing into the app shell. | Simplifies the app shell now that local mock API behavior is the normal path. |
| [`src/lib/apiClient.ts`](../src/lib/apiClient.ts) | Added structured request/response/error logging and explicit request headers while retaining same-origin credentials and the in-memory token flow. | API failures are easier to diagnose without changing the local API contract or persisting bearer tokens in browser storage. |
| [`src/middleware.ts`](../src/middleware.ts) | Removed MSW-mode-dependent route protection; keeps the settings route gated on its session cookie. | Local demo navigation no longer depends on an environment flag, while settings still requires the expected session cookie. |
| [`src/mocks/apiRouter.ts`](../src/mocks/apiRouter.ts) | Added fallback session-cookie parsing when resolving a mock request's user. | Local authenticated API calls work with the HttpOnly session cookie created by the Next.js session route. |
| [`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx) | Adjusted network-trend query caching and removed periodic polling. | Prevents an always-on polling loop from doing unnecessary work on the dashboard. |
| [`src/components/home/NetworkGlance.tsx`](../src/components/home/NetworkGlance.tsx) | Adjusted usage-stat caching, added a cache retention time, and removed periodic polling. | Keeps home-screen data available during navigation while reducing repeated background requests that can contribute to a sluggish page. |
| [`src/modules/customers/hooks/useCustomersData.ts`](../src/modules/customers/hooks/useCustomersData.ts) | Disabled refetching the customer list merely because the window regains focus. | Avoids unnecessary repeat requests when returning to the app. |
| [`src/modules/incidents/hooks/useIncidentsData.ts`](../src/modules/incidents/hooks/useIncidentsData.ts) | Increased incident-list freshness duration, added cache retention, and disabled polling/focus-triggered refetch. | Lowers recurring mock API traffic while keeping incident data cached during normal navigation. |
| [`src/modules/work-orders/hooks/useWorkOrdersData.ts`](../src/modules/work-orders/hooks/useWorkOrdersData.ts) | Increased work-order cache freshness and removed periodic/focus-triggered refetching. | Avoids repeated background loading for data that is served locally and does not need constant polling in the demo. |
| [`src/modules/network-map/hooks/useNetworkData.ts`](../src/modules/network-map/hooks/useNetworkData.ts) | Adjusted active-incident query caching and removed short-interval polling. | Reduces recurring query work on the network-map screen. |
| [`src/components/dashboard/DashboardChartFrame.tsx`](../src/components/dashboard/DashboardChartFrame.tsx) | Added an explicit React import for the `React.ReactNode` type. | Keeps the component's type reference explicit and compatible with the project's TypeScript/JSX configuration. |

### Demo authentication and integrations

| File | Change | Why it helps |
| --- | --- | --- |
| [`src/components/AuthSessionBootstrap.tsx`](../src/components/AuthSessionBootstrap.tsx) | Always attempts the local demo-session bootstrap when no usable session is restored; removed the old MSW-mode condition. | The demo session can be established in the local API setup regardless of an MSW environment flag. |
| [`src/app/login/LoginPageClient.tsx`](../src/app/login/LoginPageClient.tsx) | Shows the demo administrator hint without checking an MSW mode flag. | The documented demo login stays discoverable in the local mock app. |
| [`src/modules/settings/components/SettingsAdminGuard.tsx`](../src/modules/settings/components/SettingsAdminGuard.tsx) | Bases the settings redirect on whether a user is present, not on the old API/MSW mode. | Keeps the settings guard aligned with the local demo session. |
| [`src/mocks/integrationsData.ts`](../src/mocks/integrationsData.ts) | Changed the default Mapbox integration to disconnected/disabled and removed its fake token. | A fabricated token no longer triggers an online Mapbox attempt or consumes map resources by default. |
| [`src/mocks/webhookDispatcher.ts`](../src/mocks/webhookDispatcher.ts) | Replaced outbound webhook, Slack, and PagerDuty HTTP delivery with locally recorded simulated delivery entries. | Mock events remain visible in the UI without contacting external systems, exposing configured secrets, or relying on external connectivity. |
| [`src/mocks/webhookDispatcher.test.ts`](../src/mocks/webhookDispatcher.test.ts) | Added a regression test that checks an enabled mock webhook is recorded and `fetch` is not called. | Protects the no-outbound-request behavior from future regressions. |

### Mock transport and test support

| File | Change | Why it helps |
| --- | --- | --- |
| [`src/mocks/browser.ts`](../src/mocks/browser.ts) | Removed the WebSocket interceptor from the optional browser mock network setup. | Avoids replacing/intercepting the global WebSocket implementation as part of mock setup. |
| [`src/mocks/handlers.ts`](../src/mocks/handlers.ts) | Restricts the optional mock WebSocket endpoint to its explicit mock URL and reduces the mock API handler delay. | Prevents broad or accidental WebSocket interception and makes mock requests feel more responsive if those handlers are used. |
| [`vitest.setup.ts`](../vitest.setup.ts) | Provides a small in-memory `localStorage` implementation for jsdom tests. | Tests can exercise persisted UI preferences without depending on browser storage support in the test environment. |

### Sidebar and offline network map

| File | Change | Why it helps |
| --- | --- | --- |
| [`src/patterns/Shell.tsx`](../src/patterns/Shell.tsx) | Changed the persisted sidebar preference key to a new version. | Users with an old saved collapsed preference start with the sidebar expanded again, while future preference changes can still persist. |
| [`src/modules/network-map/components/MapCanvas.tsx`](../src/modules/network-map/components/MapCanvas.tsx) | Added the offline renderer as the no-token branch while retaining Mapbox rendering for a configured token. | Missing Mapbox credentials now select a working local map rather than showing a token error; existing online behavior remains available. |
| [`src/modules/network-map/components/OfflineMapCanvas.tsx`](../src/modules/network-map/components/OfflineMapCanvas.tsx) | Added the local SVG renderer, synthetic basemap, topology and status visualization, layer filtering, viewport transforms, selection, pointer pan, wheel zoom, and basic map-tool placement. | Provides a map-like, interactive demo without tile requests, API keys, or an external map service. |
| [`src/modules/network-map/components/OfflineMapCanvas.module.css`](../src/modules/network-map/components/OfflineMapCanvas.module.css) | Added styles for the local basemap, coverage areas, node status, live-looking pulses, route traffic, responsive labels, and reduced-motion preferences. | Gives the map a polished active appearance using local CSS/SVG animation rather than remote tile imagery. |
| [`src/modules/network-map/components/MapControls.tsx`](../src/modules/network-map/components/MapControls.tsx) | Connected zoom, view style, building visibility, and compass controls to the local viewport/store when Mapbox is absent; keeps Mapbox methods for Mapbox mode. | The familiar toolbar remains functional in both map modes. |
| [`src/modules/network-map/stores/useNetworkMapStore.ts`](../src/modules/network-map/stores/useNetworkMapStore.ts) | Added offline style and synthetic-building visibility state, with default and reset values. | Offline visual controls share a single source of truth and reset predictably alongside the rest of the map state. |

### Documentation and dependency lock

| File | Change | Why it helps |
| --- | --- | --- |
| [`README.md`](../README.md) | Updated the overview, technology stack, map description, and setup notes for the local mock API and optional Mapbox path. | New developers can run the demo without assuming a live backend or Mapbox token. |
| [`docs/backend/README.md`](./backend/README.md) | Clarified that local Next.js routes use mock data in every environment and that WebSockets are optional. | Backend-contract documentation now describes the actual app behavior instead of the retired MSW startup flow. |
| [`docs/backend/frontend-integration.md`](./backend/frontend-integration.md) | Rewrote the current data-flow and future-backend instructions to reflect local route handlers and optional live updates. | Separates the current offline mock setup from the future steps for connecting a real backend. |
| [`docs/backend/api-reference.md`](./backend/api-reference.md) | Documented that no Mapbox token selects the local map renderer. | Makes the no-token behavior explicit in the API contract documentation. |
| [`yarn.lock`](../yarn.lock) | Updated resolved registry URL metadata; no application dependency was added for the local map. | Keeps the lockfile aligned with the installed dependency resolution without introducing a new map-rendering package. |

## Verification

Validation performed during implementation:

- `npm run build` completed successfully.
- `npm test` passed all 83 tests across 13 test files.
- ESLint reported no errors in the targeted changed map files. It still reports
  one hook-dependency warning in `MapCanvas.tsx`.
- Browser verification confirmed that the map renders without a Mapbox token
  and that zoom and offline style controls respond. Node selection and the
  restored expanded sidebar were also checked.

## What remains optional

- A real Mapbox basemap still requires an explicitly configured, valid token
  and internet access.
- The token-free map is a local network visualization, not a substitute for
  precise geographic basemap data or production GIS.
- Real backend APIs and live WebSocket updates remain future integration
  options; the normal demo data path is local mock data.
